import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bovinoSchema } from "@/lib/validators";
import { assertOwnership } from "@/lib/ownership";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const bovino = await prisma.bovino.findFirst({
    where: {
      id,
      fazenda: { usuarios: { some: { userId: session.user.id } } },
    },
    include: {
      fazenda: { select: { id: true, nome: true } },
      mae: { select: { id: true, brinco: true, nome: true } },
      filhos: { select: { id: true, brinco: true, nome: true, sexo: true, dataNascimento: true } },
      lactacoes: { orderBy: { inicio: "desc" } },
      producoes: { orderBy: { data: "desc" }, take: 30 },
      inseminacoes: { orderBy: { data: "desc" } },
      registrosSanitarios: { orderBy: { data: "desc" } },
    },
  });

  if (!bovino) {
    return NextResponse.json({ error: "Bovino não encontrado" }, { status: 404 });
  }

  return NextResponse.json(bovino);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Ownership check: verifica se o bovino pertence à fazenda do usuário
  const check = await assertOwnership("bovino", id);
  if (!check) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();
  const validation = bovinoSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    );
  }

  const bovino = await prisma.bovino.update({
    where: { id },
    data: {
      ...validation.data,
      dataNascimento: new Date(validation.data.dataNascimento),
    },
  });

  return NextResponse.json(bovino);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Ownership check: verifica se o bovino pertence à fazenda do usuário
  const check = await assertOwnership("bovino", id);
  if (!check) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  // Implementação de Soft Delete
  await prisma.bovino.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  return NextResponse.json({ message: "Bovino enviado para lixeira (arquivado)" });
}
