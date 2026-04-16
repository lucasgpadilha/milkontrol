import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { registroAlimentacaoSchema } from "@/lib/validators";
import { withApiAuth, apiSuccess, apiCreated, apiError, parsePagination, parseDateFilters } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const auth = await withApiAuth(req, "read");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;

  const { searchParams } = new URL(req.url);
  const { page, perPage, skip } = parsePagination(searchParams);
  const dateFilters = parseDateFilters(searchParams);

  const where: Record<string, unknown> = { fazendaId: ctx.fazendaId };
  if (dateFilters.gte || dateFilters.lte) where.data = dateFilters;

  const [registros, total] = await Promise.all([
    prisma.registroAlimentacao.findMany({
      where,
      include: { piquete: { select: { nome: true } } },
      orderBy: { data: "desc" },
      skip,
      take: perPage,
    }),
    prisma.registroAlimentacao.count({ where }),
  ]);

  return apiSuccess(registros, { page, perPage, total }, rlHeaders);
}

export async function POST(req: NextRequest) {
  const auth = await withApiAuth(req, "write");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;

  const body = await req.json();
  const validation = registroAlimentacaoSchema.safeParse(body);
  if (!validation.success) {
    return apiError("validation_error", validation.error.issues[0].message, 400, rlHeaders);
  }

  // Validar que o piquete pertence à fazenda
  const piquete = await prisma.piquete.findFirst({
    where: { id: validation.data.piqueteId, fazendaId: ctx.fazendaId },
  });
  if (!piquete) return apiError("not_found", "Piquete não encontrado nesta fazenda.", 404, rlHeaders);

  const registro = await prisma.registroAlimentacao.create({
    data: { ...validation.data, data: new Date(validation.data.data), fazendaId: ctx.fazendaId },
  });

  return apiCreated(registro, rlHeaders);
}
