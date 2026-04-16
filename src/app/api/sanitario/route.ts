import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registroSanitarioSchema } from "@/lib/validators";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function GET(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bovinoId = searchParams.get("bovinoId");
  const emCarencia = searchParams.get("emCarencia");

  const where: Record<string, unknown> = {
    bovino: { fazendaId: { in: ctx.fazendaIds } },
  };
  if (bovinoId) where.bovinoId = bovinoId;
  if (emCarencia === "true") where.fimCarencia = { gte: new Date() };

  const registros = await prisma.registroSanitario.findMany({
    where,
    include: { 
      bovino: { select: { brinco: true, nome: true } },
      veterinario: { select: { nome: true } }
    },
    orderBy: { data: "desc" },
  });

  return NextResponse.json(registros);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const validation = registroSanitarioSchema.safeParse(body);
  if (!validation.success) return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });

  const dataRegistro = new Date(validation.data.data);
  const fimCarencia = validation.data.diasCarencia > 0
    ? new Date(dataRegistro.getTime() + validation.data.diasCarencia * 24 * 60 * 60 * 1000)
    : null;

  const registro = await prisma.registroSanitario.create({
    data: {
      ...validation.data,
      data: dataRegistro,
      fimCarencia,
    },
  });

  return NextResponse.json(registro, { status: 201 });
}
