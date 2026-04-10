"use client";

import { useEffect, useState } from "react";
import { Plus, Heart, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hint } from "@/components/hint";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface Inseminacao {
  id: string;
  data: string;
  tipo: "NATURAL" | "ARTIFICIAL";
  responsavel: string;
  touroSemen: string | null;
  prenpiez: boolean | null;
  dataDiagnostico: string | null;
  observacoes: string | null;
  bovino: { brinco: string; nome: string | null; fazenda: { nome: string } };
}

interface Bovino { id: string; brinco: string; nome: string | null; sexo: string; }

export default function ReproducaoPage() {
  const [inseminacoes, setInseminacoes] = useState<Inseminacao[]>([]);
  const [bovinos, setBovinos] = useState<Bovino[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    tipo: "ARTIFICIAL" as "NATURAL" | "ARTIFICIAL",
    responsavel: "",
    touroSemen: "",
    observacoes: "",
    bovinoId: "",
  });

  const fetchData = async () => {
    const [insRes, bovRes] = await Promise.all([
      fetch("/api/reproducao"),
      fetch("/api/bovinos?sexo=FEMEA"),
    ]);
    setInseminacoes(await insRes.json());
    setBovinos(await bovRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/reproducao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setSaving(false);
    fetchData();
  };

  const updatePrenhez = async (id: string, prenpiez: boolean) => {
    await fetch(`/api/reproducao/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prenpiez }),
    });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reprodução</h1>
          <p className="mt-1 text-gray-500">{inseminacoes.filter((i) => i.prenpiez === null).length} pendente(s) de diagnóstico</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} id="add-inseminacao-btn">
          <Plus className="h-4 w-4" /> Nova Inseminação
        </Button>
      </div>

      <Hint id="reproducao-intro" title="Controle reprodutivo">
        Registre cada inseminação (artificial ou natural) com data, responsável e sêmen/touro.
        Após o período de espera, use os botões <strong>✓</strong> e <strong>✗</strong> para registrar o diagnóstico de prenhez.
        A taxa de prenhez é calculada automaticamente nos Relatórios.
      </Hint>

      {showForm && (
        <Card className="animate-fade-in border-emerald-200">
          <CardHeader><CardTitle>Registrar Inseminação</CardTitle><CardDescription>Dados da inseminação (RN05: deve ser registrada antes do diagnóstico)</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Vaca *</Label>
                  <select value={form.bovinoId} onChange={(e) => setForm({ ...form, bovinoId: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" required>
                    <option value="">Selecionar</option>
                    {bovinos.map((b) => <option key={b.id} value={b.id}>{b.brinco} — {b.nome || ""}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><Label>Data *</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required /></div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as "NATURAL" | "ARTIFICIAL" })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                    <option value="ARTIFICIAL">Inseminação Artificial</option>
                    <option value="NATURAL">Monta Natural</option>
                  </select>
                </div>
                <div className="space-y-2"><Label>Responsável *</Label><Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome do técnico" required /></div>
                <div className="space-y-2"><Label>Touro / Sêmen</Label><Input value={form.touroSemen} onChange={(e) => setForm({ ...form, touroSemen: e.target.value })} placeholder="Identificação" /></div>
                <div className="space-y-2"><Label>Observações</Label><Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
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
          <thead><tr><th>Data</th><th>Vaca</th><th>Tipo</th><th>Responsável</th><th>Touro/Sêmen</th><th>Prenhez</th><th>Ações</th></tr></thead>
          <tbody>
            {inseminacoes.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhuma inseminação registrada</td></tr>
            ) : inseminacoes.map((ins) => (
              <tr key={ins.id}>
                <td>{formatDate(ins.data)}</td>
                <td className="font-medium">{ins.bovino.brinco} — {ins.bovino.nome || ""}</td>
                <td><Badge variant={ins.tipo === "ARTIFICIAL" ? "default" : "secondary"}>{ins.tipo === "ARTIFICIAL" ? "IA" : "Natural"}</Badge></td>
                <td>{ins.responsavel}</td>
                <td>{ins.touroSemen || "—"}</td>
                <td>
                  {ins.prenpiez === null ? (
                    <Badge variant="warning">Pendente</Badge>
                  ) : ins.prenpiez ? (
                    <Badge variant="success">✓ Prenhe</Badge>
                  ) : (
                    <Badge variant="destructive">✗ Vazia</Badge>
                  )}
                </td>
                <td>
                  {ins.prenpiez === null && (
                    <div className="flex gap-1">
                      <button onClick={() => updatePrenhez(ins.id, true)} className="rounded-md p-1.5 text-green-500 hover:bg-green-50" title="Confirmar prenhez"><Check className="h-4 w-4" /></button>
                      <button onClick={() => updatePrenhez(ins.id, false)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50" title="Marcar como vazia"><X className="h-4 w-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
