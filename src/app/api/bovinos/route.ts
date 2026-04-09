import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bovinoSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fazendaId = searchParams.get("fazendaId");
  const sexo = searchParams.get("sexo");
  const situacao = searchParams.get("situacao");
  const busca = searchParams.get("busca");

  // Get user's farms
  const userFazendas = await prisma.usuarioFazenda.findMany({
    where: { userId: session.user.id },
    select: { fazendaId: true },
  });
  const fazendaIds = userFazendas.map((uf) => uf.fazendaId);

  const where: Record<string, unknown> = {
    fazendaId: fazendaId ? { in: [fazendaId] } : { in: fazendaIds },
  };

  if (sexo) where.sexo = sexo;
  if (situacao) where.situacao = situacao;
  if (busca) {
    where.OR = [
      { brinco: { contains: busca, mode: "insensitive" } },
      { nome: { contains: busca, mode: "insensitive" } },
      { raca: { contains: busca, mode: "insensitive" } },
    ];
  }

  const bovinos = await prisma.bovino.findMany({
    where,
    include: {
      fazenda: { select: { nome: true } },
      mae: { select: { id: true, brinco: true, nome: true } },
      lactacoes: {
        where: { fim: null },
        take: 1,
        orderBy: { inicio: "desc" },
      },
      _count: {
        select: { producoes: true, inseminacoes: true, filhos: true },
      },
    },
    orderBy: { brinco: "asc" },
  });

  return NextResponse.json(bovinos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { fazendaId, ...rest } = body;

  const validation = bovinoSchema.safeParse(rest);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    );
  }

  // Verify farm ownership
  const membership = await prisma.usuarioFazenda.findFirst({
    where: { userId: session.user.id, fazendaId },
  });
  if (!membership) {
    return NextResponse.json({ error: "Fazenda não encontrada" }, { status: 403 });
  }

  const bovino = await prisma.bovino.create({
    data: {
      ...validation.data,
      dataNascimento: new Date(validation.data.dataNascimento),
      fazendaId,
    },
  });

  return NextResponse.json(bovino, { status: 201 });
}
