import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";
import { z } from "zod";

const loteProducaoSchema = z.object({
  data: z.string().min(1),
  turno: z.enum(["MANHA", "TARDE", "NOITE"]),
  registros: z.array(z.object({
    bovinoId: z.string().min(1),
    quantidade: z.number().positive(),
  })).min(1, "Nenhum registro informado"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas) return NextResponse.json({ error: "Selecione uma fazenda" }, { status: 400 });

  const body = await req.json();
  const validation = loteProducaoSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  const { data, turno, registros } = validation.data;
  const dataDate = new Date(data);

  // Filtrar registros com quantidade > 0 (ignorar vazios)
  const registrosValidos = registros.filter(r => r.quantidade > 0);
  if (registrosValidos.length === 0) {
    return NextResponse.json({ error: "Nenhuma quantidade informada" }, { status: 400 });
  }

  // Validar que todos os bovinos pertencem à fazenda e estão em lactação
  const bovinoIds = registrosValidos.map(r => r.bovinoId);
  const bovinos = await prisma.bovino.findMany({
    where: {
      id: { in: bovinoIds },
      fazendaId: { in: ctx.fazendaIds },
      sexo: "FEMEA",
    },
    include: {
      lactacoes: { where: { fim: null }, take: 1 },
    },
  });

  const bovinoMap = new Map(bovinos.map(b => [b.id, b]));
  const erros: string[] = [];

  for (const reg of registrosValidos) {
    const bov = bovinoMap.get(reg.bovinoId);
    if (!bov) {
      erros.push(`Bovino ${reg.bovinoId} não encontrado ou não pertence a esta fazenda.`);
    } else if (bov.lactacoes.length === 0) {
      erros.push(`${bov.brinco} (${bov.nome || ''}) não está em lactação.`);
    }
  }

  if (erros.length > 0) {
    return NextResponse.json({ error: erros.join(" | ") }, { status: 400 });
  }

  // Verificar carência em massa
  const emCarencia = await prisma.registroSanitario.findMany({
    where: {
      bovinoId: { in: bovinoIds },
      fimCarencia: { gte: new Date() },
    },
    select: { bovinoId: true, bovino: { select: { brinco: true } }, fimCarencia: true },
  });

  if (emCarencia.length > 0) {
    const alertas = emCarencia.map(c => `${c.bovino.brinco} (carência até ${new Date(c.fimCarencia!).toLocaleDateString("pt-BR")})`);
    return NextResponse.json({
      error: `Vacas em carência: ${alertas.join(", ")}. Remova-as do lançamento.`,
    }, { status: 400 });
  }

  // Criar todos os registros em transação
  const records = registrosValidos.map(r => ({
    data: dataDate,
    turno: turno as any,
    quantidade: r.quantidade,
    bovinoId: r.bovinoId,
  }));

  await prisma.producaoLeite.createMany({ data: records });

  return NextResponse.json({ ok: true, count: registrosValidos.length }, { status: 201 });
}
