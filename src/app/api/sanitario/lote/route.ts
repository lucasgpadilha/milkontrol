import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";
import { z } from "zod";

const loteSanitarioSchema = z.object({
  data: z.string().min(1),
  tipo: z.enum(["VACINA", "VERMIFUGO", "MEDICAMENTO", "TRATAMENTO"]),
  produto: z.string().min(1, "O produto é obrigatório"),
  dose: z.string().optional(),
  responsavel: z.string().optional(),
  veterinarioId: z.string().optional(),
  diasCarencia: z.coerce.number().min(0).default(0),
  observacoes: z.string().optional(),
  bovinos: z.array(z.string()).min(1, "Selecione pelo menos um bovino"), // Array of IDs
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas) return NextResponse.json({ error: "Selecione uma fazenda" }, { status: 400 });

  const body = await req.json();
  const validation = loteSanitarioSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  const data = validation.data;
  const dataDate = new Date(data.data);
  
  // Calculate fimCarencia
  let fimCarencia = null;
  if (data.diasCarencia > 0) {
    fimCarencia = new Date(dataDate);
    fimCarencia.setDate(fimCarencia.getDate() + data.diasCarencia);
  }

  // Validading bovinos ownership
  const validBovinos = await prisma.bovino.findMany({
    where: { 
      id: { in: data.bovinos },
      fazendaId: { in: ctx.fazendaIds },
      deletedAt: null
    },
    select: { id: true }
  });

  if (validBovinos.length !== data.bovinos.length) {
    return NextResponse.json({ error: "Alguns animais não pertencem à sua fazenda ou foram deletados." }, { status: 403 });
  }

  // Batch insert
  const records = data.bovinos.map(bovinoId => ({
    bovinoId,
    data: dataDate,
    tipo: data.tipo,
    produto: data.produto,
    dose: data.dose || null,
    responsavel: data.responsavel || null,
    veterinarioId: data.veterinarioId || null,
    diasCarencia: data.diasCarencia,
    fimCarencia,
    observacoes: data.observacoes || null
  }));

  await prisma.registroSanitario.createMany({ data: records });

  return NextResponse.json({ ok: true, count: records.length }, { status: 201 });
}
