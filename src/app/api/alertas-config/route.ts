import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";
import { assertRole } from "@/lib/rbac";
import { CONFIG_ALERTAS_PADRAO } from "@/lib/inteligencia-engine";

const schema = z.object({
  quedaProducaoPct: z.coerce.number().min(5).max(80),
  delSecagemAviso: z.coerce.number().int().min(150).max(330),
  delSecagemCritico: z.coerce.number().int().min(180).max(360),
  diasPrenhezPendente: z.coerce.number().int().min(15).max(120),
  diasCarenciaVencendo: z.coerce.number().int().min(1).max(30),
  diasSecaRetorno: z.coerce.number().int().min(30).max(180),
}).refine((data) => data.delSecagemCritico > data.delSecagemAviso, {
  message: "DEL crítico deve ser maior que o DEL de aviso",
  path: ["delSecagemCritico"],
});

function respostaJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });
}

async function getFazendaAtivaObrigatoria() {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return { error: respostaJson({ error: "Não autorizado" }, { status: 401 }) };
  if (ctx.todas || !ctx.fazendaAtiva) {
    return {
      error: respostaJson(
        { error: "Selecione uma fazenda ativa para configurar alertas" },
        { status: 400 }
      ),
    };
  }

  return { fazendaId: ctx.fazendaAtiva.id };
}

export async function GET() {
  const result = await getFazendaAtivaObrigatoria();
  if (result.error) return result.error;

  const config = await prisma.configuracaoAlertas.upsert({
    where: { fazendaId: result.fazendaId },
    update: {},
    create: {
      fazendaId: result.fazendaId,
      ...CONFIG_ALERTAS_PADRAO,
    },
  });

  return respostaJson({ config });
}

export async function PUT(req: NextRequest) {
  const roleCheck = await assertRole(["PROPRIETARIO", "GERENTE"]);
  if (!roleCheck) {
    return respostaJson({ error: "Sem permissão para configurar alertas" }, { status: 403 });
  }

  const result = await getFazendaAtivaObrigatoria();
  if (result.error) return result.error;

  const payload = await req.json().catch(() => null);
  const validation = schema.safeParse(payload);
  if (!validation.success) {
    return respostaJson({ error: validation.error.issues[0].message }, { status: 400 });
  }

  const config = await prisma.configuracaoAlertas.upsert({
    where: { fazendaId: result.fazendaId },
    update: validation.data,
    create: {
      fazendaId: result.fazendaId,
      ...validation.data,
    },
  });

  return respostaJson({ config });
}
