"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Plus, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Hint } from "@/components/hint";
import { formatDate } from "@/lib/utils";
import { useFazendaAtiva } from "@/components/fazenda-context";

interface Mastite {
  id: string;
  data: string;
  tipo: "CLINICA" | "SUBCLINICA";
  quarto: "AD" | "AE" | "PD" | "PE";
  resultado: string | null;
  tratamento: string | null;
  diasTratamento: number | null;
  cura: boolean;
  dataCura: string | null;
  bovino: { brinco: string; nome: string | null };
  veterinario: { nome: string } | null;
}

interface Bovino {
  id: string;
  brinco: string;
  nome: string | null;
}

const quartos = {
  AD: "Anterior Direito",
  AE: "Anterior Esquerdo",
  PD: "Posterior Direito",
  PE: "Posterior Esquerdo",
};

export default function MastitePage() {
  const { fazendaAtiva, todasSelecionadas } = useFazendaAtiva();
  const [mastites, setMastites] = useState<Mastite[]>([]);
  const [bovinos, setBovinos] = useState<Bovino[]>([]);
  const [veterinarios, setVeterinarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"ATIVAS" | "TODAS">("ATIVAS");

  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    tipo: "CLINICA",
    quarto: "AD",
    resultado: "",
    tratamento: "",
    diasTratamento: "",
    observacoes: "",
    bovinoId: "",
    veterinarioId: "",
  });

  const fetchData = async () => {
    try {
      const [mastRes, bovRes, vetRes] = await Promise.all([
        fetch("/api/mastite"),
        fetch("/api/bovinos?sexo=FEMEA"),
        fetch("/api/veterinarios"),
      ]);
      if (mastRes.ok) setMastites(await mastRes.json());
      if (bovRes.ok) setBovinos(await bovRes.json());
      if (vetRes.ok) setVeterinarios(await vetRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fazendaAtiva]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/mastite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        setForm({ ...form, resultado: "", tratamento: "", diasTratamento: "", observacoes: "", bovinoId: "" });
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao registrar mastite");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCura = async (id: string) => {
    if (!confirm("Confirmar cura deste quarto mamário?")) return;
    
    try {
      const res = await fetch(`/api/mastite/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cura: true, dataCura: new Date().toISOString() }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert("Erro ao confirmar cura");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este registro permanentemente?")) return;
    try {
      const res = await fetch(`/api/mastite/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      alert("Erro ao excluir");
    }
  };

  const mastitesExibidas = mastites.filter(m => tab === "TODAS" || !m.cura);
  const totalAtivas = mastites.filter(m => !m.cura).length;

  // Encontrar vacas crônicas (mais de 2 casos)
  const contagemPorVaca = mastites.reduce((acc, m) => {
    acc[m.bovino.brinco] = (acc[m.bovino.brinco] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const vacasCronicas = Object.entries(contagemPorVaca).filter(([_, count]) => count >= 2).length;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 shadow-sm">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            Controle de Mastite
          </h1>
          <p className="mt-1 text-gray-500">Acompanhamento clínico e subclínico por quarto mamário</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} disabled={todasSelecionadas}>
          <Plus className="h-4 w-4 mr-2" /> Novo Registro
        </Button>
      </div>

      <Hint id="mastite-intro" title="Controle Leiteiro">
        A mastite deve ser controlada <strong>por quarto mamário</strong>. O leite de quartos em tratamento clínico
        jamais deve ir para o tanque. Vacas com mais de 2 episódios são candidatas ao descarte.
      </Hint>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-red-100 bg-red-50/50">
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-red-800">Casos Ativos (Em Tratamento)</p>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <p className="mt-1 text-2xl font-bold text-red-700">{totalAtivas}</p>
            <p className="mt-2 text-xs text-red-600">Requerem bloqueio de ordenha</p>
          </CardContent>
        </Card>
        
        <Card className="border-amber-100 bg-amber-50/50">
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-amber-800">Vacas Crônicas</p>
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-700">{vacasCronicas}</p>
            <p className="mt-2 text-xs text-amber-600">≥ 2 casos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-500">Histórico Total</p>
              <CheckCircle2 className="h-5 w-5 text-gray-400" />
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-700">{mastites.length}</p>
            <p className="mt-2 text-xs text-gray-400">Casos registrados nesta fazenda</p>
          </CardContent>
        </Card>
      </div>

      {showForm && !todasSelecionadas && (
        <Card className="border-red-100 shadow-sm">
          <CardHeader className="bg-red-50/50 pb-4">
            <CardTitle className="text-lg text-red-900">Registrar Mastite</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Vaca *</Label>
                  <select
                    value={form.bovinoId}
                    onChange={(e) => setForm({ ...form, bovinoId: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    required
                  >
                    <option value="">Selecione...</option>
                    {bovinos.map(b => (
                      <option key={b.id} value={b.id}>{b.brinco} {b.nome ? `- ${b.nome}` : ""}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="CLINICA">Clínica (Sintomas visíveis)</option>
                    <option value="SUBCLINICA">Subclínica (Apenas CMT/CCS alta)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Quarto Afetado *</Label>
                  <select
                    value={form.quarto}
                    onChange={(e) => setForm({ ...form, quarto: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold"
                  >
                    <option value="AD">Anterior Direito (AD)</option>
                    <option value="AE">Anterior Esquerdo (AE)</option>
                    <option value="PD">Posterior Direito (PD)</option>
                    <option value="PE">Posterior Esquerdo (PE)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tratamento Utilizado</Label>
                  <Input placeholder="Nome do medicamento" value={form.tratamento} onChange={e => setForm({ ...form, tratamento: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Dias de Tratamento</Label>
                  <Input type="number" placeholder="Duração em dias" value={form.diasTratamento} onChange={e => setForm({ ...form, diasTratamento: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Veterinário Responsável</Label>
                  <select
                    value={form.veterinarioId}
                    onChange={(e) => setForm({ ...form, veterinarioId: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Nenhum / Próprio</option>
                    {veterinarios.map(v => (
                      <option key={v.id} value={v.id}>{v.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Registros de Mastite</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant={tab === "ATIVAS" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setTab("ATIVAS")}
                className={tab === "ATIVAS" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
              >
                Casos Ativos
              </Button>
              <Button variant={tab === "TODAS" ? "default" : "outline"} size="sm" onClick={() => setTab("TODAS")}>
                Todos os Registros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Animal</th>
                  <th>Tipo</th>
                  <th>Quarto</th>
                  <th>Tratamento</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {mastitesExibidas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">Nenhum registro encontrado.</td>
                  </tr>
                ) : mastitesExibidas.map(m => (
                  <tr key={m.id} className={!m.cura ? "bg-red-50/20" : ""}>
                    <td>{formatDate(m.data)}</td>
                    <td className="font-semibold text-gray-900">{m.bovino.brinco} {m.bovino.nome ? `(${m.bovino.nome})` : ""}</td>
                    <td>
                      <Badge variant={m.tipo === "CLINICA" ? "destructive" : "secondary"}>
                        {m.tipo === "CLINICA" ? "Clínica" : "Subclínica"}
                      </Badge>
                    </td>
                    <td><span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">{m.quarto}</span></td>
                    <td className="text-gray-600">{m.tratamento || "—"}</td>
                    <td>
                      {m.cura ? (
                        <span className="text-emerald-600 font-medium text-sm flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Curada
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium text-sm flex items-center gap-1 animate-pulse">
                          <AlertCircle className="h-4 w-4" /> Em Tratamento
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      {!m.cura && (
                        <Button variant="outline" size="sm" className="mr-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => handleCura(m.id)}>
                          Confirmar Cura
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(m.id)}>
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
