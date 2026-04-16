import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

  const body = await req.json();
  const validation = loteSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  const { bovinoIds, bancoSemenId, ...rest } = validation.data;
  const quantidadeNecessaria = bovinoIds.length;

  try {
    if (bancoSemenId) {
      const semen = await prisma.bancoSemen.findUnique({
        where: { id: bancoSemenId },
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
  } catch (error: any) {
    return NextResponse.json({ error: "Ocorreu um erro no lançamento: " + error.message }, { status: 500 });
  }
}
