/**
 * 🧠 Motor de Inteligência Zootécnica — MilKontrol
 *
 * Módulo puro de funções analíticas que recebe dados brutos e retorna
 * indicadores computados. Sem side-effects, sem Prisma, sem IO.
 *
 * Domínios cruzados: Produção, Reprodução, Nutrição, Sanidade, Peso, Finanças.
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface DadosAnimal {
  id: string;
  brinco: string;
  nome: string | null;
  raca: string;
  sexo: "MACHO" | "FEMEA";
  situacao: string;
  dataNascimento: string;
  piqueteId: string | null;
  piqueteNome: string | null;
  producoes: { data: string; quantidade: number }[];
  lactacoes: { inicio: string; fim: string | null }[];
  inseminacoes: { data: string; prenhez: boolean | null }[];
  registrosSanitarios: {
    data: string;
    tipo: string;
    produto: string;
    diasCarencia: number;
    fimCarencia: string | null;
  }[];
  pesagens: { data: string; pesoKg: number }[];
}

export interface DadosAlimentacao {
  piqueteId: string;
  quantidadeKg: number;
  custoUnitario: number | null;
  data: string;
  piqueteBovinos: number; // nº de animais no piquete
}

export interface DadosVenda {
  data: string;
  quantidade: number;
  precoLitro: number | null;
}

export interface ScoreEficiencia {
  id: string;
  brinco: string;
  nome: string | null;
  raca: string;
  score: number;
  fatores: {
    producao: number;     // 0-100
    fertilidade: number;  // 0-100
    custoBeneficio: number; // 0-100
    saude: number;        // 0-100
  };
  del: number | null; // Dias em lactação (null = seca)
  mediaLitrosDia: number;
  lactacaoAtiva: boolean;
  ultimoPesoKg: number | null;
}

export interface PontosCurvaWood {
  del: number;
  producaoReal: number | null;
  producaoTeorica: number;
}

export interface AlertaPreditivo {
  tipo: "SECAGEM" | "RETORNO_POS_PARTO" | "CARENCIA_VENCENDO" | "VACINA_PENDENTE" | "QUEDA_PRODUCAO" | "PRENHEZ_PENDENTE" | "SEM_LACTACAO";
  severidade: "info" | "warning" | "critical";
  titulo: string;
  descricao: string;
  animalId?: string;
  animalBrinco?: string;
  animalNome?: string | null;
  dataLimite?: string;
}

export interface KPIsRebanho {
  mediaLitrosVacaDia: number;
  delMedio: number;
  taxaPrenhezGeral: number;
  taxaPrenhezPrimeiroServico: number;
  custoMedioPorLitro: number;
  receitaMensal: number;
  totalVacasEmLactacao: number;
  totalVacasSecas: number;
  totalAnimais: number;
  producaoTotalMes: number;
  ganhoMedioKgDia: number | null;
}

export interface ProjecaoFinanceira {
  rotulo: string;
  real: number | null;
  projetado: number | null;
}

// ─── Constantes ──────────────────────────────────────────────────────

// Parâmetros default da Curva de Wood (Girolando/Holandês)
const WOOD_A = 15;   // escala
const WOOD_B = 0.25; // inclinação até pico
const WOOD_C = 0.003; // declínio pós-pico

const PESOS_SCORE = {
  producao: 0.35,
  fertilidade: 0.25,
  custoBeneficio: 0.25,
  saude: 0.15,
};

// ─── Utilitários ─────────────────────────────────────────────────────

function diffDias(a: string | Date, b: string | Date): number {
  return Math.floor(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function mediaPonderadaExponencial(valores: number[]): number {
  if (valores.length === 0) return 0;
  let somaP = 0;
  let somaV = 0;
  valores.forEach((v, i) => {
    const peso = Math.exp(-0.05 * i); // mais recente = maior peso
    somaV += v * peso;
    somaP += peso;
  });
  return somaP > 0 ? somaV / somaP : 0;
}

// ─── Curva de Wood ───────────────────────────────────────────────────

/**
 * Gera a curva de Wood teórica e sobrepõe com dados reais do animal
 * para comparação visual.
 */
export function calcularCurvaWood(
  producoes: { data: string; quantidade: number }[],
  lactacaoInicio: string | null,
  a = WOOD_A,
  b = WOOD_B,
  c = WOOD_C
): PontosCurvaWood[] {
  if (!lactacaoInicio) return [];

  const inicio = new Date(lactacaoInicio);
  const maxDel = 305; // lactação padrão

  // Agrupar produções reais por DEL
  const realPorDel = new Map<number, number>();
  producoes.forEach((p) => {
    const del = diffDias(inicio, p.data);
    if (del >= 0 && del <= maxDel) {
      realPorDel.set(del, (realPorDel.get(del) || 0) + p.quantidade);
    }
  });

  // Gerar pontos amostrados a cada 5 dias
  const pontos: PontosCurvaWood[] = [];
  for (let t = 1; t <= maxDel; t += 5) {
    const teorico = a * Math.pow(t, b) * Math.exp(-c * t);

    // Procurar produção real num raio de ±2 dias
    let real: number | null = null;
    for (let d = t - 2; d <= t + 2; d++) {
      if (realPorDel.has(d)) {
        real = realPorDel.get(d)!;
        break;
      }
    }

    pontos.push({
      del: t,
      producaoReal: real,
      producaoTeorica: Number(teorico.toFixed(2)),
    });
  }

  return pontos;
}

// ─── Score de Eficiência ─────────────────────────────────────────────

export function calcularScoreEficiencia(
  animal: DadosAnimal,
  mediaRebanho: number,
  custoAlimentacaoDiario: number, // R$/dia estimado por cabeça
  precoLeiteBase: number          // R$/litro base
): ScoreEficiencia {
  // ── Produção ──
  const hojeMinus30 = new Date();
  hojeMinus30.setDate(hojeMinus30.getDate() - 30);

  const prods30 = animal.producoes.filter(
    (p) => new Date(p.data) >= hojeMinus30
  );
  const totalLitros30 = prods30.reduce((s, p) => s + p.quantidade, 0);
  const diasComProducao = new Set(prods30.map((p) => p.data.split("T")[0])).size;
  const mediaLitrosDia = diasComProducao > 0 ? totalLitros30 / diasComProducao : 0;

  let fatorProducao = 0;
  if (mediaRebanho > 0) {
    fatorProducao = Math.min(100, (mediaLitrosDia / mediaRebanho) * 100);
  }

  // ── Fertilidade ──
  const insResolvidas = animal.inseminacoes.filter((i) => i.prenhez !== null);
  const prenhes = insResolvidas.filter((i) => i.prenhez === true).length;
  const fatorFertilidade =
    insResolvidas.length > 0 ? (prenhes / insResolvidas.length) * 100 : 50; // neutral se sem dados

  // ── Custo-benefício ──
  const receitaMes = totalLitros30 * precoLeiteBase;
  const custoMes = custoAlimentacaoDiario * 30;
  let fatorCusto = 50; // neutral
  if (receitaMes > 0) {
    const margem = ((receitaMes - custoMes) / receitaMes) * 100;
    fatorCusto = Math.max(0, Math.min(100, margem));
  }

  // ── Saúde ──
  let fatorSaude = 100;
  const agora = new Date();

  // Penalizar por tratamentos nos últimos 60 dias
  const tratamentos60 = animal.registrosSanitarios.filter((r) => {
    const dataR = new Date(r.data);
    const diff = diffDias(r.data, agora.toISOString());
    return diff <= 60 && (r.tipo === "MEDICAMENTO" || r.tipo === "TRATAMENTO");
  });
  fatorSaude -= tratamentos60.length * 15; // -15 por tratamento

  // Bônus por vacinação em dia (vacinas nos últimos 180 dias)
  const vacinas180 = animal.registrosSanitarios.filter((r) => {
    const diff = diffDias(r.data, agora.toISOString());
    return diff <= 180 && r.tipo === "VACINA";
  });
  if (vacinas180.length > 0) fatorSaude += 10;

  // Penalizar se em carência agora
  const emCarencia = animal.registrosSanitarios.some(
    (r) => r.fimCarencia && new Date(r.fimCarencia) > agora
  );
  if (emCarencia) fatorSaude -= 20;

  fatorSaude = Math.max(0, Math.min(100, fatorSaude));

  // ── Score final ──
  const score = Math.round(
    fatorProducao * PESOS_SCORE.producao +
    fatorFertilidade * PESOS_SCORE.fertilidade +
    fatorCusto * PESOS_SCORE.custoBeneficio +
    fatorSaude * PESOS_SCORE.saude
  );

  // ── DEL ──
  const lactAtiva = animal.lactacoes.find((l) => l.fim === null);
  const del = lactAtiva ? diffDias(lactAtiva.inicio, new Date().toISOString()) : null;

  // ── Último peso ──
  const ultimoPeso = animal.pesagens.length > 0 ? animal.pesagens[0].pesoKg : null;

  return {
    id: animal.id,
    brinco: animal.brinco,
    nome: animal.nome,
    raca: animal.raca,
    score: Math.max(0, Math.min(100, score)),
    fatores: {
      producao: Math.round(fatorProducao),
      fertilidade: Math.round(fatorFertilidade),
      custoBeneficio: Math.round(fatorCusto),
      saude: Math.round(fatorSaude),
    },
    del,
    mediaLitrosDia: Number(mediaLitrosDia.toFixed(2)),
    lactacaoAtiva: !!lactAtiva,
    ultimoPesoKg: ultimoPeso,
  };
}

// ─── Alertas Preditivos ──────────────────────────────────────────────

export function gerarAlertasPreditivos(animais: DadosAnimal[]): AlertaPreditivo[] {
  const alertas: AlertaPreditivo[] = [];
  const agora = new Date();

  for (const a of animais) {
    if (a.sexo !== "FEMEA" || a.situacao !== "ATIVA") continue;

    // 1. Secagem iminente (DEL > 240)
    const lactAtiva = a.lactacoes.find((l) => l.fim === null);
    if (lactAtiva) {
      const del = diffDias(lactAtiva.inicio, agora.toISOString());
      if (del > 240) {
        alertas.push({
          tipo: "SECAGEM",
          severidade: del > 280 ? "critical" : "warning",
          titulo: `Secagem urgente: ${a.brinco}`,
          descricao: `DEL ${del} — ultrapassou 240 dias. Programar secagem imediata para descanso pré-parto.`,
          animalId: a.id,
          animalBrinco: a.brinco,
          animalNome: a.nome,
        });
      }

      // 5. Queda acentuada de produção (últimos 7 vs 7 anteriores)
      const prods = a.producoes
        .map((p) => ({ ...p, d: new Date(p.data) }))
        .sort((x, y) => y.d.getTime() - x.d.getTime());

      if (prods.length >= 14) {
        const ultimos7 = prods.slice(0, 7).reduce((s, p) => s + p.quantidade, 0) / 7;
        const anteriores7 = prods.slice(7, 14).reduce((s, p) => s + p.quantidade, 0) / 7;
        if (anteriores7 > 0 && ultimos7 < anteriores7 * 0.7) {
          alertas.push({
            tipo: "QUEDA_PRODUCAO",
            severidade: "warning",
            titulo: `Queda de produção: ${a.brinco}`,
            descricao: `Produção caiu ${Math.round((1 - ultimos7 / anteriores7) * 100)}% na última semana. Investigar saúde e alimentação.`,
            animalId: a.id,
            animalBrinco: a.brinco,
            animalNome: a.nome,
          });
        }
      }
    } else {
      // Vaca sem lactação ativa — verificar se está seca há muito tempo
      const ultimaLact = a.lactacoes.length > 0 ? a.lactacoes[0] : null;
      if (ultimaLact?.fim) {
        const diasSeca = diffDias(ultimaLact.fim, agora.toISOString());
        if (diasSeca > 90) {
          alertas.push({
            tipo: "RETORNO_POS_PARTO",
            severidade: "info",
            titulo: `Retorno pós-parto: ${a.brinco}`,
            descricao: `Seca há ${diasSeca} dias. Verificar se já pariu e iniciar nova lactação.`,
            animalId: a.id,
            animalBrinco: a.brinco,
            animalNome: a.nome,
          });
        }
      }
    }

    // 2. Carência vencendo em breve (< 3 dias)
    for (const rs of a.registrosSanitarios) {
      if (rs.fimCarencia) {
        const diasRestantes = diffDias(agora.toISOString(), rs.fimCarencia);
        if (diasRestantes > 0 && diasRestantes <= 3) {
          alertas.push({
            tipo: "CARENCIA_VENCENDO",
            severidade: "info",
            titulo: `Carência liberando: ${a.brinco}`,
            descricao: `Produto "${rs.produto}" — carência encerra em ${diasRestantes} dia(s). Leite liberado em breve.`,
            animalId: a.id,
            animalBrinco: a.brinco,
            animalNome: a.nome,
            dataLimite: rs.fimCarencia,
          });
        }
      }
    }

    // 3. Prenhez pendente há mais de 45 dias
    const insAberta = a.inseminacoes.find((i) => i.prenhez === null);
    if (insAberta) {
      const diasPendente = diffDias(insAberta.data, agora.toISOString());
      if (diasPendente > 45) {
        alertas.push({
          tipo: "PRENHEZ_PENDENTE",
          severidade: "warning",
          titulo: `Diagnóstico pendente: ${a.brinco}`,
          descricao: `Inseminação há ${diasPendente} dias sem resultado de prenhez. Agendar toque retal.`,
          animalId: a.id,
          animalBrinco: a.brinco,
          animalNome: a.nome,
        });
      }
    }
  }

  // Ordenar: critical > warning > info
  const ordemSeveridade: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  alertas.sort((a, b) => ordemSeveridade[a.severidade] - ordemSeveridade[b.severidade]);

  return alertas;
}

// ─── ROI por Animal ──────────────────────────────────────────────────

export function calcularROI(
  producoes: { data: string; quantidade: number }[],
  custoAlimentacaoDiario: number,
  custoSanitario: number,
  precoLitro: number,
  diasPeriodo = 30
): { receita: number; custoTotal: number; roi: number; margemPct: number } {
  const hojeMinus = new Date();
  hojeMinus.setDate(hojeMinus.getDate() - diasPeriodo);

  const prodsNo = producoes.filter((p) => new Date(p.data) >= hojeMinus);
  const totalLitros = prodsNo.reduce((s, p) => s + p.quantidade, 0);

  const receita = totalLitros * precoLitro;
  const custoTotal = custoAlimentacaoDiario * diasPeriodo + custoSanitario;
  const roi = receita - custoTotal;
  const margemPct = receita > 0 ? (roi / receita) * 100 : 0;

  return {
    receita: Number(receita.toFixed(2)),
    custoTotal: Number(custoTotal.toFixed(2)),
    roi: Number(roi.toFixed(2)),
    margemPct: Number(margemPct.toFixed(1)),
  };
}

// ─── KPIs do Rebanho ─────────────────────────────────────────────────

export function calcularKPIsRebanho(
  animais: DadosAnimal[],
  alimentacao: DadosAlimentacao[],
  vendas: DadosVenda[],
  precoLitroBase: number
): KPIsRebanho {
  const agora = new Date();
  const mesInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const femeas = animais.filter((a) => a.sexo === "FEMEA" && a.situacao === "ATIVA");

  // Lactação
  let somaMediaDia = 0;
  let somaDEL = 0;
  let vacasComDado = 0;
  let totalLactacao = 0;
  let totalSecas = 0;

  for (const v of femeas) {
    const lactAtiva = v.lactacoes.find((l) => l.fim === null);
    if (lactAtiva) {
      totalLactacao++;
      const del = diffDias(lactAtiva.inicio, agora.toISOString());
      somaDEL += del;

      // Média últimos 7 dias
      const hojeMinus7 = new Date();
      hojeMinus7.setDate(hojeMinus7.getDate() - 7);
      const p7 = v.producoes.filter((p) => new Date(p.data) >= hojeMinus7);
      const dias7 = new Set(p7.map((p) => p.data.split("T")[0])).size;
      if (dias7 > 0) {
        somaMediaDia += p7.reduce((s, p) => s + p.quantidade, 0) / dias7;
        vacasComDado++;
      }
    } else {
      totalSecas++;
    }
  }

  // Produção total deste mês
  const producaoTotalMes = animais.reduce((total, a) => {
    return (
      total +
      a.producoes
        .filter((p) => new Date(p.data) >= mesInicio)
        .reduce((s, p) => s + p.quantidade, 0)
    );
  }, 0);

  // Prenhez
  const todasIns = animais.flatMap((a) => a.inseminacoes);
  const resolvidas = todasIns.filter((i) => i.prenhez !== null);
  const prenhes = resolvidas.filter((i) => i.prenhez === true).length;
  const taxaPrenhezGeral = resolvidas.length > 0 ? (prenhes / resolvidas.length) * 100 : 0;

  // First service: primeira inseminação de cada animal
  const primeirasIns = animais
    .filter((a) => a.inseminacoes.length > 0)
    .map((a) => {
      const sorted = [...a.inseminacoes].sort(
        (x, y) => new Date(x.data).getTime() - new Date(y.data).getTime()
      );
      return sorted[0];
    })
    .filter((i) => i.prenhez !== null);
  const prenhesFirst = primeirasIns.filter((i) => i.prenhez === true).length;
  const taxaPrenhezPrimeiro =
    primeirasIns.length > 0 ? (prenhesFirst / primeirasIns.length) * 100 : 0;

  // Custo alimentação mensal
  const alimentMes = alimentacao.filter(
    (a) => new Date(a.data) >= mesInicio
  );
  const custoAlimentMes = alimentMes.reduce((s, a) => {
    return s + a.quantidadeKg * (a.custoUnitario || 0) * a.piqueteBovinos;
  }, 0);

  const custoMedioPorLitro =
    producaoTotalMes > 0 ? custoAlimentMes / producaoTotalMes : 0;

  // Receita mensal (vendas do mês)
  const vendasMes = vendas.filter((v) => new Date(v.data) >= mesInicio);
  const receitaMensal = vendasMes.reduce(
    (s, v) => s + v.quantidade * (v.precoLitro || precoLitroBase),
    0
  );

  // Ganho de peso médio (kg/dia) — animais com ≥2 pesagens
  let somaGanho = 0;
  let animaisComGanho = 0;
  for (const a of animais) {
    if (a.pesagens.length >= 2) {
      const sorted = [...a.pesagens].sort(
        (x, y) => new Date(x.data).getTime() - new Date(y.data).getTime()
      );
      const primeiro = sorted[0];
      const ultimo = sorted[sorted.length - 1];
      const dias = diffDias(primeiro.data, ultimo.data);
      if (dias > 0) {
        somaGanho += (ultimo.pesoKg - primeiro.pesoKg) / dias;
        animaisComGanho++;
      }
    }
  }

  return {
    mediaLitrosVacaDia: vacasComDado > 0 ? Number((somaMediaDia / vacasComDado).toFixed(2)) : 0,
    delMedio: totalLactacao > 0 ? Math.round(somaDEL / totalLactacao) : 0,
    taxaPrenhezGeral: Number(taxaPrenhezGeral.toFixed(1)),
    taxaPrenhezPrimeiroServico: Number(taxaPrenhezPrimeiro.toFixed(1)),
    custoMedioPorLitro: Number(custoMedioPorLitro.toFixed(2)),
    receitaMensal: Number(receitaMensal.toFixed(2)),
    totalVacasEmLactacao: totalLactacao,
    totalVacasSecas: totalSecas,
    totalAnimais: animais.length,
    producaoTotalMes: Number(producaoTotalMes.toFixed(2)),
    ganhoMedioKgDia: animaisComGanho > 0 ? Number((somaGanho / animaisComGanho).toFixed(3)) : null,
  };
}

// ─── Projeção Financeira ─────────────────────────────────────────────

export function projetarReceita(
  vendas: DadosVenda[],
  precoLitroBase: number
): ProjecaoFinanceira[] {
  const agora = new Date();
  const pontos: ProjecaoFinanceira[] = [];

  // Últimos 6 meses reais
  const receitasMensais: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const inicio = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const fim = new Date(agora.getFullYear(), agora.getMonth() - i + 1, 0, 23, 59, 59);

    const vendasMes = vendas.filter((v) => {
      const d = new Date(v.data);
      return d >= inicio && d <= fim;
    });

    const receita = vendasMes.reduce(
      (s, v) => s + v.quantidade * (v.precoLitro || precoLitroBase),
      0
    );
    receitasMensais.push(receita);

    const rotulo = inicio.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    pontos.push({ rotulo, real: Number(receita.toFixed(2)), projetado: null });
  }

  // Projeção: 3 meses futuros via média móvel ponderada
  const valoresParaProjecao = [...receitasMensais];
  for (let i = 1; i <= 3; i++) {
    const mesProj = new Date(agora.getFullYear(), agora.getMonth() + i, 1);
    const rotulo = mesProj.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

    const projetado = mediaPonderadaExponencial([...valoresParaProjecao].reverse());
    valoresParaProjecao.push(projetado);

    pontos.push({
      rotulo,
      real: null,
      projetado: Number(projetado.toFixed(2)),
    });
  }

  return pontos;
}
