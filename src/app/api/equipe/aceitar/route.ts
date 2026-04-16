import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  
  if (!token) return NextResponse.json({ error: "Token não fornecido" }, { status: 400 });

  const convite = await prisma.conviteFazenda.findUnique({
    where: { token },
    include: { fazenda: { select: { nome: true } } },
  });

  if (!convite) return NextResponse.json({ error: "Convite não encontrado ou já aceito" }, { status: 404 });
  if (convite.expiraEm < new Date()) return NextResponse.json({ error: "Convite expirado" }, { status: 400 });

  return NextResponse.json({
    email: convite.email,
    papel: convite.papel,
    fazenda: convite.fazenda.nome,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token não fornecido" }, { status: 400 });

  const convite = await prisma.conviteFazenda.findUnique({ where: { token } });
  
  if (!convite) return NextResponse.json({ error: "Convite inválido ou já utilizado" }, { status: 404 });
  if (convite.expiraEm < new Date()) return NextResponse.json({ error: "Este convite expirou" }, { status: 400 });
  
  // Segurança: Só o dono do email pode aceitar o convite
  if (session.user.email?.toLowerCase() !== convite.email.toLowerCase()) {
    return NextResponse.json({ error: "Este convite foi enviado para outro e-mail" }, { status: 403 });
  }

  // Transação atômica: cria/atualiza o UsuarioFazenda e deleta o convite
  try {
    await prisma.$transaction(async (tx) => {
      await tx.usuarioFazenda.upsert({
        where: { userId_fazendaId: { userId: session.user.id, fazendaId: convite.fazendaId } },
        update: { papel: convite.papel },
        create: {
          userId: session.user.id,
          fazendaId: convite.fazendaId,
          papel: convite.papel,
        },
      });
      // Definir a fazenda ativa se ele não tem nenhuma
      const user = await tx.user.findUnique({ select: { fazendaAtivaId: true }, where: { id: session.user.id } });
      if (!user?.fazendaAtivaId) {
        await tx.user.update({ where: { id: session.user.id }, data: { fazendaAtivaId: convite.fazendaId } });
      }
      
      await tx.conviteFazenda.delete({ where: { id: convite.id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao aceitar convite:", error);
    return NextResponse.json({ error: "Erro interno ao processar o convite" }, { status: 500 });
  }
}
