import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bovinoSchema } from "@/lib/validators";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function GET(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fazendaId = searchParams.get("fazendaId");
  const sexo = searchParams.get("sexo");
  const situacao = searchParams.get("situacao");
  const busca = searchParams.get("busca");

  const where: Record<string, unknown> = {
    fazendaId: fazendaId ? { in: [fazendaId] } : { in: ctx.fazendaIds },
    deletedAt: null,
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
      piquete: { select: { id: true, nome: true } },
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

  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas || !ctx.fazendaAtiva) {
    return NextResponse.json({ error: "Selecione uma fazenda ativa para cadastrar bovinos" }, { status: 400 });
  }

  const body = await req.json();
  
  const validation = bovinoSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    );
  }

  const bovino = await prisma.bovino.create({
    data: {
      ...validation.data,
      dataNascimento: new Date(validation.data.dataNascimento),
      fazendaId: ctx.fazendaAtiva.id,
    },
  });

  return NextResponse.json(bovino, { status: 201 });
}
