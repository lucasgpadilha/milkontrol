import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tanqueSchema, movimentacaoTanqueSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const userFazendas = await prisma.usuarioFazenda.findMany({
    where: { userId: session.user.id }, select: { fazendaId: true },
  });
  const fazendaIds = userFazendas.map((uf) => uf.fazendaId);

  const tanques = await prisma.tanque.findMany({
    where: { fazendaId: { in: fazendaIds } },
    include: {
      fazenda: { select: { nome: true } },
      movimentacoes: { orderBy: { data: "desc" }, take: 10 },
    },
  });

  return NextResponse.json(tanques);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { fazendaId, ...rest } = body;

  // Check if it's a tank or a movimentação
  if (body.tanqueId) {
    // It's a movimentação
    const validation = movimentacaoTanqueSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

    const tanque = await prisma.tanque.findFirst({ where: { id: validation.data.tanqueId } });
    if (!tanque) return NextResponse.json({ error: "Tanque não encontrado" }, { status: 404 });

    const novoVolume = validation.data.tipo === "ENTRADA"
      ? tanque.volumeAtual + validation.data.quantidade
      : tanque.volumeAtual - validation.data.quantidade;

    // RN04: Volume não pode ultrapassar capacidade
    if (novoVolume > tanque.capacidadeMax) {
      return NextResponse.json({
        error: `Volume ultrapassaria capacidade máxima do tanque (${tanque.capacidadeMax}L). Volume atual: ${tanque.volumeAtual}L`,
      }, { status: 400 });
    }

    if (novoVolume < 0) {
      return NextResponse.json({
        error: `Volume insuficiente no tanque. Volume atual: ${tanque.volumeAtual}L`,
      }, { status: 400 });
    }

    const [movimentacao] = await prisma.$transaction([
      prisma.movimentacaoTanque.create({
        data: {
          ...validation.data,
          data: new Date(validation.data.data),
        },
      }),
      prisma.tanque.update({
        where: { id: validation.data.tanqueId },
        data: { volumeAtual: novoVolume },
      }),
    ]);

    return NextResponse.json(movimentacao, { status: 201 });
  } else {
    // It's a new tank
    const validation = tanqueSchema.safeParse(rest);
    if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

    const tanque = await prisma.tanque.create({
      data: { ...validation.data, fazendaId },
    });

    return NextResponse.json(tanque, { status: 201 });
  }
}
