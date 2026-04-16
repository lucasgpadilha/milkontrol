import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";
import {
  calcularScoreEficiencia,
  calcularKPIsRebanho,
  calcularCurvaWood,
  calcularROI,
  gerarAlertasPreditivos,
  projetarReceita,
  type DadosAnimal,
  type DadosAlimentacao,
  type DadosVenda,
} from "@/lib/inteligencia-engine";

// ─── Helpers para carregar dados ─────────────────────────────────────

async function carregarAnimais(fazendaIds: string[]): Promise<DadosAnimal[]> {
  const bovinos = await prisma.bovino.findMany({
    where: {
      fazendaId: { in: fazendaIds },
      situacao: "ATIVA",
      sexo: "FEMEA",
      deletedAt: null,
    },
    include: {
      producoes: { orderBy: { data: "desc" } },
      lactacoes: { orderBy: { inicio: "desc" } },
      inseminacoes: { orderBy: { data: "desc" } },
      registrosSanitarios: { orderBy: { data: "desc" } },
      pesagens: { orderBy: { data: "desc" } },
      piquete: { select: { nome: true } },
    },
  });

  return bovinos.map((b) => ({
    id: b.id,
    brinco: b.brinco,
    nome: b.nome,
    raca: b.raca,
    sexo: b.sexo,
    situacao: b.situacao,
    dataNascimento: b.dataNascimento.toISOString(),
    piqueteId: b.piqueteId,
    piqueteNome: b.piquete?.nome || null,
    producoes: b.producoes.map((p) => ({
      data: p.data.toISOString(),
      quantidade: p.quantidade,
    })),
    lactacoes: b.lactacoes.map((l) => ({
      inicio: l.inicio.toISOString(),
      fim: l.fim?.toISOString() || null,
    })),
    inseminacoes: b.inseminacoes.map((i) => ({
      data: i.data.toISOString(),
      prenhez: i.prenhez,
    })),
    registrosSanitarios: b.registrosSanitarios.map((r) => ({
      data: r.data.toISOString(),
      tipo: r.tipo,
      produto: r.produto,
      diasCarencia: r.diasCarencia,
      fimCarencia: r.fimCarencia?.toISOString() || null,
    })),
    pesagens: b.pesagens.map((p) => ({
      data: p.data.toISOString(),
      pesoKg: p.pesoKg,
    })),
  }));
}

async function carregarAlimentacao(fazendaIds: string[]): Promise<DadosAlimentacao[]> {
  const registros = await prisma.registroAlimentacao.findMany({
    where: { fazendaId: { in: fazendaIds } },
    include: {
      piquete: {
        select: {
          id: true,
          _count: { select: { bovinos: true } },
        },
      },
    },
    orderBy: { data: "desc" },
  });

  return registros.map((r) => ({
    piqueteId: r.piqueteId,
    quantidadeKg: r.quantidadeKg,
    custoUnitario: r.custoUnitario,
    data: r.data.toISOString(),
    piqueteBovinos: r.piquete._count.bovinos,
  }));
}

async function carregarVendas(fazendaIds: string[]): Promise<DadosVenda[]> {
  const movs = await prisma.movimentacaoTanque.findMany({
    where: {
      tanque: { fazendaId: { in: fazendaIds } },
      tipo: "SAIDA",
      tipoSaida: "VENDA",
    },
    select: {
      data: true,
      quantidade: true,
      precoLitro: true,
      comprador: true,
    },
    orderBy: { data: "desc" },
  });

  return movs.map((m) => ({
    data: m.data.toISOString(),
    quantidade: m.quantidade,
    precoLitro: m.precoLitro,
  }));
}

function calcularPrecoBase(vendas: DadosVenda[]): number {
  const comPreco = vendas.filter((v) => v.precoLitro && v.precoLitro > 0);
  if (comPreco.length === 0) return 2.5; // fallback padrão Brasil
  return comPreco.reduce((s, v) => s + v.precoLitro!, 0) / comPreco.length;
}

function calcularCustoAlimDiario(
  alimentacao: DadosAlimentacao[],
  totalAnimais: number
): number {
  if (alimentacao.length === 0 || totalAnimais === 0) return 3.0; // fallback R$ 3/dia
  
  const agora = new Date();
  const hojeMinus30 = new Date();
  hojeMinus30.setDate(hojeMinus30.getDate() - 30);

  const alim30 = alimentacao.filter((a) => new Date(a.data) >= hojeMinus30);
  const custoTotal30 = alim30.reduce(
    (s, a) => s + a.quantidadeKg * (a.custoUnitario || 0),
    0
  );

  return custoTotal30 > 0 ? custoTotal30 / totalAnimais / 30 : 3.0;
}

// ─── Handler GET ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const ctx = await getFazendaAtivaIds();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo") || "rebanho";
  const animalId = searchParams.get("id");

  try {
    // Carregar dados base (paralelo)
    const [animais, alimentacao, vendas] = await Promise.all([
      carregarAnimais(ctx.fazendaIds),
      carregarAlimentacao(ctx.fazendaIds),
      carregarVendas(ctx.fazendaIds),
    ]);

    const precoBase = calcularPrecoBase(vendas);
    const custoAlimDiario = calcularCustoAlimDiario(alimentacao, animais.length);

    // Média de produção do rebanho (últimos 30 dias)
    const hojeMinus30 = new Date();
    hojeMinus30.setDate(hojeMinus30.getDate() - 30);
    let somaMediaRebanho = 0;
    let vacasComDado = 0;
    for (const a of animais) {
      const p30 = a.producoes.filter((p) => new Date(p.data) >= hojeMinus30);
      const dias = new Set(p30.map((p) => p.data.split("T")[0])).size;
      if (dias > 0) {
        somaMediaRebanho += p30.reduce((s, p) => s + p.quantidade, 0) / dias;
        vacasComDado++;
      }
    }
    const mediaRebanho = vacasComDado > 0 ? somaMediaRebanho / vacasComDado : 0;

    // ── Dispatch por tipo ──
    switch (tipo) {
      case "rebanho": {
        const kpis = calcularKPIsRebanho(animais, alimentacao, vendas, precoBase);
        return NextResponse.json({
          tipo: "rebanho",
          computadoEm: new Date().toISOString(),
          precoLitroBase: precoBase,
          custoAlimDiarioEstimado: custoAlimDiario,
          kpis,
        });
      }

      case "ranking": {
        const scores = animais
          .map((a) =>
            calcularScoreEficiencia(a, mediaRebanho, custoAlimDiario, precoBase)
          )
          .sort((a, b) => b.score - a.score);

        const alertas = gerarAlertasPreditivos(animais);

        return NextResponse.json({
          tipo: "ranking",
          computadoEm: new Date().toISOString(),
          totalAnimais: animais.length,
          mediaRebanhoLDia: Number(mediaRebanho.toFixed(2)),
          ranking: scores,
          alertas,
        });
      }

      case "animal": {
        if (!animalId) {
          return NextResponse.json(
            { error: "Parâmetro 'id' é obrigatório para tipo=animal" },
            { status: 400 }
          );
        }

        const animal = animais.find((a) => a.id === animalId);
        if (!animal) {
          return NextResponse.json(
            { error: "Animal não encontrado" },
            { status: 404 }
          );
        }

        const score = calcularScoreEficiencia(
          animal,
          mediaRebanho,
          custoAlimDiario,
          precoBase
        );

        const lactAtiva = animal.lactacoes.find((l) => l.fim === null);
        const curvaWood = calcularCurvaWood(
          animal.producoes,
          lactAtiva?.inicio || (animal.lactacoes[0]?.inicio ?? null)
        );

        const custoSanitario =
          animal.registrosSanitarios.length * 15; // estimativa R$15/procedimento
        const roi = calcularROI(
          animal.producoes,
          custoAlimDiario,
          custoSanitario,
          precoBase
        );

        return NextResponse.json({
          tipo: "animal",
          computadoEm: new Date().toISOString(),
          score,
          curvaWood,
          roi,
          precoLitroBase: precoBase,
        });
      }

      case "projecao": {
        const projecao = projetarReceita(vendas, precoBase);
        const kpis = calcularKPIsRebanho(animais, alimentacao, vendas, precoBase);

        return NextResponse.json({
          tipo: "projecao",
          computadoEm: new Date().toISOString(),
          precoLitroBase: precoBase,
          receitaMesAtual: kpis.receitaMensal,
          projecao,
        });
      }

      default:
        return NextResponse.json(
          { error: `Tipo '${tipo}' não reconhecido. Use: rebanho, ranking, animal, projecao` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[API Inteligência] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar análise de inteligência" },
      { status: 500 }
    );
  }
}
