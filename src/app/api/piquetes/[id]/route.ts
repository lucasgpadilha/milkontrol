import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertOwnership } from "@/lib/ownership";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";
import { z } from "zod";

const piqueteUpdateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  seteDiasAtras.setHours(0, 0, 0, 0);

  const piquete = await prisma.piquete.findFirst({
    where: { id, fazendaId: { in: ctx.fazendaIds } },
    include: {
      fazenda: { select: { nome: true } },
      bovinos: {
        include: {
          lactacoes: {
            where: { fim: null },
            orderBy: { inicio: "desc" },
            take: 1,
          },
          producoes: {
            where: {
              data: { gte: seteDiasAtras },
            },
          },
        },
        orderBy: { brinco: "asc" },
      },
    },
  });

  if (!piquete) return NextResponse.json({ error: "Piquete não encontrado" }, { status: 404 });

  // Calcular estatísticas
  const bovinos = piquete.bovinos;
  const hoje = new Date();

  const emLactacao = bovinos.filter(b => b.lactacoes.length > 0);
  const totalProducao7d = bovinos.reduce((acc, b) => {
    return acc + b.producoes.reduce((s, p) => s + Number(p.quantidade), 0);
  }, 0);
  const mediaProducaoDiaria = emLactacao.length > 0 ? totalProducao7d / 7 : 0;

  const delTotal = emLactacao.reduce((acc, b) => {
    const dias = Math.floor((hoje.getTime() - new Date(b.lactacoes[0].inicio).getTime()) / 86400000);
    return acc + dias;
  }, 0);
  const delMedio = emLactacao.length > 0 ? Math.round(delTotal / emLactacao.length) : 0;

  // Contagem por raça
  const porRaca: Record<string, number> = {};
  bovinos.forEach(b => { porRaca[b.raca] = (porRaca[b.raca] || 0) + 1; });

  return NextResponse.json({
    ...piquete,
    stats: {
      totalBovinos: bovinos.length,
      emLactacao: emLactacao.length,
      secas: bovinos.filter(b => b.sexo === "FEMEA" && b.lactacoes.length === 0).length,
      machos: bovinos.filter(b => b.sexo === "MACHO").length,
      mediaProducaoDiaria: Number(mediaProducaoDiaria.toFixed(1)),
      delMedio,
      porRaca: Object.entries(porRaca).map(([raca, count]) => ({ raca, count })),
    },
    bovinos: bovinos.map(b => ({
      id: b.id,
      brinco: b.brinco,
      nome: b.nome,
      raca: b.raca,
      sexo: b.sexo,
      situacao: b.situacao,
      emLactacao: b.lactacoes.length > 0,
      del: b.lactacoes.length > 0
        ? Math.floor((hoje.getTime() - new Date(b.lactacoes[0].inicio).getTime()) / 86400000)
        : null,
      producaoDia: Number((b.producoes.reduce((s, p) => s + Number(p.quantidade), 0) / 7).toFixed(1)),
    })),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const check = await assertOwnership("piquete", id);
  if (!check) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();
  const validation = piqueteUpdateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  const piquete = await prisma.piquete.update({
    where: { id },
    data: validation.data,
  });

  return NextResponse.json(piquete);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const check = await assertOwnership("piquete", id);
  if (!check) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  await prisma.piquete.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
