import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { registroSanitarioSchema } from "@/lib/validators";
import { withApiAuth, apiSuccess, apiCreated, apiError, parsePagination, parseDateFilters } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const auth = await withApiAuth(req, "read");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;

  const { searchParams } = new URL(req.url);
  const { page, perPage, skip } = parsePagination(searchParams);
  const dateFilters = parseDateFilters(searchParams);
  const bovinoId = searchParams.get("bovinoId") || undefined;
  const tipo = searchParams.get("tipo") || undefined;

  const where: Record<string, unknown> = {
    bovino: { fazendaId: ctx.fazendaId, deletedAt: null },
  };
  if (bovinoId) where.bovinoId = bovinoId;
  if (tipo) where.tipo = tipo;
  if (dateFilters.gte || dateFilters.lte) where.data = dateFilters;

  const [registros, total] = await Promise.all([
    prisma.registroSanitario.findMany({
      where,
      include: {
        bovino: { select: { brinco: true, nome: true } },
        veterinario: { select: { nome: true } },
      },
      orderBy: { data: "desc" },
      skip,
      take: perPage,
    }),
    prisma.registroSanitario.count({ where }),
  ]);

  return apiSuccess(registros, { page, perPage, total }, rlHeaders);
}

export async function POST(req: NextRequest) {
  const auth = await withApiAuth(req, "write");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;

  const body = await req.json();
  const validation = registroSanitarioSchema.safeParse(body);
  if (!validation.success) {
    return apiError("validation_error", validation.error.issues[0].message, 400, rlHeaders);
  }

  const bovino = await prisma.bovino.findFirst({
    where: { id: validation.data.bovinoId, fazendaId: ctx.fazendaId, deletedAt: null },
  });
  if (!bovino) return apiError("not_found", "Bovino não encontrado nesta fazenda.", 404, rlHeaders);

  // Calcular fimCarencia
  const dataRegistro = new Date(validation.data.data);
  const fimCarencia = validation.data.diasCarencia > 0
    ? new Date(dataRegistro.getTime() + validation.data.diasCarencia * 24 * 60 * 60 * 1000)
    : null;

  const registro = await prisma.registroSanitario.create({
    data: {
      ...validation.data,
      data: dataRegistro,
      fimCarencia,
    },
  });

  return apiCreated(registro, rlHeaders);
}
