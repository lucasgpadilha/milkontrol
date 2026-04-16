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

  const inseminacao = await prisma.inseminacao.findFirst({
    where: { id, bovino: { fazendaId: ctx.fazendaId } },
  });
  if (!inseminacao) return apiError("not_found", "Inseminação não encontrada.", 404, rlHeaders);

  const body = await req.json();
  const allowedFields = ["prenhez", "dataDiagnostico", "observacoes"];
  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = field === "dataDiagnostico" && body[field] ? new Date(body[field]) : body[field];
    }
  }

  const updated = await prisma.inseminacao.update({
    where: { id },
    data: updateData,
  });

  return apiSuccess(updated, undefined, rlHeaders);
}
