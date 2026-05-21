import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function GET(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ativa = searchParams.get("ativa") === "true";
  const bovinoId = searchParams.get("bovinoId");

  const where: any = {
    bovino: { fazendaId: { in: ctx.fazendaIds } },
  };

  if (ativa) {
    where.cura = { not: true };
  }

  if (bovinoId) {
    where.bovinoId = bovinoId;
  }

  const mastites = await prisma.registroMastite.findMany({
    where,
    orderBy: { data: "desc" },
    include: {
      bovino: { select: { brinco: true, nome: true } },
      veterinario: { select: { nome: true } },
    },
  });

  return NextResponse.json(mastites);
}

export async function POST(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas || !ctx.fazendaAtiva) {
    return NextResponse.json(
      { error: "Selecione uma fazenda ativa" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { data, tipo, quarto, resultado, tratamento, diasTratamento, observacoes, bovinoId, veterinarioId } = body;

  if (!data || !tipo || !quarto || !bovinoId) {
    return NextResponse.json(
      { error: "Campos obrigatórios faltando" },
      { status: 400 }
    );
  }

  // Verifica se o bovino pertence à fazenda
  const bovino = await prisma.bovino.findFirst({
    where: { id: bovinoId, fazendaId: ctx.fazendaAtiva.id },
  });

  if (!bovino) {
    return NextResponse.json({ error: "Bovino não encontrado" }, { status: 404 });
  }

  const mastite = await prisma.registroMastite.create({
    data: {
      data: new Date(data),
      tipo,
      quarto,
      resultado,
      tratamento,
      diasTratamento: diasTratamento ? parseInt(diasTratamento) : null,
      observacoes,
      bovinoId,
      veterinarioId: veterinarioId || null,
      cura: false,
    },
  });

  return NextResponse.json(mastite, { status: 201 });
}
