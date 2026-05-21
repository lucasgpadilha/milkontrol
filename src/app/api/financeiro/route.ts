import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export async function GET(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mesesParam = parseInt(searchParams.get("meses") || "6");
  const meses = Math.min(mesesParam, 12);

  const now = new Date();
  const periodos: { inicio: Date; fim: Date; label: string }[] = [];

  for (let i = meses - 1; i >= 0; i--) {
    const inicio = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const fim = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const label = inicio.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    periodos.push({ inicio, fim, label });
  }

  const fazendaIds = ctx.fazendaIds;

  // Buscar todos os dados de uma vez para performance
  const [vendas, alimentacao, piquetesComBovinos] = await Promise.all([
    // Receita: vendas de leite do tanque (SAIDA + VENDA com precoLitro)
    prisma.movimentacaoTanque.findMany({
      where: {
        tanque: { fazendaId: { in: fazendaIds } },
        tipo: "SAIDA",
        tipoSaida: "VENDA",
        precoLitro: { not: null },
        data: { gte: periodos[0].inicio },
      },
      select: { data: true, quantidade: true, precoLitro: true },
    }),
    // Custo: alimentação (custoUnitario * quantidadeKg * cabeças do piquete)
    prisma.registroAlimentacao.findMany({
      where: {
        fazendaId: { in: fazendaIds },
        custoUnitario: { not: null },
        data: { gte: periodos[0].inicio },
      },
      select: {
        data: true,
        quantidadeKg: true,
        custoUnitario: true,
        piquete: { select: { _count: { select: { bovinos: true } } } },
      },
    }),
    // Para calcular custo de alimentação com contagem de bovinos
    prisma.piquete.findMany({
      where: { fazendaId: { in: fazendaIds } },
      select: { id: true, _count: { select: { bovinos: true } } },
    }),
  ]);

  // Calcular série mensal
  const serie = periodos.map(p => {
    // Receita do mês
    const vendasMes = vendas.filter(v => {
      const d = new Date(v.data);
      return d >= p.inicio && d <= p.fim;
    });
    const receita = vendasMes.reduce((acc, v) => acc + (v.quantidade * (v.precoLitro || 0)), 0);
    const litrosVendidos = vendasMes.reduce((acc, v) => acc + v.quantidade, 0);

    // Custo alimentação do mês
    const aliMes = alimentacao.filter(a => {
      const d = new Date(a.data);
      return d >= p.inicio && d <= p.fim;
    });
    const custoAlimentacao = aliMes.reduce((acc, a) => {
      const cabecas = a.piquete._count.bovinos;
      return acc + ((a.custoUnitario || 0) * a.quantidadeKg * cabecas);
    }, 0);

    return {
      mes: p.label,
      receita: Math.round(receita * 100) / 100,
      custoAlimentacao: Math.round(custoAlimentacao * 100) / 100,
      custoTotal: Math.round(custoAlimentacao * 100) / 100,
      margem: Math.round((receita - custoAlimentacao) * 100) / 100,
      litrosVendidos: Math.round(litrosVendidos * 100) / 100,
    };
  });

  // Totais acumulados
  const totalReceita = serie.reduce((acc, s) => acc + s.receita, 0);
  const totalCustoAlimentacao = serie.reduce((acc, s) => acc + s.custoAlimentacao, 0);
  const totalCusto = serie.reduce((acc, s) => acc + s.custoTotal, 0);
  const totalLitros = serie.reduce((acc, s) => acc + s.litrosVendidos, 0);
  const totalMargem = totalReceita - totalCusto;
  const custoLitro = totalLitros > 0 ? totalCusto / totalLitros : 0;
  const margemPct = totalReceita > 0 ? (totalMargem / totalReceita) * 100 : 0;

  return NextResponse.json({
    serie,
    totais: {
      receita: Math.round(totalReceita * 100) / 100,
      custoAlimentacao: Math.round(totalCustoAlimentacao * 100) / 100,
      custoTotal: Math.round(totalCusto * 100) / 100,
      margem: Math.round(totalMargem * 100) / 100,
      margemPct: Math.round(margemPct * 10) / 10,
      litrosVendidos: Math.round(totalLitros * 100) / 100,
      custoLitro: Math.round(custoLitro * 100) / 100,
    },
  });
}
