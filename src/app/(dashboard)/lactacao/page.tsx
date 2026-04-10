"use client";

import { useEffect, useState } from "react";
import { Plus, FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hint } from "@/components/hint";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate, calcularDEL } from "@/lib/utils";

interface Lactacao {
  id: string;
  inicio: string;
  fim: string | null;
  bovino: { brinco: string; nome: string | null; raca: string; fazenda: { nome: string } };
}

interface Bovino { id: string; brinco: string; nome: string | null; sexo: string; }

export default function LactacaoPage() {
  const [lactacoes, setLactacoes] = useState<Lactacao[]>([]);
  const [bovinos, setBovinos] = useState<Bovino[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filtroAtivas, setFiltroAtivas] = useState(true);
  const [form, setForm] = useState({ inicio: new Date().toISOString().split("T")[0], fim: "", bovinoId: "" });

  const fetchData = async () => {
    const params = filtroAtivas ? "?ativas=true" : "";
    const [lactRes, bovRes] = await Promise.all([
      fetch(`/api/lactacao${params}`),
      fetch("/api/bovinos?sexo=FEMEA"),
    ]);
    setLactacoes(await lactRes.json());
    setBovinos(await bovRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filtroAtivas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/lactacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ inicio: new Date().toISOString().split("T")[0], fim: "", bovinoId: "" });
    setShowForm(false);
    setSaving(false);
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lactação</h1>
          <p className="mt-1 text-gray-500">{lactacoes.length} registro(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filtroAtivas ? "default" : "outline"} size="sm" onClick={() => setFiltroAtivas(true)}>Ativas</Button>
          <Button variant={!filtroAtivas ? "default" : "outline"} size="sm" onClick={() => setFiltroAtivas(false)}>Todas</Button>
          <Button onClick={() => setShowForm(!showForm)} id="add-lactacao-btn">

            <Plus className="h-4 w-4" /> Iniciar Lactação
          </Button>
        </div>
      </div>

      <Hint id="lactacao-intro" title="Controle de lactação">
        Inicie uma lactação quando a vaca parir. O sistema calcula automaticamente os <strong>DEL (Dias em Lactação)</strong>.
        Ao iniciar uma nova lactação, a anterior é encerrada automaticamente. Vacas sem lactação ativa são consideradas &quot;secas&quot;.
      </Hint>

      {showForm && (
        <Card className="animate-fade-in border-emerald-200">
          <CardHeader><CardTitle>Iniciar Lactação</CardTitle><CardDescription>Registre o início da lactação de uma vaca</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Vaca *</Label>
                  <select value={form.bovinoId} onChange={(e) => setForm({ ...form, bovinoId: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" required>
                    <option value="">Selecionar</option>
                    {bovinos.map((b) => <option key={b.id} value={b.id}>{b.brinco} — {b.nome || b.id.slice(0, 6)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Data Início *</Label>
                  <Input type="date" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim (opcional)</Label>
                  <Input type="date" value={form.fim} onChange={(e) => setForm({ ...form, fim: e.target.value })} />
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
          <thead><tr><th>Vaca</th><th>Raça</th><th>Início</th><th>Fim</th><th>DEL</th><th>Status</th><th>Fazenda</th></tr></thead>
          <tbody>
            {lactacoes.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhuma lactação registrada</td></tr>
            ) : lactacoes.map((l) => (
              <tr key={l.id}>
                <td className="font-medium">{l.bovino.brinco} — {l.bovino.nome || ""}</td>
                <td>{l.bovino.raca}</td>
                <td>{formatDate(l.inicio)}</td>
                <td>{l.fim ? formatDate(l.fim) : "—"}</td>
                <td className="font-semibold text-emerald-600">{!l.fim ? `${calcularDEL(l.inicio)} dias` : "—"}</td>
                <td><Badge variant={!l.fim ? "success" : "secondary"}>{!l.fim ? "Em Lactação" : "Encerrada"}</Badge></td>
                <td className="text-gray-500">{l.bovino.fazenda.nome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
