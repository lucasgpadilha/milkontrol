"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wheat,
  Milk,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Hint } from "@/components/hint";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

interface SerieMensal {
  mes: string;
  receita: number;
  custoAlimentacao: number;
  custoTotal: number;
  margem: number;
  litrosVendidos: number;
}

interface Totais {
  receita: number;
  custoAlimentacao: number;
  custoTotal: number;
  margem: number;
  margemPct: number;
  litrosVendidos: number;
  custoLitro: number;
}

interface FinanceiroData {
  serie: SerieMensal[];
  totais: Totais;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

export default function FinanceiroPage() {
  const [data, setData] = useState<FinanceiroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/financeiro?meses=6")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );

  if (!data)
    return (
      <div className="p-10 text-center text-gray-500">
        Erro ao carregar dados financeiros.
      </div>
    );

  const { serie, totais } = data;
  const margemPositiva = totais.margem >= 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <span className="leading-tight">Financeiro</span>
          </h1>
          <p className="mt-2 text-gray-500 text-sm">
            DRE simplificada — Receitas, Custos e Margem de Lucro dos últimos 6
            meses
          </p>
        </div>
        <Badge
          variant={margemPositiva ? "success" : "destructive"}
          className="whitespace-nowrap shrink-0 text-sm font-mono px-3 py-1 self-start sm:self-center"
        >
          {margemPositiva ? (
            <ArrowUpRight className="h-4 w-4 mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 mr-1" />
          )}
          Margem {totais.margemPct}%
        </Badge>
      </div>

      <Hint id="financeiro-intro" title="Controle Financeiro da Fazenda">
        Este painel cruza automaticamente a <strong>receita das vendas de leite</strong> (registradas no Tanque) com os{" "}
        <strong>custos de alimentação</strong> (registrados em Alimentação).
        Para dados mais completos, informe o <strong>custo por Kg</strong> ao registrar tratos e o{" "}
        <strong>preço por litro</strong> nas vendas de leite.
      </Hint>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-green-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Receita Total
                </p>
                <p className="mt-1 text-2xl font-bold text-green-700">
                  {formatBRL(totais.receita)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {formatNumber(totais.litrosVendidos)}L vendidos
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-red-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Custo Total</p>
                <p className="mt-1 text-2xl font-bold text-red-600">
                  {formatBRL(totais.custoTotal)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Alimentação: {formatBRL(totais.custoAlimentacao)}
            </p>
          </CardContent>
        </Card>

        <Card
          className={`shadow-sm ${margemPositiva ? "border-emerald-100" : "border-amber-100"}`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Margem Líquida
                </p>
                <p
                  className={`mt-1 text-2xl font-bold ${margemPositiva ? "text-emerald-700" : "text-red-600"}`}
                >
                  {formatBRL(totais.margem)}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${margemPositiva ? "bg-emerald-50" : "bg-red-50"}`}
              >
                <DollarSign
                  className={`h-6 w-6 ${margemPositiva ? "text-emerald-600" : "text-red-500"}`}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {totais.margemPct}% sobre receita
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Custo / Litro
                </p>
                <p className="mt-1 text-2xl font-bold text-blue-700">
                  {formatBRL(totais.custoLitro)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <Milk className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Custo médio operacional
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Receita vs Custos (6 meses)</CardTitle>
          <CardDescription>
            Evolução mensal com linha de margem sobreposta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={serie} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatBRL(Number(value)),
                    name === "receita"
                      ? "Receita"
                      : name === "custoTotal"
                        ? "Custo"
                        : "Margem",
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    fontSize: "13px",
                  }}
                />
                <Legend
                  formatter={(value: string) =>
                    value === "receita"
                      ? "Receita"
                      : value === "custoTotal"
                        ? "Custo"
                        : "Margem"
                  }
                />
                <Bar
                  dataKey="receita"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
                <Bar
                  dataKey="custoTotal"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
                <Line
                  type="monotone"
                  dataKey="margem"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#6366f1" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de breakdown */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Detalhamento Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th className="text-right">Litros</th>
                  <th className="text-right">Receita</th>
                  <th className="text-right hidden sm:table-cell">
                    Alimentação
                  </th>
                  <th className="text-right">Custo Total</th>
                  <th className="text-right">Margem</th>
                </tr>
              </thead>
              <tbody>
                {serie.map((s) => (
                  <tr key={s.mes}>
                    <td className="font-medium">{s.mes}</td>
                    <td className="text-right">
                      {formatNumber(s.litrosVendidos)}L
                    </td>
                    <td className="text-right text-green-700 font-medium">
                      {formatBRL(s.receita)}
                    </td>
                    <td className="text-right text-gray-600 hidden sm:table-cell">
                      {formatBRL(s.custoAlimentacao)}
                    </td>
                    <td className="text-right text-red-600 font-medium">
                      {formatBRL(s.custoTotal)}
                    </td>
                    <td
                      className={`text-right font-bold ${s.margem >= 0 ? "text-emerald-700" : "text-red-600"}`}
                    >
                      {formatBRL(s.margem)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                  <td>Total</td>
                  <td className="text-right">
                    {formatNumber(totais.litrosVendidos)}L
                  </td>
                  <td className="text-right text-green-700">
                    {formatBRL(totais.receita)}
                  </td>
                  <td className="text-right text-gray-600 hidden sm:table-cell">
                    {formatBRL(totais.custoAlimentacao)}
                  </td>
                  <td className="text-right text-red-600">
                    {formatBRL(totais.custoTotal)}
                  </td>
                  <td
                    className={`text-right ${margemPositiva ? "text-emerald-700" : "text-red-600"}`}
                  >
                    {formatBRL(totais.margem)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
