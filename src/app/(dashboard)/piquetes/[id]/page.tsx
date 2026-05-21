"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Fence, Beef, Milk, Loader2, Pencil,
  ChevronRight, TrendingUp, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface BovinoResumido {
  id: string;
  brinco: string;
  nome: string | null;
  raca: string;
  sexo: "MACHO" | "FEMEA";
  situacao: string;
  emLactacao: boolean;
  del: number | null;
  producaoDia: number;
}

interface PiqueteDetalhe {
  id: string;
  nome: string;
  descricao: string | null;
  fazenda: { nome: string };
  stats: {
    totalBovinos: number;
    emLactacao: number;
    secas: number;
    machos: number;
    mediaProducaoDiaria: number;
    delMedio: number;
    porRaca: { raca: string; count: number }[];
  };
  bovinos: BovinoResumido[];
}

const RACA_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ec4899",
  "#8b5cf6", "#06b6d4", "#f97316", "#84cc16",
];

export default function PiqueteDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [piquete, setPiquete] = useState<PiqueteDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "lactacao" | "secas" | "machos">("todos");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/piquetes/${id}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setPiquete(d); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  );

  if (!piquete) return (
    <div className="text-center py-20 text-gray-500">Piquete não encontrado.</div>
  );

  const { stats, bovinos } = piquete;

  const bovinosFiltrados = bovinos.filter(b => {
    if (filtro === "lactacao") return b.emLactacao;
    if (filtro === "secas") return b.sexo === "FEMEA" && !b.emLactacao;
    if (filtro === "machos") return b.sexo === "MACHO";
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/piquetes")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Fence className="h-5 w-5 text-emerald-600" />
              <h1 className="text-2xl font-bold text-gray-900">{piquete.nome}</h1>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {piquete.fazenda.nome}
              {piquete.descricao && <> · {piquete.descricao}</>}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/piquetes")}
          className="self-start sm:self-auto"
        >
          <Pencil className="h-4 w-4 mr-1.5" /> Editar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-bold text-gray-900">{stats.totalBovinos}</div>
            <p className="text-xs text-gray-400 mt-0.5">bovinos no piquete</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Em Lactação
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-bold text-emerald-700">{stats.emLactacao}</div>
            <p className="text-xs text-gray-400 mt-0.5">
              {stats.secas} secas · {stats.machos} machos
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Produção Média
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-bold text-blue-700">
              {stats.mediaProducaoDiaria}
              <span className="text-base font-normal text-gray-400 ml-1">L/dia</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">média últimos 7 dias</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              DEL Médio
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-bold text-purple-700">
              {stats.delMedio}
              <span className="text-base font-normal text-gray-400 ml-1">dias</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">dias em lactação (média)</p>
          </CardContent>
        </Card>
      </div>

      {/* Composição por Raça */}
      {stats.porRaca.length > 0 && (
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="p-5 pb-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              Composição do Lote por Raça
            </h3>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.porRaca}
                    dataKey="count"
                    nameKey="raca"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {stats.porRaca.map((_, i) => (
                      <Cell key={i} fill={RACA_COLORS[i % RACA_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Bovinos */}
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Beef className="h-5 w-5 text-gray-400" />
            Animais no Piquete
          </h2>
          {/* Filtros rápidos */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { key: "todos", label: `Todos (${stats.totalBovinos})` },
              { key: "lactacao", label: `Lactação (${stats.emLactacao})` },
              { key: "secas", label: `Secas (${stats.secas})` },
              { key: "machos", label: `Machos (${stats.machos})` },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key as typeof filtro)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filtro === f.key
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {bovinosFiltrados.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-10 text-center text-gray-400">
            Nenhum animal neste filtro.
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {bovinosFiltrados.map(b => (
              <Link key={b.id} href={`/bovinos/${b.id}`}>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-emerald-300 hover:shadow-sm transition-all group cursor-pointer">
                  {/* Status dot */}
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                    b.emLactacao ? "bg-emerald-500" : b.sexo === "MACHO" ? "bg-blue-400" : "bg-gray-300"
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-gray-900 text-sm">{b.brinco}</span>
                      {b.nome && <span className="text-xs text-gray-500 truncate">{b.nome}</span>}
                    </div>
                    <div className="flex gap-2 mt-0.5 text-xs text-gray-400">
                      <span>{b.raca}</span>
                      {b.emLactacao && b.del !== null && (
                        <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                          <Milk className="h-3 w-3" />{b.del} DEL
                        </span>
                      )}
                      {!b.emLactacao && b.sexo === "FEMEA" && (
                        <span className="text-gray-400">Seca</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {b.producaoDia > 0 && (
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md">
                        {b.producaoDia}L
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
