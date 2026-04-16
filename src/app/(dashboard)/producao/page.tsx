"use client";

import { useEffect, useState } from "react";
import { Plus, Milk, Loader2, Layers, User, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchWithOfflineFallback } from "@/lib/offline-queue";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hint } from "@/components/hint";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/utils";
import { useFazendaAtiva } from "@/components/fazenda-context";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const { fazendaAtiva } = useFazendaAtiva();
  const ordenhasDia = fazendaAtiva?.ordenhasDia || 2;

  // Mode toggle
  const [formMode, setFormMode] = useState<"individual" | "lote">("lote");
  
  // Individual form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    quantidade: "",
    turno: "MANHA",
    bovinoId: "",
  });

  // Batch grid
  const [gridData, setGridData] = useState(new Date().toISOString().split("T")[0]);
  const [gridTurno, setGridTurno] = useState("MANHA");
  const [gridValues, setGridValues] = useState<Record<string, string>>({});
  const [gridSearch, setGridSearch] = useState("");

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

  // Individual submit
  const handleSubmitIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccessMsg("");
    setSaving(true);

    const res = await fetchWithOfflineFallback("/api/producao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantidade: parseFloat(form.quantidade) }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Erro offline detectado"); setSaving(false); return; }

    setForm({ ...form, quantidade: "" });
    setSaving(false);
    setSuccessMsg("Registrado com sucesso!");
    setTimeout(() => setSuccessMsg(""), 3000);
    fetchData();
  };

  // Batch submit
  const handleSubmitLote = async () => {
    setError(""); setSuccessMsg("");
    const registros = Object.entries(gridValues)
      .filter(([_, val]) => val && parseFloat(val) > 0)
      .map(([bovinoId, val]) => ({ bovinoId, quantidade: parseFloat(val) }));

    if (registros.length === 0) { setError("Preencha pelo menos uma quantidade."); return; }

    setSaving(true);
    try {
      const res = await fetchWithOfflineFallback("/api/producao/lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: gridData, turno: gridTurno, registros }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro offline detectado");

      setGridValues({});
      setSuccessMsg(`${data.count} lançamento(s) registrado(s) com sucesso!`);
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Erro no lançamento.");
    } finally {
      setSaving(false);
    }
  };

  const totalHoje = producoes
    .filter((p) => p.data.startsWith(new Date().toISOString().split("T")[0]))
    .reduce((acc, p) => acc + p.quantidade, 0);

  const gridTotalPreenchido = Object.values(gridValues)
    .filter(v => v && parseFloat(v) > 0)
    .reduce((acc, v) => acc + parseFloat(v), 0);

  const gridCountPreenchido = Object.values(gridValues)
    .filter(v => v && parseFloat(v) > 0).length;

  // Filter grid by search
  const filteredBovinos = bovinos.filter(b => {
    if (!gridSearch) return true;
    const search = gridSearch.toLowerCase();
    return b.brinco.toLowerCase().includes(search) || (b.nome || "").toLowerCase().includes(search);
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produção de Leite</h1>
          <p className="mt-1 text-gray-500">
            Hoje: <span className="font-semibold text-emerald-600">{formatNumber(totalHoje)}L</span>
            {" · "}{bovinos.length} vaca(s) em lactação
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} id="add-producao-btn">
          <Plus className="h-4 w-4" /> Novo Lançamento
        </Button>
      </div>

      <Hint id="producao-intro-v2" title="Lançamento de Ordenha — Individual ou em Lote">
        Use o modo <strong>Lote</strong> para lançar a produção de todas as vacas de uma vez: selecione data e turno,
        preencha as quantidades no grid, e salve tudo de uma só vez.
        Vacas em <strong>carência</strong> serão bloqueadas automaticamente.
      </Hint>

      {showForm && (
        <Card className="animate-fade-in border-emerald-200">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Registrar Produção</CardTitle>
                <CardDescription>Lançamento diário de leite por turno</CardDescription>
              </div>
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setFormMode("individual")}
                  className={`flex items-center gap-1.5 rounded-l-md px-4 py-2 text-sm font-medium border ${formMode === "individual" ? "bg-emerald-50 text-emerald-700 border-emerald-200 z-10" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 -mr-px"}`}
                >
                  <User className="h-4 w-4" /> Individual
                </button>
                <button
                  onClick={() => setFormMode("lote")}
                  className={`flex items-center gap-1.5 rounded-r-md px-4 py-2 text-sm font-medium border ${formMode === "lote" ? "bg-emerald-50 text-emerald-700 border-emerald-200 z-10" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
                >
                  <Layers className="h-4 w-4" /> Em Lote
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            {successMsg && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 font-medium">{successMsg}</div>}

            {formMode === "individual" ? (
              <form onSubmit={handleSubmitIndividual} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Vaca *</Label>
                    <select value={form.bovinoId} onChange={(e) => setForm({ ...form, bovinoId: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" required>
                      <option value="">Selecionar vaca</option>
                      {bovinos.map((b) => <option key={b.id} value={b.id}>{b.brinco} — {b.nome || "Sem nome"}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2"><Label>Data *</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Quantidade (L) *</Label><Input type="number" step="0.1" min="0" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} placeholder="0.0" required /></div>
                  <div className="space-y-2">
                    <Label>Turno</Label>
                    <select value={form.turno} onChange={(e) => setForm({ ...form, turno: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                      <option value="MANHA">Manhã</option>
                      <option value="TARDE">Tarde</option>
                      {ordenhasDia >= 3 && <option value="NOITE">Noite</option>}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Batch controls */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2"><Label>Data da Ordenha *</Label><Input type="date" value={gridData} onChange={(e) => setGridData(e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Turno *</Label>
                    <select value={gridTurno} onChange={(e) => setGridTurno(e.target.value)} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                      <option value="MANHA">Manhã</option>
                      <option value="TARDE">Tarde</option>
                      {ordenhasDia >= 3 && <option value="NOITE">Noite</option>}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Buscar Vaca</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input value={gridSearch} onChange={(e) => setGridSearch(e.target.value)} placeholder="Brinco ou nome..." className="pl-10" />
                    </div>
                  </div>
                </div>

                {/* Grid editável */}
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <div className="max-h-[420px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-600 w-24">Brinco</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Nome</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-600 w-36">Litros (L)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredBovinos.length === 0 ? (
                          <tr><td colSpan={3} className="text-center py-8 text-gray-400">Nenhuma vaca em lactação encontrada</td></tr>
                        ) : filteredBovinos.map((b, idx) => (
                          <tr key={b.id} className={`${gridValues[b.id] && parseFloat(gridValues[b.id]) > 0 ? "bg-emerald-50/50" : "bg-white hover:bg-gray-50/50"} transition-colors`}>
                            <td className="px-4 py-2.5 font-semibold text-gray-900">{b.brinco}</td>
                            <td className="px-4 py-2.5 text-gray-600">{b.nome || "—"}</td>
                            <td className="px-4 py-2.5 text-right">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                placeholder="0.0"
                                value={gridValues[b.id] || ""}
                                onChange={(e) => setGridValues({ ...gridValues, [b.id]: e.target.value })}
                                className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-right text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                tabIndex={idx + 1}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Resume + Save */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-emerald-700">{gridCountPreenchido}</span> vaca(s) preenchida(s) · Total: <span className="font-bold text-emerald-700">{formatNumber(gridTotalPreenchido)}L</span>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSubmitLote} disabled={saving || gridCountPreenchido === 0} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar Lote ({gridCountPreenchido})
                    </Button>
                    <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
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
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">Nenhum lançamento registrado</td></tr>
              ) : producoes.map((p) => (
                <tr key={p.id}>
                  <td>{formatDate(p.data)}</td>
                  <td className="font-medium">{p.bovino.brinco} — {p.bovino.nome || "Sem nome"}</td>
                  <td><span className="font-semibold text-emerald-600">{formatNumber(p.quantidade)}L</span></td>
                  <td>{p.turno === "MANHA" ? "Manhã" : p.turno === "TARDE" ? "Tarde" : p.turno === "NOITE" ? "Noite" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
