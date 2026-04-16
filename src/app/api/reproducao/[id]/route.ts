import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertOwnership } from "@/lib/ownership";

// PATCH /api/reproducao/[id] — update prenhez
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const check = await assertOwnership("inseminacao", id);
  if (!check) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();

  const inseminacao = await prisma.inseminacao.update({
    where: { id },
    data: {
      prenhez: body.prenhez,
      dataDiagnostico: body.dataDiagnostico ? new Date(body.dataDiagnostico) : new Date(),
    },
  });

  return NextResponse.json(inseminacao);
}
