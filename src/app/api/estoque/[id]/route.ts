import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { quantidade, tipoMovimentacao, motivo } = body;

  const insumo = await prisma.estoqueInsumo.findUnique({
    where: { id },
  });

  if (!insumo || !ctx.fazendaIds.includes(insumo.fazendaId)) {
    return NextResponse.json({ error: "Insumo não encontrado" }, { status: 404 });
  }

  const qty = parseFloat(quantidade);

  if (tipoMovimentacao === "SAIDA" && insumo.quantidade < qty) {
    return NextResponse.json({ error: "Estoque insuficiente" }, { status: 400 });
  }

  const updatedInsumo = await prisma.$transaction(async (tx) => {
    const updated = await tx.estoqueInsumo.update({
      where: { id },
      data: {
        quantidade: tipoMovimentacao === "ENTRADA" ? { increment: qty } : { decrement: qty },
      },
    });

    await tx.movimentacaoEstoque.create({
      data: {
        tipo: tipoMovimentacao,
        quantidade: qty,
        motivo: motivo || "Movimentação manual",
        insumoId: id,
      },
    });

    return updated;
  });

  return NextResponse.json(updatedInsumo);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const insumo = await prisma.estoqueInsumo.findUnique({
    where: { id },
  });

  if (!insumo || !ctx.fazendaIds.includes(insumo.fazendaId)) {
    return NextResponse.json({ error: "Insumo não encontrado" }, { status: 404 });
  }

  await prisma.estoqueInsumo.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
}
