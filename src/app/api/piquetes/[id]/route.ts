import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertOwnership } from "@/lib/ownership";
import { z } from "zod";

const piqueteUpdateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const check = await assertOwnership("piquete", id);
  if (!check) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();
  const validation = piqueteUpdateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  const piquete = await prisma.piquete.update({
    where: { id },
    data: validation.data,
  });

  return NextResponse.json(piquete);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const check = await assertOwnership("piquete", id);
  if (!check) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  await prisma.piquete.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
