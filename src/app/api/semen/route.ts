import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";
import { bancoSemenSchema } from "@/lib/validators";

export async function GET() {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const semens = await prisma.bancoSemen.findMany({
    where: { fazendaId: { in: ctx.fazendaIds } },
    include: {
      fazenda: { select: { nome: true } },
    },
    orderBy: { nomeTouro: "asc" },
  });

  return NextResponse.json(semens);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas || !ctx.fazendaAtiva) {
    return NextResponse.json({ error: "Selecione uma fazenda ativa para cadastrar do banco de sêmen" }, { status: 400 });
  }

  const body = await req.json();
  const validation = bancoSemenSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  const semen = await prisma.bancoSemen.create({
    data: {
      ...validation.data,
      fazendaId: ctx.fazendaAtiva.id,
    },
  });

  return NextResponse.json(semen, { status: 201 });
}
