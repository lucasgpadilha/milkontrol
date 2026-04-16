"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Search, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hint } from "@/components/hint";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { fetchWithOfflineFallback } from "@/lib/offline-queue";

interface Bovino {
  id: string;
  brinco: string;
  nome: string | null;
  sexo: string;
}

export default function LoteSanitarioPage() {
  const router = useRouter();
  const [bovinos, setBovinos] = useState<Bovino[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    tipo: "VACINA",
    produto: "",
    dose: "",
    diasCarencia: "0",
    observacoes: "",
  });

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/bovinos")
      .then(res => res.json())
      .then(data => {
        setBovinos(data);
        setLoading(false);
      });
  }, []);

  const toggleBovino = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const filteredBovinos = bovinos.filter(b => {
    if (!search) return true;
    const s = search.toLowerCase();
    return b.brinco.toLowerCase().includes(s) || (b.nome || "").toLowerCase().includes(s);
  });

  const toggleAll = () => {
    if (selected.size === filteredBovinos.length && filteredBovinos.length > 0) {
      const next = new Set(selected);
      filteredBovinos.forEach(b => next.delete(b.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filteredBovinos.forEach(b => next.add(b.id));
      setSelected(next);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccessMsg("");
    
    if (selected.size === 0) {
      setError("Selecione pelo menos um animal.");
      return;
    }

    if (!form.produto) {
      setError("O campo produto é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetchWithOfflineFallback("/api/sanitario/lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          diasCarencia: parseInt(form.diasCarencia) || 0,
          bovinos: Array.from(selected)
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro offline detectado");

      setSuccessMsg(`${data.count} registro(s) criado(s) com sucesso!`);
      setSelected(new Set());
      setForm(f => ({ ...f, produto: "", dose: "", observacoes: "", diasCarencia: "0" }));
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err.message || "Erro no lançamento.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lote Sanitário</h1>
        <Button variant="outline" onClick={() => router.push("/sanitario")}>Voltar</Button>
      </div>

      <Hint id="sanitario-lote-intro" title="Tratamento e Vacinação em Massa">
        Preencha os dados do tratamento e marque todos os animais que receberam. 
        Útil para ciclos de vacinação como Aftosa ou controle coletivo.
      </Hint>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Registro</CardTitle>
            </CardHeader>
            <CardContent>
              <form id="lote-form" onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
                {successMsg && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 font-medium">{successMsg}</div>}

                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
                </div>

                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" required>
                    <option value="VACINA">Vacina</option>
                    <option value="VERMIFUGO">Vermífugo</option>
                    <option value="MEDICAMENTO">Medicamento</option>
                    <option value="TRATAMENTO">Tratamento</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Produto *</Label>
                  <Input value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })} placeholder="Ex: Vacina Aftosa" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dose</Label>
                    <Input value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="Ex: 5ml" />
                  </div>
                  <div className="space-y-2">
                    <Label>Carência (Dias)</Label>
                    <Input type="number" min="0" value={form.diasCarencia} onChange={(e) => setForm({ ...form, diasCarencia: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Opcional" />
                </div>

                <Button type="submit" disabled={saving || selected.size === 0} className="w-full gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar para {selected.size} animal(is)
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-12rem)] min-h-[500px] flex flex-col">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Selecionar Animais</CardTitle>
                  <CardDescription>{selected.size} selecionados</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar brinco/nome..." className="pl-10" />
                </div>
              </div>
            </CardHeader>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left w-12 hover:bg-gray-100 cursor-pointer" onClick={toggleAll}>
                      <div className="flex items-center justify-center">
                        <CheckSquare className={`h-5 w-5 ${selected.size > 0 && selected.size >= filteredBovinos.length && filteredBovinos.length > 0 ? "text-emerald-600" : "text-gray-400"}`} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 w-24">Brinco</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Nome</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 w-24">Sexo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBovinos.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">Nenhum animal encontrado</td></tr>
                  ) : filteredBovinos.map(b => (
                    <tr 
                      key={b.id} 
                      onClick={() => toggleBovino(b.id)}
                      className={`cursor-pointer transition-colors ${selected.has(b.id) ? "bg-emerald-50/50" : "bg-white hover:bg-gray-50/50"}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center">
                          <input type="checkbox" checked={selected.has(b.id)} readOnly className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{b.brinco}</td>
                      <td className="px-4 py-2.5 text-gray-600">{b.nome || "—"}</td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {b.sexo === "FEMEA" ? "Fêmea" : "Macho"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
