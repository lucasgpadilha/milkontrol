import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";
import { z } from "zod";

const secaLoteSchema = z.object({
  dataSecagem: z.string().min(1),
  bovinos: z.array(z.string()).min(1, "Selecione pelo menos um bovino"), // Array de bovinos
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas) return NextResponse.json({ error: "Selecione uma fazenda" }, { status: 400 });

  const body = await req.json();
  const validation = secaLoteSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  const { dataSecagem, bovinos } = validation.data;
  const fimLactacao = new Date(dataSecagem);

  // Assert ownership
  const count = await prisma.bovino.count({
    where: {
      id: { in: bovinos },
      fazendaId: { in: ctx.fazendaIds }
    }
  });

  if (count !== bovinos.length) {
    return NextResponse.json({ error: "Animais inválidos ou não pertencentes à fazenda." }, { status: 403 });
  }

  // Update existing lactations
  await prisma.lactacao.updateMany({
    where: {
      bovinoId: { in: bovinos },
      fim: null // apenas lactações ativas
    },
    data: {
      fim: fimLactacao
    }
  });

  return NextResponse.json({ ok: true, message: "Lactações encerradas com sucesso." }, { status: 200 });
}
