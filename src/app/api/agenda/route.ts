import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function GET(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pendentes = searchParams.get("pendentes") === "true";
  const bovinoId = searchParams.get("bovinoId");

  const where: any = {
    fazendaId: { in: ctx.fazendaIds },
  };

  if (pendentes) {
    where.concluido = false;
  }

  if (bovinoId) {
    where.bovinoId = bovinoId;
  }

  const eventos = await prisma.agendaEvento.findMany({
    where,
    include: { bovino: { select: { brinco: true, nome: true } } },
    orderBy: [{ dataHora: "asc" }, { prioridade: "asc" }],
  });

  return NextResponse.json(eventos);
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
  const { titulo, tipo, dataHora, prioridade, notas, bovinoId } = body;

  if (!titulo || !tipo || !dataHora) {
    return NextResponse.json(
      { error: "Campos obrigatórios faltando" },
      { status: 400 }
    );
  }

  const evento = await prisma.agendaEvento.create({
    data: {
      titulo,
      tipo,
      dataHora: new Date(dataHora),
      prioridade: prioridade || "MEDIA",
      notas,
      bovinoId: bovinoId || null,
      fazendaId: ctx.fazendaAtiva.id,
    },
  });

  return NextResponse.json(evento, { status: 201 });
}
