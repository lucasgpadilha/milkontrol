"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Search, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hint } from "@/components/hint";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface Bovino {
  id: string;
  brinco: string;
  nome: string | null;
  lactacoes: { fim: string | null }[];
}

export default function LoteSecagemPage() {
  const router = useRouter();
  const [bovinos, setBovinos] = useState<Bovino[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const [form, setForm] = useState({
    dataSecagem: new Date().toISOString().split("T")[0],
  });

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchBovinos = async () => {
    try {
      const res = await fetch("/api/bovinos?sexo=FEMEA");
      const data = await res.json();
      // Filtrar apenas quem tem lactação aberta (última lactação sem "fim")
      const ativas = data.filter((b: Bovino) => b.lactacoes?.length > 0 && !b.lactacoes[0]?.fim);
      setBovinos(ativas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBovinos();
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
      setError("Selecione pelo menos uma vaca.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/lactacao/seca-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataSecagem: form.dataSecagem,
          bovinos: Array.from(selected)
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMsg(`Lactações encerradas com sucesso!`);
      setSelected(new Set());
      await fetchBovinos();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err.message || "Erro na secagem.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Secagem em Lote</h1>
        <Button variant="outline" onClick={() => router.push("/lactacao")}>Voltar</Button>
      </div>

      <Hint id="secagem-lote-intro" title="Encerramento de Lactações">
        Selecione as vacas para encerrar lactações na data informada. Apenas vacas em produção (lactação aberta) são exibidas.
      </Hint>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Secagem</CardTitle>
            </CardHeader>
            <CardContent>
              <form id="seca-lote-form" onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
                {successMsg && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 font-medium">{successMsg}</div>}

                <div className="space-y-2">
                  <Label>Data de Secagem *</Label>
                  <Input type="date" value={form.dataSecagem} onChange={(e) => setForm({ ...form, dataSecagem: e.target.value })} required />
                </div>

                <Button type="submit" disabled={saving || selected.size === 0} className="w-full gap-2 mt-4">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Secar {selected.size} vaca(s)
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
                  <CardTitle>Vacas em Lactação Aberta</CardTitle>
                  <CardDescription>{selected.size} selecionadas</CardDescription>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBovinos.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-8 text-gray-400">Nenhuma vaca com lactação aberta encontrada</td></tr>
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
