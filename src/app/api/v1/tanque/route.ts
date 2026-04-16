import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { movimentacaoTanqueSchema } from "@/lib/validators";
import { withApiAuth, apiSuccess, apiCreated, apiError, parsePagination } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const auth = await withApiAuth(req, "read");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;

  const tanques = await prisma.tanque.findMany({
    where: { fazendaId: ctx.fazendaId },
    include: {
      movimentacoes: { orderBy: { data: "desc" }, take: 20 },
    },
  });

  return apiSuccess(tanques, undefined, rlHeaders);
}
