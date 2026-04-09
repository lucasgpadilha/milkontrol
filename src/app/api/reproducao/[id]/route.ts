import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/reproducao/[id] — update prenhez
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const inseminacao = await prisma.inseminacao.update({
    where: { id },
    data: {
      prenpiez: body.prenpiez,
      dataDiagnostico: body.dataDiagnostico ? new Date(body.dataDiagnostico) : new Date(),
    },
  });

  return NextResponse.json(inseminacao);
}
