import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "fazenda-ativa";

// GET /api/fazenda-ativa — retorna a fazenda ativa do usuário
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const fazendaId = cookieStore.get(COOKIE_NAME)?.value || "todas";

  return NextResponse.json({ fazendaId });
}

// PUT /api/fazenda-ativa — seleciona a fazenda ativa
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { fazendaId } = await req.json();

  if (fazendaId === "todas") {
    // Limpar fazenda ativa
    await prisma.user.update({
      where: { id: session.user.id },
      data: { fazendaAtivaId: null },
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "todas", {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 ano
    });

    return NextResponse.json({ fazendaId: "todas" });
  }

  // Validar ownership
  const membership = await prisma.usuarioFazenda.findFirst({
    where: { userId: session.user.id, fazendaId },
  });

  if (!membership) {
    return NextResponse.json({ error: "Fazenda não encontrada" }, { status: 403 });
  }

  // Persistir no banco
  await prisma.user.update({
    where: { id: session.user.id },
    data: { fazendaAtivaId: fazendaId },
  });

  // Setar cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, fazendaId, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ fazendaId });
}
