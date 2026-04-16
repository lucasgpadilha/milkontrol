import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertOwnership } from "@/lib/ownership";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const check = await assertOwnership("registroAlimentacao", id);
  if (!check) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  await prisma.registroAlimentacao.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
