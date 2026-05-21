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
  const { cura, dataCura } = body;

  const mastite = await prisma.registroMastite.findUnique({
    where: { id },
    include: { bovino: true },
  });

  if (!mastite || !ctx.fazendaIds.includes(mastite.bovino.fazendaId)) {
    return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
  }

  const updated = await prisma.registroMastite.update({
    where: { id },
    data: {
      cura: cura !== undefined ? cura : mastite.cura,
      dataCura: dataCura ? new Date(dataCura) : mastite.dataCura,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const mastite = await prisma.registroMastite.findUnique({
    where: { id },
    include: { bovino: true },
  });

  if (!mastite || !ctx.fazendaIds.includes(mastite.bovino.fazendaId)) {
    return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
  }

  await prisma.registroMastite.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
}
