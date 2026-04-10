"use client";

import { useEffect, useState } from "react";
import { Plus, Syringe, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hint } from "@/components/hint";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate, estaEmCarencia } from "@/lib/utils";

interface RegistroSanitario {
  id: string;
  data: string;
  tipo: string;
  produto: string;
  dose: string | null;
  responsavel: string | null;
  diasCarencia: number;
  fimCarencia: string | null;
  observacoes: string | null;
  bovino: { brinco: string; nome: string | null };
}

interface Bovino { id: string; brinco: string; nome: string | null; }

const tipoLabels: Record<string, string> = {
  VACINA: "Vacina",
  VERMIFUGO: "Vermífugo",
  MEDICAMENTO: "Medicamento",
  TRATAMENTO: "Tratamento",
};

export default function SanitarioPage() {
  const [registros, setRegistros] = useState<RegistroSanitario[]>([]);
  const [bovinos, setBovinos] = useState<Bovino[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filtroCarencia, setFiltroCarencia] = useState(false);
  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    tipo: "VACINA",
    produto: "",
    dose: "",
    responsavel: "",
    diasCarencia: "0",
    observacoes: "",
    bovinoId: "",
  });

  const fetchData = async () => {
    const params = filtroCarencia ? "?emCarencia=true" : "";
    const [regRes, bovRes] = await Promise.all([
      fetch(`/api/sanitario${params}`),
      fetch("/api/bovinos"),
    ]);
    setRegistros(await regRes.json());
    setBovinos(await bovRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filtroCarencia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/sanitario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, diasCarencia: parseInt(form.diasCarencia) }),
    });
    setShowForm(false);
    setSaving(false);
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  const emCarencia = registros.filter((r) => estaEmCarencia(r.fimCarencia));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle Sanitário</h1>
          <p className="mt-1 text-gray-500">
            {emCarencia.length > 0 && (
              <span className="text-amber-600 font-medium">
                <AlertTriangle className="inline h-4 w-4 mr-1" />{emCarencia.length} animal(is) em carência
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={filtroCarencia ? "default" : "outline"} size="sm" onClick={() => setFiltroCarencia(!filtroCarencia)}>
            <AlertTriangle className="h-4 w-4" /> Em Carência
          </Button>
          <Button onClick={() => setShowForm(!showForm)} id="add-sanitario-btn">
            <Plus className="h-4 w-4" /> Novo Registro
          </Button>
        </div>
      </div>

      <Hint id="sanitario-intro" title="Controle sanitário e carência">
        Registre vacinas, vermífugos e medicamentos aplicados. Informe os <strong>dias de carência</strong> quando aplicável.
        Durante o período de carência, o sistema <strong>bloqueia automaticamente</strong> o registro de produção de leite daquele animal,
        garantindo que leite contaminado não entre no tanque.
      </Hint>

      {showForm && (
        <Card className="animate-fade-in border-emerald-200">
          <CardHeader><CardTitle>Registro Sanitário</CardTitle><CardDescription>Vacinas, vermífugos, medicamentos e tratamentos</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Animal *</Label>
                  <select value={form.bovinoId} onChange={(e) => setForm({ ...form, bovinoId: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" required>
                    <option value="">Selecionar</option>
                    {bovinos.map((b) => <option key={b.id} value={b.id}>{b.brinco} — {b.nome || ""}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><Label>Data *</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required /></div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                    <option value="VACINA">Vacina</option>
                    <option value="VERMIFUGO">Vermífugo</option>
                    <option value="MEDICAMENTO">Medicamento</option>
                    <option value="TRATAMENTO">Tratamento</option>
                  </select>
                </div>
                <div className="space-y-2"><Label>Produto *</Label><Input value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })} placeholder="Nome do medicamento/vacina" required /></div>
                <div className="space-y-2"><Label>Dose</Label><Input value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="Ex: 5ml" /></div>
                <div className="space-y-2"><Label>Dias de Carência</Label><Input type="number" min="0" value={form.diasCarencia} onChange={(e) => setForm({ ...form, diasCarencia: e.target.value })} /></div>
                <div className="space-y-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} /></div>
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
          <thead><tr><th>Data</th><th>Animal</th><th>Tipo</th><th>Produto</th><th>Dose</th><th>Carência</th><th>Responsável</th></tr></thead>
          <tbody>
            {registros.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhum registro sanitário</td></tr>
            ) : registros.map((r) => (
              <tr key={r.id}>
                <td>{formatDate(r.data)}</td>
                <td className="font-medium">{r.bovino.brinco} — {r.bovino.nome || ""}</td>
                <td><Badge variant="secondary">{tipoLabels[r.tipo] || r.tipo}</Badge></td>
                <td>{r.produto}</td>
                <td>{r.dose || "—"}</td>
                <td>
                  {r.diasCarencia > 0 ? (
                    estaEmCarencia(r.fimCarencia) ? (
                      <Badge variant="warning"><AlertTriangle className="h-3 w-3 mr-1" />Até {formatDate(r.fimCarencia!)}</Badge>
                    ) : (
                      <span className="text-gray-400">{r.diasCarencia}d (encerrada)</span>
                    )
                  ) : "—"}
                </td>
                <td>{r.responsavel || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
