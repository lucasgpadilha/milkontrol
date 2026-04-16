import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiAuth, apiSuccess, apiError } from "@/lib/api-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withApiAuth(req, "write");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;
  const { id } = await params;

  const lactacao = await prisma.lactacao.findFirst({
    where: { id, bovino: { fazendaId: ctx.fazendaId } },
  });
  if (!lactacao) return apiError("not_found", "Lactação não encontrada.", 404, rlHeaders);

  const body = await req.json();

  const updated = await prisma.lactacao.update({
    where: { id },
    data: { fim: body.fim ? new Date(body.fim) : null },
  });

  return apiSuccess(updated, undefined, rlHeaders);
}
