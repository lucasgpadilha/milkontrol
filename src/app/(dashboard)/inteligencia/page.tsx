"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  AlertCircle,
  Info,
  Milk,
  Heart,
  DollarSign,
  BarChart3,
  ChevronRight,
  X,
  Beef,
  Syringe,
  Scale,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  Legend,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────

interface KPIs {
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

interface ScoreAnimal {
  id: string;
  brinco: string;
  nome: string | null;
  raca: string;
  score: number;
  fatores: {
    producao: number;
    fertilidade: number;
    custoBeneficio: number;
    saude: number;
  };
  del: number | null;
  mediaLitrosDia: number;
  lactacaoAtiva: boolean;
  ultimoPesoKg: number | null;
}

interface Alerta {
  tipo: string;
  severidade: "info" | "warning" | "critical";
  titulo: string;
  descricao: string;
  animalId?: string;
  animalBrinco?: string;
}

interface CurvaWoodPonto {
  del: number;
  producaoReal: number | null;
  producaoTeorica: number;
}

interface ROI {
  receita: number;
  custoTotal: number;
  roi: number;
  margemPct: number;
}

interface AnimalDetalhe {
  score: ScoreAnimal;
  curvaWood: CurvaWoodPonto[];
  roi: ROI;
  precoLitroBase: number;
}

interface Projecao {
  rotulo: string;
  real: number | null;
  projetado: number | null;
}

// ─── Componentes Auxiliares ──────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-500" : "text-red-500";
  const bg =
    score >= 70
      ? "from-emerald-500/20 to-emerald-500/5"
      : score >= 40
      ? "from-amber-500/20 to-amber-500/5"
      : "from-red-500/20 to-red-500/5";

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${bg}`}
    >
      <span className={`text-lg font-extrabold ${color}`}>{score}</span>
    </div>
  );
}

function SeverityIcon({ severidade }: { severidade: string }) {
  if (severidade === "critical")
    return <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />;
  if (severidade === "warning")
    return <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />;
  return <Info className="h-5 w-5 text-blue-500 shrink-0" />;
}

function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}) {
  return (
    <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {label}
            </p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
            {sub && <p className="text-xs text-gray-500">{sub}</p>}
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Drawer de Análise Individual ────────────────────────────────────

function AnimalDrawer({
  animalId,
  onClose,
}: {
  animalId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<AnimalDetalhe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/inteligencia?tipo=animal&id=${animalId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d);
        setLoading(false);
      });
  }, [animalId]);

  const radarData = data
    ? [
        { subject: "Produção", valor: data.score.fatores.producao, fullMark: 100 },
        { subject: "Fertilidade", valor: data.score.fatores.fertilidade, fullMark: 100 },
        { subject: "Custo-Benef.", valor: data.score.fatores.custoBeneficio, fullMark: 100 },
        { subject: "Saúde", valor: data.score.fatores.saude, fullMark: 100 },
      ]
    : [];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl overflow-y-auto animate-slide-in-right">
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-violet-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Diagnóstico Individual
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : !data ? (
          <div className="p-8 text-center text-gray-500">
            Não foi possível carregar diagnóstico.
          </div>
        ) : (
          <div className="p-5 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <ScoreCircle score={data.score.score} />
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {data.score.brinco}{" "}
                  {data.score.nome ? `— ${data.score.nome}` : ""}
                </h3>
                <p className="text-sm text-gray-500">
                  {data.score.raca} •{" "}
                  {data.score.lactacaoAtiva
                    ? `DEL ${data.score.del}`
                    : "Seca"}{" "}
                  • {formatNumber(data.score.mediaLitrosDia)}L/dia
                </p>
              </div>
            </div>

            {/* Radar */}
            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Mapa de Competências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                      />
                      <Radar
                        name="Score"
                        dataKey="valor"
                        stroke="#7c3aed"
                        fill="#7c3aed"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* ROI */}
            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  ROI — Últimos 30 dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-emerald-50 p-4 text-center">
                    <p className="text-xs font-medium text-emerald-700 uppercase">
                      Receita
                    </p>
                    <p className="text-xl font-bold text-emerald-800 mt-1">
                      R$ {formatNumber(data.roi.receita, 2)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-4 text-center">
                    <p className="text-xs font-medium text-red-700 uppercase">
                      Custo
                    </p>
                    <p className="text-xl font-bold text-red-800 mt-1">
                      R$ {formatNumber(data.roi.custoTotal, 2)}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl p-4 text-center col-span-2 ${
                      data.roi.roi >= 0 ? "bg-emerald-100" : "bg-red-100"
                    }`}
                  >
                    <p
                      className={`text-xs font-medium uppercase ${
                        data.roi.roi >= 0 ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      Retorno (Margem {data.roi.margemPct}%)
                    </p>
                    <p
                      className={`text-2xl font-extrabold mt-1 ${
                        data.roi.roi >= 0
                          ? "text-emerald-900"
                          : "text-red-900"
                      }`}
                    >
                      R$ {formatNumber(data.roi.roi, 2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Curva de Wood */}
            {data.curvaWood.length > 0 && (
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Curva de Lactação (Real vs. Wood)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Modelo teórico de Wood comparado com a produção real do animal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data.curvaWood}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f3f4f6"
                        />
                        <XAxis
                          dataKey="del"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#9ca3af" }}
                          label={{
                            value: "DEL",
                            position: "insideBottomRight",
                            offset: -5,
                            fill: "#6b7280",
                            fontSize: 11,
                          }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#9ca3af" }}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow:
                              "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          formatter={(val: any) =>
                            val !== null ? [`${Number(val).toFixed(1)} L`] : ["—"]
                          }
                        />
                        <Legend
                          verticalAlign="top"
                          iconType="line"
                          wrapperStyle={{ fontSize: 12 }}
                        />
                        <Line
                          name="Teórico (Wood)"
                          type="monotone"
                          dataKey="producaoTeorica"
                          stroke="#c084fc"
                          strokeWidth={2}
                          strokeDasharray="6 3"
                          dot={false}
                        />
                        <Line
                          name="Produção Real"
                          type="monotone"
                          dataKey="producaoReal"
                          stroke="#3b82f6"
                          strokeWidth={2.5}
                          connectNulls={false}
                          dot={{ r: 3, fill: "#3b82f6" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Página Principal ────────────────────────────────────────────────

export default function InteligenciaPage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [ranking, setRanking] = useState<ScoreAnimal[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [projecao, setProjecao] = useState<Projecao[]>([]);
  const [precoBase, setPrecoBase] = useState(0);
  const [drawerAnimalId, setDrawerAnimalId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [resRebanho, resRanking, resProjecao] = await Promise.all([
        fetch("/api/inteligencia?tipo=rebanho").then((r) => r.json()),
        fetch("/api/inteligencia?tipo=ranking").then((r) => r.json()),
        fetch("/api/inteligencia?tipo=projecao").then((r) => r.json()),
      ]);

      if (resRebanho.kpis) setKpis(resRebanho.kpis);
      if (resRebanho.precoLitroBase) setPrecoBase(resRebanho.precoLitroBase);
      if (resRanking.ranking) setRanking(resRanking.ranking);
      if (resRanking.alertas) setAlertas(resRanking.alertas);
      if (resProjecao.projecao) setProjecao(resProjecao.projecao);
    } catch (e) {
      console.error("Erro ao carregar inteligência:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 animate-pulse">
        <Brain className="h-12 w-12 text-violet-400" />
        <p className="text-gray-500 font-medium">
          Processando inteligência zootécnica...
        </p>
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
              <Brain className="h-5 w-5 text-white" />
            </div>
            Inteligência Zootécnica
          </h1>
          <p className="mt-1 text-gray-500">
            Diagnóstico computado do rebanho em tempo real — Score, ROI,
            Projeções e Alertas Preditivos
          </p>
        </div>
        <Badge
          variant="secondary"
          className="text-xs font-mono bg-violet-50 text-violet-700 border-violet-200"
        >
          R$ {formatNumber(precoBase, 2)}/L base
        </Badge>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <KPICard
            label="Média L/Vaca/Dia"
            value={`${formatNumber(kpis.mediaLitrosVacaDia)}L`}
            sub={`${kpis.totalVacasEmLactacao} em lactação`}
            icon={Milk}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <KPICard
            label="DEL Médio"
            value={`${kpis.delMedio}`}
            sub="dias em lactação"
            icon={Activity}
            color="text-teal-600"
            bg="bg-teal-50"
          />
          <KPICard
            label="Taxa Prenhez"
            value={`${kpis.taxaPrenhezGeral}%`}
            sub={`1º serviço: ${kpis.taxaPrenhezPrimeiroServico}%`}
            icon={Heart}
            color="text-pink-600"
            bg="bg-pink-50"
          />
          <KPICard
            label="Custo/Litro"
            value={`R$ ${formatNumber(kpis.custoMedioPorLitro, 2)}`}
            sub="alimentação estimada"
            icon={DollarSign}
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <KPICard
            label="Receita Mês"
            value={`R$ ${formatNumber(kpis.receitaMensal, 2)}`}
            sub={`${formatNumber(kpis.producaoTotalMes)}L produzidos`}
            icon={TrendingUp}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
        </div>
      )}

      {/* Projeção + Alertas */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Gráfico de Projeção */}
        <div className="lg:col-span-3">
          <Card className="shadow-sm border-gray-100 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-violet-500" />
                    Projeção Financeira
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    6 meses reais + 3 meses projetados (média móvel ponderada)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={projecao}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f3f4f6"
                    />
                    <XAxis
                      dataKey="rotulo"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#9ca3af" }}
                      tickFormatter={(v) =>
                        `R$${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}k`
                      }
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow:
                          "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(val: any) =>
                        val !== null
                          ? [`R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`]
                          : ["—"]
                      }
                    />
                    <Legend
                      verticalAlign="top"
                      iconType="rect"
                      wrapperStyle={{ fontSize: 12 }}
                    />
                    <Area
                      name="Receita Real"
                      type="monotone"
                      dataKey="real"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorReal)"
                      connectNulls={false}
                    />
                    <Area
                      name="Projeção"
                      type="monotone"
                      dataKey="projetado"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      strokeDasharray="6 3"
                      fillOpacity={1}
                      fill="url(#colorProj)"
                      connectNulls={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas Preditivos */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-gray-100 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alertas Inteligentes
              </CardTitle>
              <CardDescription className="text-xs">
                {alertas.length} alerta(s) ativo(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {alertas.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum alerta no momento. Rebanho saudável!</p>
                  </div>
                ) : (
                  alertas.slice(0, 15).map((a, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border p-3 text-sm transition-colors hover:shadow-sm ${
                        a.severidade === "critical"
                          ? "border-red-200 bg-red-50/50"
                          : a.severidade === "warning"
                          ? "border-amber-200 bg-amber-50/50"
                          : "border-blue-200 bg-blue-50/50"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <SeverityIcon severidade={a.severidade} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm leading-tight">
                            {a.titulo}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            {a.descricao}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ranking de Eficiência */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Beef className="h-4 w-4 text-violet-500" />
                Ranking de Eficiência do Rebanho
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Score 0-100 ponderado: Produção (35%) × Fertilidade (25%) × Custo-Benefício (25%) × Saúde (15%)
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {ranking.length} animais
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Brain className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>
                Sem dados suficientes para computar o ranking. Registre produção e inseminações.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="py-3 pr-3 text-left font-medium">#</th>
                    <th className="py-3 pr-3 text-left font-medium">Animal</th>
                    <th className="py-3 pr-3 text-left font-medium">Score</th>
                    <th className="py-3 pr-3 text-left font-medium hidden md:table-cell">
                      Produção
                    </th>
                    <th className="py-3 pr-3 text-left font-medium hidden md:table-cell">
                      Fertil.
                    </th>
                    <th className="py-3 pr-3 text-left font-medium hidden lg:table-cell">
                      Custo
                    </th>
                    <th className="py-3 pr-3 text-left font-medium hidden lg:table-cell">
                      Saúde
                    </th>
                    <th className="py-3 pr-3 text-left font-medium">L/dia</th>
                    <th className="py-3 pr-3 text-left font-medium hidden sm:table-cell">
                      DEL
                    </th>
                    <th className="py-3 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ranking.map((a, i) => {
                    const barColor =
                      a.score >= 70
                        ? "from-emerald-400 to-teal-500"
                        : a.score >= 40
                        ? "from-amber-400 to-orange-400"
                        : "from-red-400 to-rose-500";

                    return (
                      <tr
                        key={a.id}
                        className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                        onClick={() => setDrawerAnimalId(a.id)}
                      >
                        <td className="py-3.5 pr-3">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                              i === 0
                                ? "bg-yellow-100 text-yellow-700"
                                : i === 1
                                ? "bg-gray-100 text-gray-600"
                                : i === 2
                                ? "bg-amber-50 text-amber-700"
                                : "bg-gray-50 text-gray-400"
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3.5 pr-3">
                          <div>
                            <span className="font-semibold text-gray-900">
                              {a.brinco}
                            </span>
                            {a.nome && (
                              <span className="text-gray-500 ml-1.5">
                                — {a.nome}
                              </span>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {a.raca}
                              {a.ultimoPesoKg ? ` • ${a.ultimoPesoKg}kg` : ""}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-2.5 min-w-[120px]">
                            <span
                              className={`text-sm font-extrabold tabular-nums ${
                                a.score >= 70
                                  ? "text-emerald-600"
                                  : a.score >= 40
                                  ? "text-amber-600"
                                  : "text-red-600"
                              }`}
                            >
                              {a.score}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                                style={{ width: `${a.score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-3 hidden md:table-cell">
                          <MiniBar value={a.fatores.producao} color="blue" />
                        </td>
                        <td className="py-3.5 pr-3 hidden md:table-cell">
                          <MiniBar value={a.fatores.fertilidade} color="pink" />
                        </td>
                        <td className="py-3.5 pr-3 hidden lg:table-cell">
                          <MiniBar
                            value={a.fatores.custoBeneficio}
                            color="amber"
                          />
                        </td>
                        <td className="py-3.5 pr-3 hidden lg:table-cell">
                          <MiniBar value={a.fatores.saude} color="emerald" />
                        </td>
                        <td className="py-3.5 pr-3 font-medium text-gray-900 tabular-nums">
                          {formatNumber(a.mediaLitrosDia)}
                        </td>
                        <td className="py-3.5 pr-3 hidden sm:table-cell">
                          {a.lactacaoAtiva ? (
                            <Badge
                              variant="secondary"
                              className={`text-xs font-mono ${
                                (a.del || 0) > 240
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-gray-50 text-gray-600"
                              }`}
                            >
                              {a.del}d
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-gray-50 text-gray-400"
                            >
                              Seca
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-violet-500 transition-colors" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drawer */}
      {drawerAnimalId && (
        <AnimalDrawer
          animalId={drawerAnimalId}
          onClose={() => setDrawerAnimalId(null)}
        />
      )}
    </div>
  );
}

// ─── Mini Barra de Fator ─────────────────────────────────────────────

function MiniBar({ value, color }: { value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-400",
    pink: "bg-pink-400",
    amber: "bg-amber-400",
    emerald: "bg-emerald-400",
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500 tabular-nums w-6 text-right">
        {value}
      </span>
      <div className="w-14 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${colors[color] || "bg-gray-400"} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
