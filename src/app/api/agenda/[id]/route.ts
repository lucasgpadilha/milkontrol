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
  const { concluido } = body;

  const evento = await prisma.agendaEvento.findUnique({
    where: { id },
  });

  if (!evento || !ctx.fazendaIds.includes(evento.fazendaId)) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const updated = await prisma.agendaEvento.update({
    where: { id },
    data: {
      concluido: concluido,
      dataConclusao: concluido ? new Date() : null,
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

  const evento = await prisma.agendaEvento.findUnique({
    where: { id },
  });

  if (!evento || !ctx.fazendaIds.includes(evento.fazendaId)) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  await prisma.agendaEvento.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
}
