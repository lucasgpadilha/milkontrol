import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pesagemSchema } from "@/lib/validators";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas) return NextResponse.json({ error: "Selecione uma fazenda" }, { status: 400 });

  const body = await req.json();
  const validation = pesagemSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  // Verificar propriedade do bovino
  const bovino = await prisma.bovino.findFirst({
    where: { 
      id: validation.data.bovinoId,
      fazendaId: { in: ctx.fazendaIds },
      deletedAt: null 
    }
  });

  if (!bovino) {
    return NextResponse.json({ error: "Bovino não encontrado ou não pertence a esta fazenda" }, { status: 404 });
  }

  const pesagem = await prisma.pesagem.create({
    data: {
      ...validation.data,
      data: new Date(validation.data.data),
    }
  });

  return NextResponse.json(pesagem, { status: 201 });
}
