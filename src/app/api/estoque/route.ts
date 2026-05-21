import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function GET(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const insumos = await prisma.estoqueInsumo.findMany({
    where: { fazendaId: { in: ctx.fazendaIds } },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(insumos);
}

export async function POST(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas || !ctx.fazendaAtiva) {
    return NextResponse.json({ error: "Selecione uma fazenda ativa" }, { status: 400 });
  }

  const body = await req.json();
  const { nome, tipo, quantidade, unidade, estoqueMinimo, observacoes } = body;

  if (!nome || !tipo || !unidade) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const insumo = await prisma.estoqueInsumo.create({
    data: {
      nome,
      tipo,
      quantidade: quantidade ? parseFloat(quantidade) : 0,
      unidade,
      estoqueMinimo: estoqueMinimo ? parseFloat(estoqueMinimo) : 0,
      observacoes,
      fazendaId: ctx.fazendaAtiva.id,
    },
  });

  if (insumo.quantidade > 0) {
    await prisma.movimentacaoEstoque.create({
      data: {
        tipo: "ENTRADA",
        quantidade: insumo.quantidade,
        motivo: "Saldo Inicial",
        insumoId: insumo.id,
      },
    });
  }

  return NextResponse.json(insumo, { status: 201 });
}
