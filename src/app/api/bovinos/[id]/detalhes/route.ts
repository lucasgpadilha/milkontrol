import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const bovino = await prisma.bovino.findFirst({
    where: {
      id,
      fazendaId: { in: ctx.fazendaIds }, // Garante o escopo da fazenda do usuário
    },
    include: {
      piquete: { select: { nome: true } },
      producoes: {
        orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
      },
      lactacoes: {
        orderBy: { inicio: "desc" },
      },
      inseminacoes: {
        include: {
          veterinario: { select: { nome: true } },
          bancoSemen: { select: { codigo: true, nomeTouro: true } },
        },
        orderBy: { data: "desc" },
      },
      registrosSanitarios: {
        include: {
          veterinario: { select: { nome: true } },
        },
        orderBy: { data: "desc" },
      },
      pesagens: {
        orderBy: { data: "desc" },
      },
    },
  });

  if (!bovino) {
    return NextResponse.json({ error: "Bovino não encontrado" }, { status: 404 });
  }

  // Calculate age logically assuming simple diff
  const nascimentoDate = new Date(bovino.dataNascimento);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - nascimentoDate.getTime());
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
  
  return NextResponse.json({
      ...bovino,
      idadeMeses: diffMonths
  });
}
