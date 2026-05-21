import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

/**
 * GET /api/producao/ordenha
 * 
 * Retorna as vacas em lactação com:
 * - Média de produção dos últimos 7 dias
 * - Ordem baseada na última ordenha (mesma sequência de ontem)
 * - Status de registro para o turno atual
 * - Info de piquete para filtragem
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const activeData = await getFazendaAtivaIds();
  if (!activeData || activeData.fazendaIds.length === 0) {
    return NextResponse.json({ error: "Nenhuma fazenda ativa" }, { status: 403 });
  }
  const { fazendaIds } = activeData;

  const { searchParams } = new URL(request.url);
  const turno = searchParams.get("turno") || "MANHA";
  const piqueteId = searchParams.get("piqueteId") || null;
  const dataStr = searchParams.get("data") || new Date().toISOString().split("T")[0];

  // Buscar vacas em lactação ativa (não deletadas, com lactação aberta)
  const whereClause: any = {
    fazendaId: { in: fazendaIds },
    sexo: "FEMEA",
    deletedAt: null,
    lactacoes: {
      some: { fim: null }
    }
  };

  if (piqueteId) {
    whereClause.piqueteId = piqueteId;
  }

  const vacas = await prisma.bovino.findMany({
    where: whereClause,
    include: {
      piquete: { select: { id: true, nome: true } },
      lactacoes: {
        where: { fim: null },
        take: 1,
        select: { inicio: true }
      },
      // Produção dos últimos 7 dias para calcular média
      producoes: {
        where: {
          data: {
            gte: new Date(new Date(dataStr).getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        select: { quantidade: true, data: true, turno: true }
      },
      // Verificar se já foi carência
      registrosSanitarios: {
        where: {
          fimCarencia: { gte: new Date(dataStr) }
        },
        take: 1,
        select: { fimCarencia: true, produto: true }
      }
    },
    orderBy: { brinco: "asc" }
  });

  // Buscar registros de hoje para este turno (para saber quais já foram registradas)
  const registrosHoje = await prisma.producaoLeite.findMany({
    where: {
      bovino: { fazendaId: { in: fazendaIds } },
      data: {
        gte: new Date(dataStr + "T00:00:00Z"),
        lt: new Date(dataStr + "T23:59:59Z")
      },
      turno: turno as any
    },
    select: { bovinoId: true, quantidade: true }
  });

  const registradosMap = new Map(registrosHoje.map(r => [r.bovinoId, r.quantidade]));

  // Buscar a ordem da última ordenha (ontem, mesmo turno) para sugerir sequência
  const ontem = new Date(new Date(dataStr).getTime() - 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0];
  
  const producaoOntem = await prisma.producaoLeite.findMany({
    where: {
      bovino: { fazendaId: { in: fazendaIds } },
      data: {
        gte: new Date(ontem + "T00:00:00Z"),
        lt: new Date(ontem + "T23:59:59Z")
      },
      turno: turno as any
    },
    orderBy: { criadoEm: "asc" },
    select: { bovinoId: true, criadoEm: true }
  });

  // Map de ordem de ontem
  const ordemOntem = new Map<string, number>();
  producaoOntem.forEach((p, idx) => ordemOntem.set(p.bovinoId, idx));

  // Montar resposta
  const result = vacas.map(v => {
    const producoes = v.producoes;
    const totalProd = producoes.reduce((acc, p) => acc + p.quantidade, 0);
    const diasComProd = new Set(producoes.map(p => new Date(p.data).toISOString().split("T")[0])).size;
    const media7d = diasComProd > 0 ? totalProd / diasComProd : 0;

    const lactInicio = v.lactacoes[0]?.inicio;
    const del = lactInicio
      ? Math.floor((new Date(dataStr).getTime() - new Date(lactInicio).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const jaRegistrada = registradosMap.has(v.id);
    const valorRegistrado = registradosMap.get(v.id) || null;

    const emCarencia = v.registrosSanitarios.length > 0;
    const carenciaInfo = emCarencia ? v.registrosSanitarios[0] : null;

    return {
      id: v.id,
      brinco: v.brinco,
      nome: v.nome,
      raca: v.raca,
      piquete: v.piquete ? { id: v.piquete.id, nome: v.piquete.nome } : null,
      del,
      media7d: Number(media7d.toFixed(1)),
      jaRegistrada,
      valorRegistrado,
      emCarencia,
      carenciaInfo: carenciaInfo ? {
        produto: carenciaInfo.produto,
        fimCarencia: carenciaInfo.fimCarencia
      } : null,
      ordemOntem: ordemOntem.get(v.id) ?? 9999 // 9999 = nunca registrada ontem
    };
  });

  // Ordenar: primeiro as pendentes (não registradas), depois pela ordem de ontem
  result.sort((a, b) => {
    // Registradas vão pro final
    if (a.jaRegistrada !== b.jaRegistrada) return a.jaRegistrada ? 1 : -1;
    // Dentro de cada grupo, ordenar pela sequência de ontem
    return a.ordemOntem - b.ordemOntem;
  });

  return NextResponse.json(result);
}
