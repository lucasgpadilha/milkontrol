import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function GET(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const lotes = await prisma.loteIatf.findMany({
    where: { fazendaId: { in: ctx.fazendaIds } },
    include: {
      protocolo: { include: { etapas: { orderBy: { dia: "asc" } } } },
      animais: { include: { bovino: { select: { brinco: true, nome: true } } } },
    },
    orderBy: { dataInicio: "desc" },
  });

  return NextResponse.json(lotes);
}

export async function POST(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas || !ctx.fazendaAtiva) {
    return NextResponse.json({ error: "Selecione uma fazenda ativa" }, { status: 400 });
  }

  const body = await req.json();
  const { nome, dataInicio, protocoloId, bovinosIds } = body;

  if (!nome || !dataInicio || !protocoloId || !bovinosIds || bovinosIds.length === 0) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const protocolo = await prisma.protocoloIatf.findUnique({
    where: { id: protocoloId },
    include: { etapas: true },
  });

  if (!protocolo) {
    return NextResponse.json({ error: "Protocolo não encontrado" }, { status: 404 });
  }

  const startDate = new Date(dataInicio);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Criar o lote e os animais
    const lote = await tx.loteIatf.create({
      data: {
        nome,
        dataInicio: startDate,
        protocoloId,
        fazendaId: ctx.fazendaAtiva!.id,
        animais: {
          create: bovinosIds.map((bId: string) => ({ bovinoId: bId })),
        },
      },
    });

    // 2. Gerar eventos na agenda para cada animal, para cada etapa
    const eventosToCreate = [];

    for (const bId of bovinosIds) {
      for (const etapa of protocolo.etapas) {
        const etapaDate = new Date(startDate);
        etapaDate.setDate(startDate.getDate() + etapa.dia);

        eventosToCreate.push({
          titulo: `Lote IATF (${lote.nome}): ${etapa.titulo}`,
          tipo: "IATF_ETAPA" as const,
          dataHora: etapaDate,
          prioridade: "ALTA" as const,
          notas: etapa.descricao || "",
          bovinoId: bId,
          fazendaId: ctx.fazendaAtiva!.id,
        });
      }
    }

    if (eventosToCreate.length > 0) {
      await tx.agendaEvento.createMany({
        data: eventosToCreate,
      });
    }

    return lote;
  });

  return NextResponse.json(result, { status: 201 });
}
