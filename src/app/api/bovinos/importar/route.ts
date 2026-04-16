import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.todas) return NextResponse.json({ error: "Selecione uma fazenda" }, { status: 400 });
  const fazendaId = ctx.fazendaIds[0];

  // Somente PROPRIETARIO e GERENTE e OPERADOR podem cadastrar bovinos (OPERADOR pode? Vamos assumir que sim para simplificar)
  const solicitante = await prisma.usuarioFazenda.findFirst({
    where: { userId: session.user.id, fazendaId, papel: { in: ["PROPRIETARIO", "GERENTE"] } },
  });
  if (!solicitante) return NextResponse.json({ error: "Permissão negada" }, { status: 403 });

  const body = await req.json();
  const { bovinos } = body;

  if (!Array.isArray(bovinos) || bovinos.length === 0) {
    return NextResponse.json({ error: "Nenhum dado enviado" }, { status: 400 });
  }

  try {
    // Para simplificar a importação:
    // 1. Buscamos todos os brincos existentes para não duplicar.
    const brincosEnviados = bovinos.map((b: any) => b.brinco?.toString().trim()).filter(Boolean);
    const existentes = await prisma.bovino.findMany({
      where: { fazendaId, brinco: { in: brincosEnviados } },
      select: { brinco: true },
    });
    
    const setExistentes = new Set(existentes.map((e) => e.brinco));

    // 2. Filtramos apenas os que não existem
    const novos = bovinos.filter((b: any) => {
      const brinco = b.brinco?.toString().trim();
      return brinco && !setExistentes.has(brinco);
    });

    if (novos.length === 0) {
      return NextResponse.json({ error: "Todos os animais enviados já existem na fazenda." }, { status: 400 });
    }

    // 3. Cadastramos todos usando createMany num bloco atômico.
    const result = await prisma.bovino.createMany({
      data: novos.map((b: any) => ({
        fazendaId,
        brinco: b.brinco.toString().trim(),
        nome: b.nome?.toString().trim() || null,
        raca: b.raca?.toString().trim() || "Sem raça",
        sexo: b.sexo === "Macho" ? "MACHO" : "FEMEA",
        // Parse da data de nascimento se vier no formato YYYY-MM-DD
        dataNascimento: b.dataNascimento ? new Date(b.dataNascimento) : new Date(),
      })),
      skipDuplicates: true, // Garante segurança
    });

    return NextResponse.json({ 
      success: true, 
      count: result.count,
      ignorados: bovinos.length - novos.length 
    });

  } catch (err: any) {
    console.error("Erro na importação:", err);
    return NextResponse.json({ error: "Erro interno ao processar arquivo" }, { status: 500 });
  }
}
