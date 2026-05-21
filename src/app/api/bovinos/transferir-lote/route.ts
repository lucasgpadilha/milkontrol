import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function POST(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas || !ctx.fazendaAtiva) {
    return NextResponse.json(
      { error: "Selecione uma fazenda ativa para transferir animais" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { bovinoIds, piqueteDestinoId } = body;

  if (!Array.isArray(bovinoIds) || bovinoIds.length === 0) {
    return NextResponse.json(
      { error: "Selecione pelo menos um animal" },
      { status: 400 }
    );
  }

  if (!piqueteDestinoId) {
    return NextResponse.json(
      { error: "Selecione o piquete de destino" },
      { status: 400 }
    );
  }

  // Verificar se o piquete de destino pertence à fazenda ativa
  const piquete = await prisma.piquete.findFirst({
    where: { id: piqueteDestinoId, fazendaId: ctx.fazendaAtiva.id },
  });

  if (!piquete) {
    return NextResponse.json(
      { error: "Piquete de destino não encontrado nesta fazenda" },
      { status: 404 }
    );
  }

  // Transferir todos os bovinos selecionados
  const result = await prisma.bovino.updateMany({
    where: {
      id: { in: bovinoIds },
      fazendaId: ctx.fazendaAtiva.id,
      deletedAt: null,
    },
    data: { piqueteId: piqueteDestinoId },
  });

  return NextResponse.json({
    count: result.count,
    piquete: piquete.nome,
  });
}
