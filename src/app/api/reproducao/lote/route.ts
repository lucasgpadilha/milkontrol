import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";
import { assertRole } from "@/lib/rbac";

const loteSchema = z.object({
  bovinoIds: z.array(z.string()).min(1, "Selecione pelo menos um animal"),
  data: z.string().min(1, "Data é obrigatória"),
  tipo: z.literal("ARTIFICIAL"),
  responsavel: z.string().min(1, "Responsável é obrigatório"),
  veterinarioId: z.string().optional(),
  bancoSemenId: z.string().optional(),
  observacoes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const roleCheck = await assertRole(["PROPRIETARIO", "GERENTE", "VETERINARIO"]);
  if (!roleCheck) return NextResponse.json({ error: "Sem permissão para esta operação" }, { status: 403 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.fazendaIds.length === 0) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const validation = loteSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  const { bovinoIds, bancoSemenId, ...rest } = validation.data;
  const quantidadeNecessaria = bovinoIds.length;

  try {
    const bovinos = await prisma.bovino.findMany({
      where: {
        id: { in: bovinoIds },
        fazendaId: { in: ctx.fazendaIds },
        sexo: "FEMEA",
        situacao: "ATIVA",
        deletedAt: null,
      },
      select: { id: true },
    });

    if (bovinos.length !== bovinoIds.length) {
      return NextResponse.json(
        { error: "Um ou mais bovinos não pertencem à fazenda selecionada ou não estão aptos para reprodução" },
        { status: 404 }
      );
    }

    if (rest.veterinarioId) {
      const veterinario = await prisma.veterinario.findFirst({
        where: { id: rest.veterinarioId, fazendaId: { in: ctx.fazendaIds }, ativo: true },
      });
      if (!veterinario) {
        return NextResponse.json({ error: "Veterinário não encontrado nesta fazenda" }, { status: 404 });
      }
    }

    if (bancoSemenId) {
      const semen = await prisma.bancoSemen.findFirst({
        where: { id: bancoSemenId, fazendaId: { in: ctx.fazendaIds } },
      });
      
      if (!semen) {
        return NextResponse.json({ error: "Sêmen não encontrado no catálogo/estoque" }, { status: 404 });
      }

      if (semen.quantidade < quantidadeNecessaria) {
        return NextResponse.json({ 
          error: `Estoque de ${semen.codigo} insuficiente. Você selecionou ${quantidadeNecessaria} vacas, mas só há ${semen.quantidade} doses disponíveis.` 
        }, { status: 400 });
      }
    }

    const records = bovinoIds.map(bovinoId => ({
      bovinoId,
      bancoSemenId,
      ...rest,
      data: new Date(rest.data),
    }));

    const operations = [];

    // 1. Create Inseminacoes in batch
    operations.push(prisma.inseminacao.createMany({
      data: records,
    }));

    // 2. Decrement stock
    if (bancoSemenId) {
      operations.push(prisma.bancoSemen.update({
        where: { id: bancoSemenId },
        data: {
          quantidade: {
            decrement: quantidadeNecessaria
          }
        }
      }));
    }

    await prisma.$transaction(operations);

    return NextResponse.json({ ok: true, count: quantidadeNecessaria }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    return NextResponse.json({ error: "Ocorreu um erro no lançamento: " + message }, { status: 500 });
  }
}
