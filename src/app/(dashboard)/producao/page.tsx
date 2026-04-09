"use client";

import { useEffect, useState } from "react";
import { Plus, Milk, Loader2, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/utils";

interface Producao {
  id: string;
  data: string;
  quantidade: number;
  turno: string | null;
  bovino: { brinco: string; nome: string | null };
}

interface Bovino {
  id: string;
  brinco: string;
  nome: string | null;
  sexo: string;
  lactacoes: { fim: string | null }[];
}

export default function ProducaoPage() {
  const [producoes, setProducoes] = useState<Producao[]>([]);
  const [bovinos, setBovinos] = useState<Bovino[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    quantidade: "",
    turno: "MANHA",
    bovinoId: "",
  });

  const fetchData = async () => {
    const [prodRes, bovRes] = await Promise.all([
      fetch("/api/producao"),
      fetch("/api/bovinos?sexo=FEMEA"),
    ]);
    setProducoes(await prodRes.json());
    const allBovinos = await bovRes.json();
    setBovinos(allBovinos.filter((b: Bovino) => b.lactacoes?.length > 0 && !b.lactacoes[0]?.fim));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/producao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quantidade: parseFloat(form.quantidade),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setSaving(false);
      return;
    }

    setForm({ ...form, quantidade: "" });
    setSaving(false);
    fetchData();
  };

  const totalHoje = producoes
    .filter((p) => p.data.startsWith(new Date().toISOString().split("T")[0]))
    .reduce((acc, p) => acc + p.quantidade, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produção de Leite</h1>
          <p className="mt-1 text-gray-500">
            Hoje: <span className="font-semibold text-emerald-600">{formatNumber(totalHoje)}L</span>
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} id="add-producao-btn">
          <Plus className="h-4 w-4" />
          Novo Lançamento
        </Button>
      </div>

      {showForm && (
        <Card className="animate-fade-in border-emerald-200">
          <CardHeader>
            <CardTitle>Registrar Produção</CardTitle>
            <CardDescription>Lançamento diário de leite por vaca</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Vaca *</Label>
                  <select
                    value={form.bovinoId}
                    onChange={(e) => setForm({ ...form, bovinoId: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  >
                    <option value="">Selecionar vaca</option>
                    {bovinos.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.brinco} — {b.nome || "Sem nome"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-data">Data *</Label>
                  <Input
                    id="prod-data"
                    type="date"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-qtd">Quantidade (L) *</Label>
                  <Input
                    id="prod-qtd"
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.quantidade}
                    onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                    placeholder="0.0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Turno</Label>
                  <select
                    value={form.turno}
                    onChange={(e) => setForm({ ...form, turno: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="MANHA">Manhã</option>
                    <option value="TARDE">Tarde</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Vaca</th>
                <th>Quantidade (L)</th>
                <th>Turno</th>
              </tr>
            </thead>
            <tbody>
              {producoes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    Nenhum lançamento registrado
                  </td>
                </tr>
              ) : (
                producoes.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.data)}</td>
                    <td className="font-medium">
                      {p.bovino.brinco} — {p.bovino.nome || "Sem nome"}
                    </td>
                    <td>
                      <span className="font-semibold text-emerald-600">
                        {formatNumber(p.quantidade)}L
                      </span>
                    </td>
                    <td>{p.turno === "MANHA" ? "Manhã" : p.turno === "TARDE" ? "Tarde" : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
