import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { lactacaoSchema } from "@/lib/validators";
import { withApiAuth, apiSuccess, apiCreated, apiError, parsePagination } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const auth = await withApiAuth(req, "read");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;

  const { searchParams } = new URL(req.url);
  const { page, perPage, skip } = parsePagination(searchParams);
  const bovinoId = searchParams.get("bovinoId") || undefined;
  const ativa = searchParams.get("ativa"); // "true" = somente ativas

  const where: Record<string, unknown> = {
    bovino: { fazendaId: ctx.fazendaId, deletedAt: null },
  };
  if (bovinoId) where.bovinoId = bovinoId;
  if (ativa === "true") where.fim = null;

  const [lactacoes, total] = await Promise.all([
    prisma.lactacao.findMany({
      where,
      include: { bovino: { select: { brinco: true, nome: true } } },
      orderBy: { inicio: "desc" },
      skip,
      take: perPage,
    }),
    prisma.lactacao.count({ where }),
  ]);

  return apiSuccess(lactacoes, { page, perPage, total }, rlHeaders);
}

export async function POST(req: NextRequest) {
  const auth = await withApiAuth(req, "write");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;

  const body = await req.json();
  const validation = lactacaoSchema.safeParse(body);
  if (!validation.success) {
    return apiError("validation_error", validation.error.issues[0].message, 400, rlHeaders);
  }

  // Validar que o bovino pertence à fazenda
  const bovino = await prisma.bovino.findFirst({
    where: { id: validation.data.bovinoId, fazendaId: ctx.fazendaId, deletedAt: null },
  });
  if (!bovino) return apiError("not_found", "Bovino não encontrado nesta fazenda.", 404, rlHeaders);

  const lactacao = await prisma.lactacao.create({
    data: {
      inicio: new Date(validation.data.inicio),
      fim: validation.data.fim ? new Date(validation.data.fim) : null,
      bovinoId: validation.data.bovinoId,
    },
  });

  return apiCreated(lactacao, rlHeaders);
}
