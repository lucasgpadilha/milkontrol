"use client";

import { useEffect, useState } from "react";
import { Loader2, FlaskRound, AlertCircle, CheckCircle2, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hint } from "@/components/hint";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useFazendaAtiva } from "@/components/fazenda-context";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Analise {
  id: string;
  data: string;
  ccs: number;
  cpp: number;
  gordura: number | null;
  proteina: number | null;
  esnf: number | null;
  laboratorio: string | null;
}

const CCS_LIMITE = 500;
const CCS_ALERTA = 400;
const CPP_LIMITE = 300;
const CPP_ALERTA = 250;

export default function QualidadeLeitePage() {
  const { fazendaAtiva, todasSelecionadas } = useFazendaAtiva();
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    ccs: "",
    cpp: "",
    gordura: "",
    proteina: "",
    esnf: "",
    laboratorio: "",
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/analise-leite");
      if (res.ok) {
        setAnalises(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/analise-leite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        setForm({
          data: new Date().toISOString().split("T")[0],
          ccs: "", cpp: "", gordura: "", proteina: "", esnf: "", laboratorio: ""
        });
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao salvar análise");
      }
    } finally {
      setSaving(false);
    }
  };

  // Calcular média geométrica dos últimos 3 meses (exigência IN 76/77)
  const calcMediaGeometrica = (dados: number[]) => {
    if (dados.length === 0) return 0;
    const produto = dados.reduce((acc, val) => acc * val, 1);
    return Math.round(Math.pow(produto, 1 / dados.length));
  };

  const ultimos3Meses = analises.slice(0, 3);
  const mediaCcs = calcMediaGeometrica(ultimos3Meses.map(a => a.ccs));
  const mediaCpp = calcMediaGeometrica(ultimos3Meses.map(a => a.cpp));

  const analiseRecente = analises[0];

  const getStatusCor = (valor: number, limite: number, alerta: number) => {
    if (valor > limite) return "text-red-600 bg-red-50";
    if (valor > alerta) return "text-amber-600 bg-amber-50";
    return "text-emerald-600 bg-emerald-50";
  };

  // Prepara dados para o gráfico em ordem cronológica
  const chartData = [...analises].reverse().map(a => ({
    ...a,
    mesAno: new Date(a.data).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
  }));

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
              <FlaskRound className="h-5 w-5 text-white" />
            </div>
            Qualidade do Leite
          </h1>
          <p className="mt-1 text-gray-500">Monitoramento oficial de CCS e CPP (IN 76/77)</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} disabled={todasSelecionadas}>
          Nova Análise Laboratorial
        </Button>
      </div>

      {todasSelecionadas && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Selecione uma fazenda específica para registrar análises.
        </div>
      )}

      {showForm && !todasSelecionadas && (
        <Card className="border-indigo-100 shadow-sm">
          <CardHeader className="bg-indigo-50/50 pb-4">
            <CardTitle className="text-lg text-indigo-900">Registrar Resultado de Laboratório</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data da Análise *</Label>
                  <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>CCS (x1.000 cél/mL) *</Label>
                  <Input type="number" placeholder="Ex: 350" value={form.ccs} onChange={e => setForm({ ...form, ccs: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>CPP/CBT (x1.000 UFC/mL) *</Label>
                  <Input type="number" placeholder="Ex: 150" value={form.cpp} onChange={e => setForm({ ...form, cpp: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Gordura (%)</Label>
                  <Input type="number" step="0.01" placeholder="Ex: 3.8" value={form.gordura} onChange={e => setForm({ ...form, gordura: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Proteína (%)</Label>
                  <Input type="number" step="0.01" placeholder="Ex: 3.2" value={form.proteina} onChange={e => setForm({ ...form, proteina: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Laboratório (RBQL)</Label>
                  <Input placeholder="Nome do laboratório" value={form.laboratorio} onChange={e => setForm({ ...form, laboratorio: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Resultado"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {analises.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm font-medium text-gray-500">Última CCS</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className={`text-2xl font-bold px-2 py-1 rounded-md ${getStatusCor(analiseRecente.ccs, CCS_LIMITE, CCS_ALERTA)}`}>
                    {analiseRecente.ccs}k
                  </p>
                </div>
                <p className="mt-2 text-xs text-gray-400">Limite legal: {CCS_LIMITE}k</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-5">
                <p className="text-sm font-medium text-gray-500">Última CPP</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className={`text-2xl font-bold px-2 py-1 rounded-md ${getStatusCor(analiseRecente.cpp, CPP_LIMITE, CPP_ALERTA)}`}>
                    {analiseRecente.cpp}k
                  </p>
                </div>
                <p className="mt-2 text-xs text-gray-400">Limite legal: {CPP_LIMITE}k</p>
              </CardContent>
            </Card>

            <Card className="border-indigo-100 bg-indigo-50/30">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-indigo-800">Média Geom. CCS (3m)</p>
                <p className={`mt-1 text-2xl font-bold ${mediaCcs > CCS_LIMITE ? "text-red-600" : "text-indigo-700"}`}>
                  {mediaCcs}k
                </p>
                <p className="mt-2 text-xs text-indigo-500/80">Cálculo oficial MAPA</p>
              </CardContent>
            </Card>

            <Card className="border-indigo-100 bg-indigo-50/30">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-indigo-800">Média Geom. CPP (3m)</p>
                <p className={`mt-1 text-2xl font-bold ${mediaCpp > CPP_LIMITE ? "text-red-600" : "text-indigo-700"}`}>
                  {mediaCpp}k
                </p>
                <p className="mt-2 text-xs text-indigo-500/80">Cálculo oficial MAPA</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Qualidade</CardTitle>
              <CardDescription>Evolução da CCS e CPP nos últimos 12 meses (linha vermelha = limite legal)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mesAno" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      formatter={(val: any) => [`${val}k`, undefined]} 
                    />
                    <Legend />
                    <ReferenceLine y={500} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Limite CCS', fill: '#ef4444', fontSize: 11 }} />
                    <ReferenceLine y={300} stroke="#f97316" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Limite CPP', fill: '#f97316', fontSize: 11 }} />
                    <Line type="monotone" name="CCS (Mastite)" dataKey="ccs" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" name="CPP (Higiene)" dataKey="cpp" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimas Análises Laboratoriais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Laboratório</th>
                      <th className="text-right">CCS</th>
                      <th className="text-right">CPP</th>
                      <th className="text-right">Gordura</th>
                      <th className="text-right">Proteína</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analises.map(a => (
                      <tr key={a.id}>
                        <td>{formatDate(a.data)}</td>
                        <td className="text-gray-500">{a.laboratorio || "—"}</td>
                        <td className="text-right font-medium">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusCor(a.ccs, CCS_LIMITE, CCS_ALERTA)}`}>
                            {a.ccs}k
                          </span>
                        </td>
                        <td className="text-right font-medium">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusCor(a.cpp, CPP_LIMITE, CPP_ALERTA)}`}>
                            {a.cpp}k
                          </span>
                        </td>
                        <td className="text-right text-gray-600">{a.gordura ? `${a.gordura}%` : "—"}</td>
                        <td className="text-right text-gray-600">{a.proteina ? `${a.proteina}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500 bg-white">
          <FlaskRound className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhuma análise registrada</h3>
          <p className="mt-1">Registre os resultados mensais do laboratório (RBQL) para acompanhar a qualidade do seu leite.</p>
        </div>
      )}
    </div>
  );
}
