import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inseminacaoSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pendentes = searchParams.get("pendentes");

  const userFazendas = await prisma.usuarioFazenda.findMany({
    where: { userId: session.user.id }, select: { fazendaId: true },
  });
  const fazendaIds = userFazendas.map((uf) => uf.fazendaId);

  const where: Record<string, unknown> = {
    bovino: { fazendaId: { in: fazendaIds } },
  };
  if (pendentes === "true") where.prenpiez = null;

  const inseminacoes = await prisma.inseminacao.findMany({
    where,
    include: { bovino: { select: { brinco: true, nome: true, fazenda: { select: { nome: true } } } } },
    orderBy: { data: "desc" },
  });

  return NextResponse.json(inseminacoes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const validation = inseminacaoSchema.safeParse(body);
  if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

  const inseminacao = await prisma.inseminacao.create({
    data: {
      ...validation.data,
      data: new Date(validation.data.data),
    },
  });

  return NextResponse.json(inseminacao, { status: 201 });
}
