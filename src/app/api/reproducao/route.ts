import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inseminacaoSchema } from "@/lib/validators";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";
import { assertRole } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pendentes = searchParams.get("pendentes");

  const where: Record<string, unknown> = {
    bovino: { fazendaId: { in: ctx.fazendaIds } },
  };
  if (pendentes === "true") where.prenhez = null;

  const inseminacoes = await prisma.inseminacao.findMany({
    where,
    include: { 
      bovino: { select: { brinco: true, nome: true, fazenda: { select: { nome: true } } } },
      veterinario: { select: { nome: true } },
      bancoSemen: { select: { codigo: true, nomeTouro: true } }
    },
    orderBy: { data: "desc" },
  });

  return NextResponse.json(inseminacoes);
}

export async function POST(req: NextRequest) {
  // RBAC: PROPRIETARIO, GERENTE e VETERINARIO podem registrar inseminações
  const roleCheck = await assertRole(["PROPRIETARIO", "GERENTE", "VETERINARIO"]);
  if (!roleCheck) return NextResponse.json({ error: "Sem permissão para esta operação" }, { status: 403 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const validation = inseminacaoSchema.safeParse(body);
  if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

  if (validation.data.bancoSemenId) {
    const semen = await prisma.bancoSemen.findFirst({ where: { id: validation.data.bancoSemenId, fazendaId: { in: ctx.fazendaIds } } });
    if (!semen) return NextResponse.json({ error: "Catálogo de Sêmen não encontrado" }, { status: 404 });
    if (semen.quantidade < 1) return NextResponse.json({ error: "Estoque insuficiente para a dose selecionada" }, { status: 400 });
  }

  const operations = [];

  operations.push(prisma.inseminacao.create({
    data: {
      ...validation.data,
      data: new Date(validation.data.data),
    },
  }));

  if (validation.data.bancoSemenId) {
    operations.push(prisma.bancoSemen.update({
      where: { id: validation.data.bancoSemenId },
      data: { quantidade: { decrement: 1 } }
    }));
  }

  const [inseminacao] = await prisma.$transaction(operations);

  return NextResponse.json(inseminacao, { status: 201 });
}
