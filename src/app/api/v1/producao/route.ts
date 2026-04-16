import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { producaoSchema } from "@/lib/validators";
import { withApiAuth, apiSuccess, apiCreated, apiError, parsePagination, parseDateFilters } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const auth = await withApiAuth(req, "read");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;

  const { searchParams } = new URL(req.url);
  const { page, perPage, skip } = parsePagination(searchParams);
  const dateFilters = parseDateFilters(searchParams);
  const bovinoId = searchParams.get("bovinoId") || undefined;

  const where: Record<string, unknown> = {
    bovino: { fazendaId: ctx.fazendaId, deletedAt: null },
  };
  if (bovinoId) where.bovinoId = bovinoId;
  if (dateFilters.gte || dateFilters.lte) where.data = dateFilters;

  const [producoes, total] = await Promise.all([
    prisma.producaoLeite.findMany({
      where,
      include: { bovino: { select: { brinco: true, nome: true } } },
      orderBy: { data: "desc" },
      skip,
      take: perPage,
    }),
    prisma.producaoLeite.count({ where }),
  ]);

  return apiSuccess(producoes, { page, perPage, total }, rlHeaders);
}

export async function POST(req: NextRequest) {
  const auth = await withApiAuth(req, "write");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;

  const body = await req.json();
  const validation = producaoSchema.safeParse(body);
  if (!validation.success) {
    return apiError("validation_error", validation.error.issues[0].message, 400, rlHeaders);
  }

  // Validar que o bovino pertence à fazenda
  const bovino = await prisma.bovino.findFirst({
    where: { id: validation.data.bovinoId, fazendaId: ctx.fazendaId, deletedAt: null },
    include: { lactacoes: { where: { fim: null }, take: 1 } },
  });
  if (!bovino) return apiError("not_found", "Bovino não encontrado nesta fazenda.", 404, rlHeaders);
  if (bovino.sexo !== "FEMEA") return apiError("business_rule", "Apenas fêmeas podem registrar produção (RN01).", 400, rlHeaders);
  if (bovino.lactacoes.length === 0) return apiError("business_rule", "Vaca não está em lactação ativa (RN02).", 400, rlHeaders);

  // Verificar carência
  const carencia = await prisma.registroSanitario.findFirst({
    where: { bovinoId: bovino.id, fimCarencia: { gte: new Date() } },
  });
  if (carencia) {
    return apiError("business_rule", `Vaca em carência até ${new Date(carencia.fimCarencia!).toLocaleDateString("pt-BR")}.`, 400, rlHeaders);
  }

  const producao = await prisma.producaoLeite.create({
    data: { ...validation.data, data: new Date(validation.data.data) },
  });

  return apiCreated(producao, rlHeaders);
}
