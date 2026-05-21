import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

async function ensureDefaultProtocols() {
  const count = await prisma.protocoloIatf.count({
    where: { fazendaId: null },
  });

  if (count === 0) {
    // Seed Ovsynch
    const ovsynch = await prisma.protocoloIatf.create({
      data: {
        nome: "Ovsynch Clássico",
        descricao: "Protocolo padrão para sincronização de ovulação.",
      },
    });

    await prisma.etapaIatf.createMany({
      data: [
        { protocoloId: ovsynch.id, dia: 0, titulo: "GnRH", descricao: "Aplicação de GnRH (Indução de nova onda folicular)" },
        { protocoloId: ovsynch.id, dia: 7, titulo: "PGF2α", descricao: "Aplicação de Prostaglandina (Lise do corpo lúteo)" },
        { protocoloId: ovsynch.id, dia: 9, titulo: "GnRH", descricao: "Aplicação de GnRH (Indução da ovulação)" },
        { protocoloId: ovsynch.id, dia: 10, titulo: "IATF", descricao: "Inseminação Artificial (16 a 20h após o 2º GnRH)" },
      ],
    });

    // Seed Presynch
    const presynch = await prisma.protocoloIatf.create({
      data: {
        nome: "Presynch-Ovsynch",
        descricao: "Aumento na taxa de prenhez, iniciado semanas antes do Ovsynch.",
      },
    });

    await prisma.etapaIatf.createMany({
      data: [
        { protocoloId: presynch.id, dia: 0, titulo: "PGF2α (Pré-1)", descricao: "Primeira Prostaglandina" },
        { protocoloId: presynch.id, dia: 14, titulo: "PGF2α (Pré-2)", descricao: "Segunda Prostaglandina" },
        { protocoloId: presynch.id, dia: 26, titulo: "GnRH (Ovsynch D0)", descricao: "Início do Ovsynch" },
        { protocoloId: presynch.id, dia: 33, titulo: "PGF2α", descricao: "PGF2α do Ovsynch" },
        { protocoloId: presynch.id, dia: 35, titulo: "GnRH", descricao: "GnRH final do Ovsynch" },
        { protocoloId: presynch.id, dia: 36, titulo: "IATF", descricao: "Inseminação Artificial" },
      ],
    });
  }
}

export async function GET(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await ensureDefaultProtocols();

  const protocolos = await prisma.protocoloIatf.findMany({
    where: {
      OR: [
        { fazendaId: null },
        { fazendaId: { in: ctx.fazendaIds } }
      ]
    },
    include: {
      etapas: { orderBy: { dia: "asc" } },
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(protocolos);
}
