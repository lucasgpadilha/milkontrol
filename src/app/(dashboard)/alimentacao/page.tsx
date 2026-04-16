"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, Wheat, Fence } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hint } from "@/components/hint";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface Piquete {
  id: string;
  nome: string;
}

const tipoAlimentoLabels: Record<string, string> = {
  SILAGEM: "Silagem",
  RACAO: "Ração",
  FENO: "Feno",
  SAL_MINERAL: "Sal Mineral",
  CONCENTRADO: "Concentrado",
  PASTO: "Pasto",
  OUTRO: "Outro",
};

const tipoAlimentoColors: Record<string, string> = {
  SILAGEM: "bg-green-100 text-green-800",
  RACAO: "bg-amber-100 text-amber-800",
  FENO: "bg-yellow-100 text-yellow-800",
  SAL_MINERAL: "bg-blue-100 text-blue-800",
  CONCENTRADO: "bg-purple-100 text-purple-800",
  PASTO: "bg-emerald-100 text-emerald-800",
  OUTRO: "bg-gray-100 text-gray-800",
};

interface RegistroAlimentacao {
  id: string;
  data: string;
  tipoAlimento: string;
  descricao: string | null;
  quantidadeKg: number;
  custoUnitario: number | null;
  observacoes: string | null;
  piquete: { nome: string; _count: { bovinos: number } };
}

export default function AlimentacaoPage() {
  const [registros, setRegistros] = useState<RegistroAlimentacao[]>([]);
  const [piquetes, setPiquetes] = useState<Piquete[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    tipoAlimento: "SILAGEM",
    descricao: "",
    quantidadeKg: "",
    custoUnitario: "",
    piqueteId: "",
    observacoes: "",
  });

  const fetchData = async () => {
    const [regRes, piqRes] = await Promise.all([
      fetch("/api/alimentacao"),
      fetch("/api/piquetes"),
    ]);
    setRegistros(await regRes.json());
    setPiquetes(await piqRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/alimentacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantidadeKg: Number(form.quantidadeKg),
          custoUnitario: form.custoUnitario ? Number(form.custoUnitario) : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShowForm(false);
      setForm({
        data: new Date().toISOString().split("T")[0],
        tipoAlimento: "SILAGEM",
        descricao: "",
        quantidadeKg: "",
        custoUnitario: "",
        piqueteId: "",
        observacoes: "",
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este registro de alimentação?")) return;
    await fetch(`/api/alimentacao/${id}`, { method: "DELETE" });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  // Resumo por piquete (últimos 7 dias)
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  const registrosRecentes = registros.filter(r => new Date(r.data) >= seteDiasAtras);
  const resumoPorPiquete: Record<string, { piquete: string; cabecas: number; totalKg: number; tipos: Set<string> }> = {};
  registrosRecentes.forEach(r => {
    if (!resumoPorPiquete[r.piquete.nome]) {
      resumoPorPiquete[r.piquete.nome] = { piquete: r.piquete.nome, cabecas: r.piquete._count.bovinos, totalKg: 0, tipos: new Set() };
    }
    resumoPorPiquete[r.piquete.nome].totalKg += r.quantidadeKg * r.piquete._count.bovinos;
    resumoPorPiquete[r.piquete.nome].tipos.add(r.tipoAlimento);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alimentação</h1>
          <p className="mt-1 text-gray-500">{registros.length} registro(s) de fornecimento</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} id="add-alimentacao-btn">
          <Plus className="h-4 w-4" /> Novo Fornecimento
        </Button>
      </div>

      <Hint id="alimentacao-intro" title="Registro de Trato Diário">
        Registre aqui o tipo de alimento fornecido por piquete/lote, com a quantidade em <strong>Kg por cabeça por dia</strong>.
        O sistema calcula automaticamente o consumo total baseado no número de vacas no lote.
        Opcionalmente, informe o custo por Kg para análises futuras de margem.
      </Hint>

      {/* Resumo visual por piquete (últimos 7 dias) */}
      {Object.values(resumoPorPiquete).length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(resumoPorPiquete).map(r => (
            <Card key={r.piquete} className="shadow-sm border-green-100 hover:shadow-md transition-shadow">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-green-600 flex items-center gap-1.5">
                  <Fence className="h-3.5 w-3.5" /> {r.piquete}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-gray-900">{r.totalKg.toFixed(0)} <span className="text-base font-normal text-gray-500">Kg (7d)</span></div>
                <p className="text-xs text-gray-500 mt-1">{r.cabecas} cabeça(s) • {Array.from(r.tipos).map(t => tipoAlimentoLabels[t]).join(", ")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Card className="animate-fade-in border-green-200">
          <CardHeader>
            <CardTitle>Registrar Fornecimento</CardTitle>
            <CardDescription>Informe o piquete, tipo de alimento e a quantidade por cabeça/dia</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Piquete / Lote *</Label>
                  <select
                    value={form.piqueteId}
                    onChange={(e) => setForm({ ...form, piqueteId: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  >
                    <option value="">Selecionar piquete...</option>
                    {piquetes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Alimento *</Label>
                  <select
                    value={form.tipoAlimento}
                    onChange={(e) => setForm({ ...form, tipoAlimento: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {Object.entries(tipoAlimentoLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Quantidade (Kg/cabeça/dia) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.quantidadeKg}
                    onChange={(e) => setForm({ ...form, quantidadeKg: e.target.value })}
                    placeholder="Ex: 15.5"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custo Unitário (R$/Kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.custoUnitario}
                    onChange={(e) => setForm({ ...form, custoUnitario: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Silagem de milho safra 2026" />
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                  <Label>Observações</Label>
                  <Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Anotações adicionais" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Piquete</th>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Kg/Cab/Dia</th>
              <th>Cabeças</th>
              <th>Total Estimado</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Nenhum registro de alimentação</td></tr>
            ) : registros.map(reg => (
              <tr key={reg.id} className="animate-fade-in">
                <td>{formatDate(reg.data)}</td>
                <td className="font-medium flex items-center gap-1.5">
                  <Fence className="h-3.5 w-3.5 text-emerald-500" />
                  {reg.piquete.nome}
                </td>
                <td>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tipoAlimentoColors[reg.tipoAlimento] || "bg-gray-100 text-gray-800"}`}>
                    {tipoAlimentoLabels[reg.tipoAlimento] || reg.tipoAlimento}
                  </span>
                </td>
                <td className="text-gray-600 text-sm">{reg.descricao || "—"}</td>
                <td className="font-medium">{reg.quantidadeKg} Kg</td>
                <td>{reg.piquete._count.bovinos}</td>
                <td className="font-semibold text-green-700">
                  {(reg.quantidadeKg * reg.piquete._count.bovinos).toFixed(1)} Kg
                </td>
                <td className="text-right">
                  <button
                    onClick={() => handleDelete(reg.id)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
