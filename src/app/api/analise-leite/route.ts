import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function GET(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mesesParam = parseInt(searchParams.get("meses") || "12");
  
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - mesesParam, 1);

  const analises = await prisma.analiseLeite.findMany({
    where: {
      fazendaId: { in: ctx.fazendaIds },
      data: { gte: start },
    },
    orderBy: { data: "desc" },
  });

  return NextResponse.json(analises);
}

export async function POST(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas || !ctx.fazendaAtiva) {
    return NextResponse.json(
      { error: "Selecione uma fazenda ativa para registrar a análise" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { data, ccs, cpp, gordura, proteina, esnf, laboratorio } = body;

  if (!data || ccs === undefined || cpp === undefined) {
    return NextResponse.json(
      { error: "Data, CCS e CPP são obrigatórios" },
      { status: 400 }
    );
  }

  const analise = await prisma.analiseLeite.create({
    data: {
      data: new Date(data),
      ccs: Number(ccs),
      cpp: Number(cpp),
      gordura: gordura ? Number(gordura) : null,
      proteina: proteina ? Number(proteina) : null,
      esnf: esnf ? Number(esnf) : null,
      laboratorio,
      fazendaId: ctx.fazendaAtiva.id,
    },
  });

  return NextResponse.json(analise, { status: 201 });
}
