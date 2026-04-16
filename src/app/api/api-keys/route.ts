import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/api-auth";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id, fazendaId: { in: ctx.fazendaIds } },
    select: {
      id: true, nome: true, prefixo: true, scopes: true, ativo: true,
      ultimoUso: true, criadoEm: true, expiraEm: true,
      fazenda: { select: { nome: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas) return NextResponse.json({ error: "Selecione uma fazenda ativa" }, { status: 400 });

  const body = await req.json();
  const { nome, scopes, expiraEm } = body;

  if (!nome || nome.length < 2) {
    return NextResponse.json({ error: "Nome da chave é obrigatório (mín. 2 caracteres)" }, { status: 400 });
  }

  const validScopes = ["read", "write", "delete"];
  const scopesFinal = (scopes as string[] || ["read"]).filter((s: string) => validScopes.includes(s));
  if (scopesFinal.length === 0) scopesFinal.push("read");

  const { plain, hash, prefixo } = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: {
      nome,
      key: hash,
      prefixo,
      fazendaId: ctx.fazendaIds[0],
      userId: session.user.id,
      scopes: scopesFinal,
      expiraEm: expiraEm ? new Date(expiraEm) : null,
    },
  });

  // Retorna a chave completa APENAS neste momento
  return NextResponse.json({
    id: apiKey.id,
    nome: apiKey.nome,
    key: plain, // ⚠️ Única vez que o valor plain é retornado!
    prefixo: apiKey.prefixo,
    scopes: apiKey.scopes,
    criadoEm: apiKey.criadoEm,
    expiraEm: apiKey.expiraEm,
  }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, ativo } = body;

  const apiKey = await prisma.apiKey.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!apiKey) return NextResponse.json({ error: "Chave não encontrada" }, { status: 404 });

  const updated = await prisma.apiKey.update({
    where: { id },
    data: { ativo },
  });

  return NextResponse.json({ id: updated.id, ativo: updated.ativo });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

  const apiKey = await prisma.apiKey.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!apiKey) return NextResponse.json({ error: "Chave não encontrada" }, { status: 404 });

  await prisma.apiKey.delete({ where: { id } });
  return NextResponse.json({ message: "Chave removida com sucesso" });
}
