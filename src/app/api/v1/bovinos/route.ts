import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { bovinoSchema } from "@/lib/validators";
import { withApiAuth, apiSuccess, apiCreated, apiError, parsePagination, parseDateFilters } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const auth = await withApiAuth(req, "read");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;

  const { searchParams } = new URL(req.url);
  const { page, perPage, skip } = parsePagination(searchParams);

  const situacao = searchParams.get("situacao") || undefined;
  const sexo = searchParams.get("sexo") || undefined;
  const piqueteId = searchParams.get("piqueteId") || undefined;
  const busca = searchParams.get("busca") || undefined;

  const where: Record<string, unknown> = {
    fazendaId: ctx.fazendaId,
    deletedAt: null,
  };
  if (situacao) where.situacao = situacao;
  if (sexo) where.sexo = sexo;
  if (piqueteId) where.piqueteId = piqueteId;
  if (busca) {
    where.OR = [
      { brinco: { contains: busca, mode: "insensitive" } },
      { nome: { contains: busca, mode: "insensitive" } },
    ];
  }

  const [bovinos, total] = await Promise.all([
    prisma.bovino.findMany({
      where,
      select: {
        id: true, brinco: true, nome: true, raca: true, dataNascimento: true,
        sexo: true, situacao: true, observacoes: true, piqueteId: true,
        piquete: { select: { nome: true } },
        maeId: true, paiInfo: true,
        criadoEm: true, atualizadoEm: true,
      },
      orderBy: { brinco: "asc" },
      skip,
      take: perPage,
    }),
    prisma.bovino.count({ where }),
  ]);

  return apiSuccess(bovinos, { page, perPage, total }, rlHeaders);
}

export async function POST(req: NextRequest) {
  const auth = await withApiAuth(req, "write");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;

  const body = await req.json();
  const validation = bovinoSchema.safeParse(body);
  if (!validation.success) {
    return apiError("validation_error", validation.error.issues[0].message, 400, rlHeaders);
  }

  // Verificar brinco duplicado
  const existente = await prisma.bovino.findFirst({
    where: { brinco: validation.data.brinco, fazendaId: ctx.fazendaId, deletedAt: null },
  });
  if (existente) {
    return apiError("duplicate_brinco", `Brinco '${validation.data.brinco}' já existe nesta fazenda.`, 409, rlHeaders);
  }

  const bovino = await prisma.bovino.create({
    data: {
      ...validation.data,
      dataNascimento: new Date(validation.data.dataNascimento),
      fazendaId: ctx.fazendaId,
    },
  });

  return apiCreated(bovino, rlHeaders);
}
