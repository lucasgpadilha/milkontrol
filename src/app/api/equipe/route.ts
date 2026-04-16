import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas) return NextResponse.json({ error: "Selecione uma fazenda" }, { status: 400 });

  // Só donos ou gerentes podem gerir equipe? Vamos deixar aberto GET para todos verem a equipe
  const membros = await prisma.usuarioFazenda.findMany({
    where: { fazendaId: ctx.fazendaIds[0] },
    include: {
      user: { select: { id: true, nome: true, email: true } },
    },
    orderBy: { papel: "asc" },
  });

  const convites = await prisma.conviteFazenda.findMany({
    where: { fazendaId: ctx.fazendaIds[0] },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json({ membros, convites });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas) return NextResponse.json({ error: "Selecione uma fazenda" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "membro" or "convite"
  const id = searchParams.get("id");

  if (!type || !id) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  // Somente PROPRIETARIO pode revogar convites/membros
  const solicitante = await prisma.usuarioFazenda.findFirst({
    where: { userId: session.user.id, fazendaId: ctx.fazendaIds[0], papel: "PROPRIETARIO" },
  });
  if (!solicitante) return NextResponse.json({ error: "Somente proprietários podem gerenciar a equipe" }, { status: 403 });

  if (type === "membro") {
    // Não pode remover a si mesmo por esta rota (previne lockout)
    const target = await prisma.usuarioFazenda.findFirst({ where: { id } });
    if (target?.userId === session.user.id) {
      return NextResponse.json({ error: "Use a opção de sair da fazenda" }, { status: 400 });
    }
    await prisma.usuarioFazenda.delete({ where: { id } });
  } else if (type === "convite") {
    await prisma.conviteFazenda.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
