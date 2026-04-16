import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";
import { z } from "zod";

const piqueteSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
});

export async function GET() {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const piquetes = await prisma.piquete.findMany({
    where: { fazendaId: { in: ctx.fazendaIds } },
    include: {
      fazenda: { select: { nome: true } },
      _count: { select: { bovinos: true } },
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(piquetes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas || !ctx.fazendaAtiva) {
    return NextResponse.json({ error: "Selecione uma fazenda ativa para criar piquetes" }, { status: 400 });
  }

  const body = await req.json();
  const validation = piqueteSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  // Check duplicate name
  const existing = await prisma.piquete.findFirst({
    where: { nome: validation.data.nome, fazendaId: ctx.fazendaAtiva.id },
  });
  if (existing) {
    return NextResponse.json({ error: "Já existe um piquete com este nome nesta fazenda" }, { status: 400 });
  }

  const piquete = await prisma.piquete.create({
    data: {
      ...validation.data,
      fazendaId: ctx.fazendaAtiva.id,
    },
  });

  return NextResponse.json(piquete, { status: 201 });
}
