import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * 🔐 Autenticação de API Key para rotas públicas /api/v1/*
 *
 * Extrai Bearer token do header Authorization, valida hash SHA-256
 * contra o banco, verifica scopes e expiração.
 *
 * Retorna o contexto autenticado ou uma NextResponse de erro.
 */

export interface ApiKeyContext {
  apiKeyId: string;
  fazendaId: string;
  userId: string;
  scopes: string[];
}

function hashKey(plainKey: string): string {
  return createHash("sha256").update(plainKey).digest("hex");
}

export function generateApiKey(): { plain: string; hash: string; prefixo: string } {
  // Gera key no formato mk_<32 chars hex>
  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const plain = `mk_${randomPart}`;
  const hash = hashKey(plain);
  const prefixo = plain.substring(0, 11); // "mk_ab12cd34"
  return { plain, hash, prefixo };
}

export async function authenticateApiKey(
  req: NextRequest,
  requiredScope: "read" | "write" | "delete"
): Promise<ApiKeyContext | NextResponse> {
  // 1. Extrair Authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: "Header Authorization com Bearer token é obrigatório.",
        docs: "https://milkontrol.cloud/api-docs",
      },
      {
        status: 401,
        headers: { "WWW-Authenticate": "Bearer" },
      }
    );
  }

  const plainKey = authHeader.replace("Bearer ", "").trim();
  if (!plainKey.startsWith("mk_")) {
    return NextResponse.json(
      {
        error: "invalid_key_format",
        message: "API Key deve começar com 'mk_'.",
      },
      { status: 401 }
    );
  }

  // 2. Hash e busca no banco
  const keyHash = hashKey(plainKey);

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: keyHash },
    select: {
      id: true,
      fazendaId: true,
      userId: true,
      scopes: true,
      ativo: true,
      expiraEm: true,
    },
  });

  if (!apiKey) {
    return NextResponse.json(
      { error: "invalid_key", message: "API Key inválida ou inexistente." },
      { status: 401 }
    );
  }

  // 3. Verificar se está ativa
  if (!apiKey.ativo) {
    return NextResponse.json(
      { error: "key_revoked", message: "Esta API Key foi revogada." },
      { status: 403 }
    );
  }

  // 4. Verificar expiração
  if (apiKey.expiraEm && new Date(apiKey.expiraEm) < new Date()) {
    return NextResponse.json(
      { error: "key_expired", message: "Esta API Key expirou." },
      { status: 403 }
    );
  }

  // 5. Verificar scope
  if (!apiKey.scopes.includes(requiredScope)) {
    return NextResponse.json(
      {
        error: "insufficient_scope",
        message: `Esta API Key não tem permissão '${requiredScope}'. Scopes disponíveis: [${apiKey.scopes.join(", ")}]`,
      },
      { status: 403 }
    );
  }

  // 6. Atualizar último uso (fire & forget)
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { ultimoUso: new Date() } })
    .catch(() => {}); // não bloqueia a request

  return {
    apiKeyId: apiKey.id,
    fazendaId: apiKey.fazendaId,
    userId: apiKey.userId,
    scopes: apiKey.scopes,
  };
}

/**
 * Helper: verifica se o resultado da autenticação é um erro (NextResponse) ou sucesso (contexto)
 */
export function isAuthError(
  result: ApiKeyContext | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
