import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fazendaSchema } from "@/lib/validators";

// GET /api/fazendas/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const fazenda = await prisma.fazenda.findFirst({
    where: {
      id,
      usuarios: { some: { userId: session.user.id } },
    },
    include: {
      _count: { select: { bovinos: true, tanques: true } },
    },
  });

  if (!fazenda) {
    return NextResponse.json({ error: "Fazenda não encontrada" }, { status: 404 });
  }

  return NextResponse.json(fazenda);
}

// PUT /api/fazendas/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const exists = await prisma.usuarioFazenda.findFirst({
    where: { userId: session.user.id, fazendaId: id },
  });
  if (!exists) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const validation = fazendaSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    );
  }

  const fazenda = await prisma.fazenda.update({
    where: { id },
    data: validation.data,
  });

  return NextResponse.json(fazenda);
}

// DELETE /api/fazendas/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const membership = await prisma.usuarioFazenda.findFirst({
    where: { userId: session.user.id, fazendaId: id, papel: "PROPRIETARIO" },
  });
  if (!membership) {
    return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 });
  }

  await prisma.fazenda.delete({ where: { id } });

  return NextResponse.json({ message: "Fazenda excluída" });
}
