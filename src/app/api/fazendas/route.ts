import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fazendaSchema } from "@/lib/validators";

// GET /api/fazendas — list user's farms
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const fazendas = await prisma.fazenda.findMany({
    where: {
      usuarios: { some: { userId: session.user.id } },
    },
    include: {
      _count: { select: { bovinos: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(fazendas);
}

// POST /api/fazendas — create a new farm
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const validation = fazendaSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    );
  }

  const fazenda = await prisma.fazenda.create({
    data: {
      ...validation.data,
      usuarios: {
        create: {
          userId: session.user.id,
          papel: "ADMIN",
        },
      },
    },
  });

  return NextResponse.json(fazenda, { status: 201 });
}
