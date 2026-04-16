import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, isAuthError, type ApiKeyContext } from "@/lib/api-auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limiter";

/**
 * 📦 Helpers padronizados para todas as rotas /api/v1/*
 */

// ─── Envelope de Resposta ────────────────────────────────────────────

export function apiSuccess(
  data: unknown,
  meta?: { page?: number; perPage?: number; total?: number },
  extraHeaders?: Record<string, string>
) {
  const body: Record<string, unknown> = { data };
  if (meta) {
    body.meta = {
      page: meta.page || 1,
      perPage: meta.perPage || 50,
      total: meta.total || 0,
      totalPages: Math.ceil((meta.total || 0) / (meta.perPage || 50)),
    };
  }
  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-API-Version": "v1",
      ...extraHeaders,
    },
  });
}

export function apiCreated(data: unknown, extraHeaders?: Record<string, string>) {
  return NextResponse.json(
    { data },
    {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "X-API-Version": "v1",
        ...extraHeaders,
      },
    }
  );
}

export function apiError(
  code: string,
  message: string,
  status: number,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(
    { error: code, message },
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "X-API-Version": "v1",
        ...extraHeaders,
      },
    }
  );
}

// ─── Auth + Rate Limit combinados ────────────────────────────────────

export async function withApiAuth(
  req: NextRequest,
  scope: "read" | "write" | "delete"
): Promise<{ ctx: ApiKeyContext; rlHeaders: Record<string, string> } | NextResponse> {
  // 1. Auth
  const authResult = await authenticateApiKey(req, scope);
  if (isAuthError(authResult)) return authResult;

  // 2. Rate Limit
  const rl = checkRateLimit(authResult.apiKeyId);
  const headers = rateLimitHeaders(rl);

  if (!rl.allowed) {
    return apiError(
      "rate_limit_exceeded",
      "Limite de requisições excedido. Tente novamente em breve.",
      429,
      headers
    );
  }

  return { ctx: authResult, rlHeaders: headers };
}

// ─── Pagination parser ───────────────────────────────────────────────

export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  perPage: number;
  skip: number;
} {
  let page = parseInt(searchParams.get("page") || "1", 10);
  let perPage = parseInt(searchParams.get("perPage") || "50", 10);

  if (page < 1) page = 1;
  if (perPage < 1) perPage = 1;
  if (perPage > 200) perPage = 200;

  return { page, perPage, skip: (page - 1) * perPage };
}

// ─── Date filter parser ──────────────────────────────────────────────

export function parseDateFilters(searchParams: URLSearchParams): {
  gte?: Date;
  lte?: Date;
} {
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");

  const result: { gte?: Date; lte?: Date } = {};
  if (dataInicio) result.gte = new Date(dataInicio);
  if (dataFim) result.lte = new Date(dataFim + "T23:59:59");
  return result;
}
