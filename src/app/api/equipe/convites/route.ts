import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas) return NextResponse.json({ error: "Selecione uma fazenda" }, { status: 400 });

  // Somente PROPRIETARIO ou GERENTE pode convidar
  const solicitante = await prisma.usuarioFazenda.findFirst({
    where: { userId: session.user.id, fazendaId: ctx.fazendaIds[0], papel: { in: ["PROPRIETARIO", "GERENTE"] } },
  });
  if (!solicitante) return NextResponse.json({ error: "Apenas proprietários e gerentes podem convidar membros" }, { status: 403 });

  const body = await req.json();
  const { email, papel } = body;

  if (!email || !papel) return NextResponse.json({ error: "Email e papel são obrigatórios" }, { status: 400 });

  // Verificar se o usuário já está na fazenda
  const existsUser = await prisma.user.findUnique({ where: { email } });
  if (existsUser) {
    const isMember = await prisma.usuarioFazenda.findUnique({
      where: { userId_fazendaId: { userId: existsUser.id, fazendaId: ctx.fazendaIds[0] } },
    });
    if (isMember) return NextResponse.json({ error: "Este usuário já faz parte da fazenda" }, { status: 400 });
  }

  // Prevenir que um Gerente crie convites de Proprietário
  if (solicitante.papel === "GERENTE" && papel === "PROPRIETARIO") {
    return NextResponse.json({ error: "Gerentes não podem convidar proprietários" }, { status: 403 });
  }

  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + 7); // 7 dias

  // Upsert para caso já exista um convite pendente para este email nesta fazenda
  const convite = await prisma.conviteFazenda.upsert({
    where: { email_fazendaId: { email, fazendaId: ctx.fazendaIds[0] } },
    update: { token, papel, expiraEm },
    create: {
      email,
      papel,
      fazendaId: ctx.fazendaIds[0],
      token,
      expiraEm,
    },
  });

  // Idealmente enviaria por email (Resend). Por enquanto retorna o token pra UI.
  return NextResponse.json({ success: true, token: convite.token, link: `${process.env.NEXT_PUBLIC_APP_URL || "https://milkontrol.cloud"}/convite/${convite.token}` });
}
