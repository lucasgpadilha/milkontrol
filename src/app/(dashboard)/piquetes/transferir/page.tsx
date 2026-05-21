"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Search, CheckSquare, Fence, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hint } from "@/components/hint";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

interface Bovino {
  id: string;
  brinco: string;
  nome: string | null;
  sexo: string;
  piquete: { id: string; nome: string } | null;
}

interface Piquete {
  id: string;
  nome: string;
  _count: { bovinos: number };
}

export default function TransferirPiquetePage() {
  const router = useRouter();
  const [bovinos, setBovinos] = useState<Bovino[]>([]);
  const [piquetes, setPiquetes] = useState<Piquete[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [piqueteOrigem, setPiqueteOrigem] = useState("");
  const [piqueteDestino, setPiqueteDestino] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch("/api/bovinos").then(r => r.json()),
      fetch("/api/piquetes").then(r => r.json()),
    ]).then(([bov, piq]) => {
      setBovinos(bov);
      setPiquetes(piq);
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
    // Filtrar por piquete de origem
    if (piqueteOrigem) {
      if (piqueteOrigem === "__sem_piquete__") {
        if (b.piquete) return false;
      } else {
        if (b.piquete?.id !== piqueteOrigem) return false;
      }
    }
    // Filtrar por busca
    if (search) {
      const s = search.toLowerCase();
      return b.brinco.toLowerCase().includes(s) || (b.nome || "").toLowerCase().includes(s);
    }
    return true;
  });

  const toggleAll = () => {
    if (selected.size > 0 && filteredBovinos.every(b => selected.has(b.id))) {
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
    if (!piqueteDestino) {
      setError("Selecione o piquete de destino.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/bovinos/transferir-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bovinoIds: Array.from(selected),
          piqueteDestinoId: piqueteDestino,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na transferência.");

      setSuccessMsg(`${data.count} animal(is) transferido(s) para "${data.piquete}" com sucesso!`);
      setSelected(new Set());

      // Recarregar bovinos para refletir mudanças
      const updatedBov = await fetch("/api/bovinos").then(r => r.json());
      setBovinos(updatedBov);
      const updatedPiq = await fetch("/api/piquetes").then(r => r.json());
      setPiquetes(updatedPiq);

      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  const nomeDestino = piquetes.find(p => p.id === piqueteDestino)?.nome;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/piquetes" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-2 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar para piquetes
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
              <ArrowRight className="h-5 w-5 text-white" />
            </div>
            Transferir Animais
          </h1>
        </div>
      </div>

      <Hint id="transferir-piquete-intro" title="Transferência entre Piquetes">
        Selecione os animais que deseja mover e escolha o piquete de destino.
        Use o filtro de <strong>piquete de origem</strong> para facilitar a seleção de lotes inteiros.
      </Hint>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel lateral - Configuração */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fence className="h-5 w-5 text-blue-500" /> Configurar Transferência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form id="transferir-form" onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
                {successMsg && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 font-medium">{successMsg}</div>}

                <div className="space-y-2">
                  <Label>Filtrar por Origem</Label>
                  <select
                    value={piqueteOrigem}
                    onChange={(e) => { setPiqueteOrigem(e.target.value); setSelected(new Set()); }}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Todos os piquetes</option>
                    <option value="__sem_piquete__">🚫 Sem piquete</option>
                    {piquetes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p._count.bovinos} animais)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-400">para</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Piquete de Destino *</Label>
                  <select
                    value={piqueteDestino}
                    onChange={(e) => setPiqueteDestino(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  >
                    <option value="">Selecionar destino...</option>
                    {piquetes
                      .filter(p => p.id !== piqueteOrigem)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nome} ({p._count.bovinos} animais)
                        </option>
                      ))}
                  </select>
                </div>

                {/* Resumo */}
                {selected.size > 0 && piqueteDestino && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                    <strong>{selected.size}</strong> anim{selected.size !== 1 ? "ais" : "al"} → <strong>{nomeDestino}</strong>
                  </div>
                )}

                <Button type="submit" disabled={saving || selected.size === 0 || !piqueteDestino} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Transferir {selected.size} anim{selected.size !== 1 ? "ais" : "al"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Painel principal - Lista de animais */}
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-12rem)] min-h-[500px] flex flex-col">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Selecionar Animais</CardTitle>
                  <CardDescription>{selected.size} selecionados de {filteredBovinos.length} exibidos</CardDescription>
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
                        <CheckSquare className={`h-5 w-5 ${selected.size > 0 && filteredBovinos.every(b => selected.has(b.id)) && filteredBovinos.length > 0 ? "text-blue-600" : "text-gray-400"}`} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 w-24">Brinco</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Nome</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Piquete Atual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBovinos.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">Nenhum animal encontrado</td></tr>
                  ) : filteredBovinos.map(b => (
                    <tr
                      key={b.id}
                      onClick={() => toggleBovino(b.id)}
                      className={`cursor-pointer transition-colors ${selected.has(b.id) ? "bg-blue-50/50" : "bg-white hover:bg-gray-50/50"}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center">
                          <input type="checkbox" checked={selected.has(b.id)} readOnly className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{b.brinco}</td>
                      <td className="px-4 py-2.5 text-gray-600">{b.nome || "—"}</td>
                      <td className="px-4 py-2.5">
                        {b.piquete ? (
                          <Badge variant="secondary" className="gap-1">
                            <Fence className="h-3 w-3" /> {b.piquete.nome}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">Sem piquete</span>
                        )}
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
