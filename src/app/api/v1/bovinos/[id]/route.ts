import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiAuth, apiSuccess, apiError } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withApiAuth(req, "read");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;
  const { id } = await params;

  const bovino = await prisma.bovino.findFirst({
    where: { id, fazendaId: ctx.fazendaId, deletedAt: null },
    include: {
      piquete: { select: { id: true, nome: true } },
      producoes: { orderBy: { data: "desc" }, take: 30 },
      lactacoes: { orderBy: { inicio: "desc" }, take: 5 },
      inseminacoes: { orderBy: { data: "desc" }, take: 10 },
      registrosSanitarios: { orderBy: { data: "desc" }, take: 10 },
      pesagens: { orderBy: { data: "desc" }, take: 10 },
    },
  });

  if (!bovino) {
    return apiError("not_found", "Bovino não encontrado.", 404, rlHeaders);
  }

  return apiSuccess(bovino, undefined, rlHeaders);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withApiAuth(req, "write");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;
  const { id } = await params;

  const bovino = await prisma.bovino.findFirst({
    where: { id, fazendaId: ctx.fazendaId, deletedAt: null },
  });
  if (!bovino) {
    return apiError("not_found", "Bovino não encontrado.", 404, rlHeaders);
  }

  const body = await req.json();

  // Verificar se está tentando soft-delete sem scope
  if (body.situacao === "VENDIDA" || body.situacao === "MORTA") {
    const deleteAuth = await withApiAuth(req, "delete");
    if (deleteAuth instanceof Response) return deleteAuth;
  }

  const allowedFields = ["nome", "raca", "situacao", "observacoes", "piqueteId", "paiInfo"];
  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updateData[field] = body[field];
  }

  // Se está marcando como vendida/morta, setar deletedAt para soft-delete
  if (updateData.situacao === "VENDIDA" || updateData.situacao === "MORTA") {
    updateData.deletedAt = new Date();
  }

  const updated = await prisma.bovino.update({
    where: { id },
    data: updateData,
  });

  return apiSuccess(updated, undefined, rlHeaders);
}
