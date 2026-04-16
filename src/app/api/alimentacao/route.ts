import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";
import { registroAlimentacaoSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const registros = await prisma.registroAlimentacao.findMany({
    where: { fazendaId: { in: ctx.fazendaIds } },
    include: {
      piquete: { select: { nome: true, _count: { select: { bovinos: true } } } },
    },
    orderBy: { data: "desc" },
  });

  return NextResponse.json(registros);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas) return NextResponse.json({ error: "Selecione uma fazenda" }, { status: 400 });

  const body = await req.json();
  const validation = registroAlimentacaoSchema.safeParse(body);
  if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

  const registro = await prisma.registroAlimentacao.create({
    data: {
      ...validation.data,
      data: new Date(validation.data.data),
      fazendaId: ctx.fazendaIds[0],
    },
  });

  return NextResponse.json(registro, { status: 201 });
}
