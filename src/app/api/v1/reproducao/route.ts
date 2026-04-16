import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { inseminacaoSchema } from "@/lib/validators";
import { withApiAuth, apiSuccess, apiCreated, apiError, parsePagination } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const auth = await withApiAuth(req, "read");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;

  const { searchParams } = new URL(req.url);
  const { page, perPage, skip } = parsePagination(searchParams);
  const bovinoId = searchParams.get("bovinoId") || undefined;

  const where: Record<string, unknown> = {
    bovino: { fazendaId: ctx.fazendaId, deletedAt: null },
  };
  if (bovinoId) where.bovinoId = bovinoId;

  const [inseminacoes, total] = await Promise.all([
    prisma.inseminacao.findMany({
      where,
      include: {
        bovino: { select: { brinco: true, nome: true } },
        veterinario: { select: { nome: true } },
        bancoSemen: { select: { nomeTouro: true, codigo: true } },
      },
      orderBy: { data: "desc" },
      skip,
      take: perPage,
    }),
    prisma.inseminacao.count({ where }),
  ]);

  return apiSuccess(inseminacoes, { page, perPage, total }, rlHeaders);
}

export async function POST(req: NextRequest) {
  const auth = await withApiAuth(req, "write");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;

  const body = await req.json();
  const validation = inseminacaoSchema.safeParse(body);
  if (!validation.success) {
    return apiError("validation_error", validation.error.issues[0].message, 400, rlHeaders);
  }

  const bovino = await prisma.bovino.findFirst({
    where: { id: validation.data.bovinoId, fazendaId: ctx.fazendaId, deletedAt: null },
  });
  if (!bovino) return apiError("not_found", "Bovino não encontrado nesta fazenda.", 404, rlHeaders);

  const inseminacao = await prisma.inseminacao.create({
    data: { ...validation.data, data: new Date(validation.data.data) },
  });

  return apiCreated(inseminacao, rlHeaders);
}
