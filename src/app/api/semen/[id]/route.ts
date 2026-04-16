import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bancoSemenSchema } from "@/lib/validators";
import { assertOwnership } from "@/lib/ownership";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const check = await assertOwnership("bancoSemen", id);
  if (!check) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();
  const validation = bancoSemenSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  const semen = await prisma.bancoSemen.update({
    where: { id },
    data: validation.data,
  });

  return NextResponse.json(semen);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const check = await assertOwnership("bancoSemen", id);
  if (!check) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();
  
  if (typeof body.quantidade !== "number" || body.quantidade < 0) {
    return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });
  }

  const semen = await prisma.bancoSemen.update({
    where: { id },
    data: { quantidade: body.quantidade },
  });

  return NextResponse.json(semen);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const check = await assertOwnership("bancoSemen", id);
  if (!check) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  await prisma.bancoSemen.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
