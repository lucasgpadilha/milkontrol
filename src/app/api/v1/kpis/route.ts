import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiAuth, apiSuccess, apiError } from "@/lib/api-helpers";
import {
  calcularKPIsRebanho,
  projetarReceita,
  type DadosAnimal,
  type DadosAlimentacao,
  type DadosVenda,
} from "@/lib/inteligencia-engine";

export async function GET(req: NextRequest) {
  const auth = await withApiAuth(req, "read");
  if (auth instanceof Response) return auth;
  const { ctx, rlHeaders } = auth;

  try {
    // Carregar dados para o engine (mesma lógica da rota interna)
    const [bovinosRaw, alimentacaoRaw, vendasRaw] = await Promise.all([
      prisma.bovino.findMany({
        where: { fazendaId: ctx.fazendaId, situacao: "ATIVA", sexo: "FEMEA", deletedAt: null },
        include: {
          producoes: { orderBy: { data: "desc" } },
          lactacoes: { orderBy: { inicio: "desc" } },
          inseminacoes: { orderBy: { data: "desc" } },
          registrosSanitarios: { orderBy: { data: "desc" } },
          pesagens: { orderBy: { data: "desc" } },
        },
      }),
      prisma.registroAlimentacao.findMany({
        where: { fazendaId: ctx.fazendaId },
        include: { piquete: { select: { _count: { select: { bovinos: true } } } } },
        orderBy: { data: "desc" },
      }),
      prisma.movimentacaoTanque.findMany({
        where: { tanque: { fazendaId: ctx.fazendaId }, tipo: "SAIDA", tipoSaida: "VENDA" },
        orderBy: { data: "desc" },
      }),
    ]);

    // Mapear para tipos do engine
    const animais: DadosAnimal[] = bovinosRaw.map((b) => ({
      id: b.id, brinco: b.brinco, nome: b.nome, raca: b.raca, sexo: b.sexo,
      situacao: b.situacao, dataNascimento: b.dataNascimento.toISOString(),
      piqueteId: b.piqueteId, piqueteNome: null,
      producoes: b.producoes.map((p) => ({ data: p.data.toISOString(), quantidade: p.quantidade })),
      lactacoes: b.lactacoes.map((l) => ({ inicio: l.inicio.toISOString(), fim: l.fim?.toISOString() || null })),
      inseminacoes: b.inseminacoes.map((i) => ({ data: i.data.toISOString(), prenhez: i.prenhez })),
      registrosSanitarios: b.registrosSanitarios.map((r) => ({
        data: r.data.toISOString(), tipo: r.tipo, produto: r.produto,
        diasCarencia: r.diasCarencia, fimCarencia: r.fimCarencia?.toISOString() || null,
      })),
      pesagens: b.pesagens.map((p) => ({ data: p.data.toISOString(), pesoKg: p.pesoKg })),
    }));

    const alimentacao: DadosAlimentacao[] = alimentacaoRaw.map((r) => ({
      piqueteId: r.piqueteId, quantidadeKg: r.quantidadeKg,
      custoUnitario: r.custoUnitario, data: r.data.toISOString(),
      piqueteBovinos: r.piquete._count.bovinos,
    }));

    const vendas: DadosVenda[] = vendasRaw.map((m) => ({
      data: m.data.toISOString(), quantidade: m.quantidade, precoLitro: m.precoLitro,
    }));

    // Calcular preço base
    const comPreco = vendas.filter((v) => v.precoLitro && v.precoLitro > 0);
    const precoBase = comPreco.length > 0
      ? comPreco.reduce((s, v) => s + v.precoLitro!, 0) / comPreco.length
      : 2.5;

    const kpis = calcularKPIsRebanho(animais, alimentacao, vendas, precoBase);
    const projecao = projetarReceita(vendas, precoBase);

    return apiSuccess({ kpis, projecao, precoLitroBase: precoBase }, undefined, rlHeaders);
  } catch (error) {
    console.error("[API v1 /kpis] Erro:", error);
    return apiError("internal_error", "Erro ao processar KPIs.", 500, rlHeaders);
  }
}
