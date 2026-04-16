import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { veterinarioSchema } from "@/lib/validators";
import { assertOwnership } from "@/lib/ownership";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const check = await assertOwnership("veterinario", id);
  if (!check) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();
  const validation = veterinarioSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  const veterinario = await prisma.veterinario.update({
    where: { id },
    data: validation.data,
  });

  return NextResponse.json(veterinario);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const check = await assertOwnership("veterinario", id);
  if (!check) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  await prisma.veterinario.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
