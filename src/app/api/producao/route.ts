import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { producaoSchema } from "@/lib/validators";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";
import { assertRole } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bovinoId = searchParams.get("bovinoId");
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");

  const where: Record<string, unknown> = {
    bovino: { fazendaId: { in: ctx.fazendaIds } },
  };
  if (bovinoId) where.bovinoId = bovinoId;
  if (dataInicio || dataFim) {
    where.data = {};
    if (dataInicio) (where.data as Record<string, unknown>).gte = new Date(dataInicio);
    if (dataFim) (where.data as Record<string, unknown>).lte = new Date(dataFim + "T23:59:59");
  }

  const producoes = await prisma.producaoLeite.findMany({
    where,
    include: { bovino: { select: { brinco: true, nome: true } } },
    orderBy: { data: "desc" },
    take: 500,
  });

  return NextResponse.json(producoes);
}

export async function POST(req: NextRequest) {
  // RBAC: Somente PROPRIETARIO, GERENTE e OPERADOR podem lançar produção
  const roleCheck = await assertRole(["PROPRIETARIO", "GERENTE", "OPERADOR"]);
  if (!roleCheck) return NextResponse.json({ error: "Sem permissão para esta operação" }, { status: 403 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const validation = producaoSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  // Validate: only lactating cows can register production (RN01, RN02)
  // + Ownership: bovino deve pertencer à fazenda do usuário
  // + Soft-delete: bovino não pode estar arquivado
  const bovino = await prisma.bovino.findFirst({
    where: { id: validation.data.bovinoId, fazendaId: { in: ctx.fazendaIds }, deletedAt: null },
    include: { lactacoes: { where: { fim: null }, take: 1 } },
  });

  if (!bovino) return NextResponse.json({ error: "Bovino não encontrado" }, { status: 404 });
  if (bovino.sexo !== "FEMEA") return NextResponse.json({ error: "Apenas vacas podem registrar produção (RN01)" }, { status: 400 });
  if (bovino.lactacoes.length === 0) return NextResponse.json({ error: "Vaca não está em lactação (RN02)" }, { status: 400 });

  // Check carência
  const carencia = await prisma.registroSanitario.findFirst({
    where: { bovinoId: bovino.id, fimCarencia: { gte: new Date() } },
  });
  if (carencia) {
    return NextResponse.json({
      error: `Vaca em período de carência até ${new Date(carencia.fimCarencia!).toLocaleDateString("pt-BR")}. Leite não pode ser registrado para venda.`,
      warning: true,
    }, { status: 400 });
  }

  const producao = await prisma.producaoLeite.create({
    data: {
      ...validation.data,
      data: new Date(validation.data.data),
    },
  });

  return NextResponse.json(producao, { status: 201 });
}
