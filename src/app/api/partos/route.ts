import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function GET(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bovinoId = searchParams.get("bovinoId");

  const where: any = {
    fazendaId: { in: ctx.fazendaIds },
  };

  if (bovinoId) {
    where.bovinoId = bovinoId;
  }

  const partos = await prisma.parto.findMany({
    where,
    include: {
      bovino: { select: { brinco: true, nome: true } },
      bezerro: { select: { brinco: true, nome: true } },
    },
    orderBy: { data: "desc" },
  });

  return NextResponse.json(partos);
}

export async function POST(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas || !ctx.fazendaAtiva) {
    return NextResponse.json({ error: "Selecione uma fazenda ativa" }, { status: 400 });
  }

  const body = await req.json();
  const { data, tipoParto, pesoBezerroKg, sexoBezerro, colostroFornecido, gemelar, observacoes, bovinoId } = body;

  if (!data || !tipoParto || !bovinoId) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  // Verifica se a vaca existe e pertence à fazenda
  const vaca = await prisma.bovino.findFirst({
    where: { id: bovinoId, fazendaId: { in: ctx.fazendaIds }, sexo: "FEMEA" },
  });

  if (!vaca) return NextResponse.json({ error: "Vaca não encontrada" }, { status: 404 });

  // Iniciar transação: Registrar o parto e atualizar o evento da agenda (se houver) e iniciar lactação (opcional)
  const result = await prisma.$transaction(async (tx) => {
    // 1. Cria o registro do parto
    const parto = await tx.parto.create({
      data: {
        data: new Date(data),
        tipoParto,
        pesoBezerroKg: pesoBezerroKg ? parseFloat(pesoBezerroKg) : null,
        sexoBezerro: sexoBezerro || null,
        colostroFornecido: !!colostroFornecido,
        gemelar: !!gemelar,
        observacoes,
        bovinoId,
        fazendaId: ctx.fazendaAtiva!.id,
      },
    });

    // 2. Concluir evento de "PARTO_PREVISTO" em aberto para esta vaca
    await tx.agendaEvento.updateMany({
      where: {
        bovinoId,
        tipo: "PARTO_PREVISTO",
        concluido: false,
      },
      data: {
        concluido: true,
        dataConclusao: new Date(),
      },
    });

    // 3. Atualizar última inseminação para "não pendente"
    await tx.inseminacao.updateMany({
      where: { bovinoId, prenhez: true },
      data: { dataPartoPrevisto: null },
    });

    // 4. Iniciar nova lactação se for aborto/parto normal (qualquer parto inicia lactação)
    await tx.lactacao.create({
      data: {
        bovinoId,
        inicio: new Date(data),
      },
    });

    return parto;
  });

  return NextResponse.json(result, { status: 201 });
}
