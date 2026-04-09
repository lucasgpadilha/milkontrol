import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lactacaoSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ativas = searchParams.get("ativas");

  const userFazendas = await prisma.usuarioFazenda.findMany({
    where: { userId: session.user.id }, select: { fazendaId: true },
  });
  const fazendaIds = userFazendas.map((uf) => uf.fazendaId);

  const where: Record<string, unknown> = {
    bovino: { fazendaId: { in: fazendaIds } },
  };
  if (ativas === "true") where.fim = null;

  const lactacoes = await prisma.lactacao.findMany({
    where,
    include: { bovino: { select: { brinco: true, nome: true, raca: true, fazenda: { select: { nome: true } } } } },
    orderBy: { inicio: "desc" },
  });

  return NextResponse.json(lactacoes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const validation = lactacaoSchema.safeParse(body);
  if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

  const bovino = await prisma.bovino.findFirst({ where: { id: validation.data.bovinoId } });
  if (!bovino) return NextResponse.json({ error: "Bovino não encontrado" }, { status: 404 });
  if (bovino.sexo !== "FEMEA") return NextResponse.json({ error: "Apenas vacas podem ter lactação" }, { status: 400 });

  // Close any open lactation first
  await prisma.lactacao.updateMany({
    where: { bovinoId: validation.data.bovinoId, fim: null },
    data: { fim: new Date(validation.data.inicio) },
  });

  const lactacao = await prisma.lactacao.create({
    data: {
      inicio: new Date(validation.data.inicio),
      fim: validation.data.fim ? new Date(validation.data.fim) : null,
      bovinoId: validation.data.bovinoId,
    },
  });

  return NextResponse.json(lactacao, { status: 201 });
}
