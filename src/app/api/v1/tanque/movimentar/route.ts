import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { movimentacaoTanqueSchema } from "@/lib/validators";
import { withApiAuth, apiCreated, apiError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const auth = await withApiAuth(req, "write");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;

  const body = await req.json();
  const validation = movimentacaoTanqueSchema.safeParse(body);
  if (!validation.success) {
    return apiError("validation_error", validation.error.issues[0].message, 400, rlHeaders);
  }

  // Validar que o tanque pertence à fazenda
  const tanque = await prisma.tanque.findFirst({
    where: { id: validation.data.tanqueId, fazendaId: ctx.fazendaId },
  });
  if (!tanque) return apiError("not_found", "Tanque não encontrado nesta fazenda.", 404, rlHeaders);

  const novoVolume = validation.data.tipo === "ENTRADA"
    ? tanque.volumeAtual + validation.data.quantidade
    : tanque.volumeAtual - validation.data.quantidade;

  if (novoVolume > tanque.capacidadeMax) {
    return apiError("business_rule", `Volume ultrapassaria capacidade máxima (${tanque.capacidadeMax}L). Atual: ${tanque.volumeAtual}L.`, 400, rlHeaders);
  }
  if (novoVolume < 0) {
    return apiError("business_rule", `Volume insuficiente. Atual: ${tanque.volumeAtual}L.`, 400, rlHeaders);
  }

  const [movimentacao] = await prisma.$transaction([
    prisma.movimentacaoTanque.create({
      data: { ...validation.data, data: new Date(validation.data.data) },
    }),
    prisma.tanque.update({
      where: { id: validation.data.tanqueId },
      data: { volumeAtual: novoVolume },
    }),
  ]);

  return apiCreated({ ...movimentacao, novoVolumeAtual: novoVolume }, rlHeaders);
}
