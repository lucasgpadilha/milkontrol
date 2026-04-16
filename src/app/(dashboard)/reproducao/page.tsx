"use client";

import { useEffect, useState } from "react";
import { Plus, Heart, Loader2, Check, X, Layers, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hint } from "@/components/hint";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface BancoSemen {
  id: string;
  codigo: string;
  nomeTouro: string;
  quantidade: number;
}

interface Piquete {
  id: string;
  nome: string;
}

interface Inseminacao {
  id: string;
  data: string;
  tipo: "NATURAL" | "ARTIFICIAL";
  responsavel: string;
  touroSemen: string | null;
  prenhez: boolean | null;
  dataDiagnostico: string | null;
  observacoes: string | null;
  bovino: { brinco: string; nome: string | null; fazenda: { nome: string } };
  veterinario?: { nome: string } | null;
  bancoSemen?: { codigo: string; nomeTouro: string } | null;
}

interface Bovino { id: string; brinco: string; nome: string | null; sexo: string; piqueteId: string | null; }

export default function ReproducaoPage() {
  const [inseminacoes, setInseminacoes] = useState<Inseminacao[]>([]);
  const [bovinos, setBovinos] = useState<Bovino[]>([]);
  const [veterinarios, setVeterinarios] = useState<{id: string, nome: string, ativo: boolean}[]>([]);
  const [bancoSemenList, setBancoSemenList] = useState<BancoSemen[]>([]);
  const [piquetes, setPiquetes] = useState<Piquete[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formMode, setFormMode] = useState<"individual" | "lote">("individual");
  const [selectedPiqueteId, setSelectedPiqueteId] = useState("");
  const [selectedBovinoIds, setSelectedBovinoIds] = useState<string[]>([]);
  
  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    tipo: "ARTIFICIAL" as "NATURAL" | "ARTIFICIAL",
    responsavel: "",
    touroSemen: "",
    observacoes: "",
    bovinoId: "",
    veterinarioId: "",
    bancoSemenId: "",
  });

  const fetchData = async () => {
    const [insRes, bovRes, vetRes, semiRes, piqRes] = await Promise.all([
      fetch("/api/reproducao"),
      fetch("/api/bovinos?sexo=FEMEA"),
      fetch("/api/veterinarios"),
      fetch("/api/semen"),
      fetch("/api/piquetes"),
    ]);
    setInseminacoes(await insRes.json());
    setBovinos(await bovRes.json());
    const vets = await vetRes.json();
    setVeterinarios(vets.filter((v: any) => v.ativo));
    setBancoSemenList(await semiRes.json());
    setPiquetes(await piqRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggleBovinoLote = (id: string) => {
    setSelectedBovinoIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAllBovinosLote = (ids: string[]) => {
    if (selectedBovinoIds.length === ids.length) {
      setSelectedBovinoIds([]); // desselciona tudo
    } else {
      setSelectedBovinoIds(ids); // seleciona tudo
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (formMode === "individual") {
        const res = await fetch("/api/reproducao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else {
        if (selectedBovinoIds.length === 0) throw new Error("Selecione os animais para o lote.");
        const res = await fetch("/api/reproducao/lote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, bovinoIds: selectedBovinoIds }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }
      setShowForm(false);
      setSelectedBovinoIds([]);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Erro no lançamento.");
    } finally {
      setSaving(false);
    }
  };

  const updatePrenhez = async (id: string, prenhez: boolean) => {
    await fetch(`/api/reproducao/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prenhez }),
    });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  const vacasNoPiqueteId = bovinos.filter(b => b.piqueteId === selectedPiqueteId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reprodução</h1>
          <p className="mt-1 text-gray-500">{inseminacoes.filter((i) => i.prenhez === null).length} pendente(s) de diagnóstico</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} id="add-inseminacao-btn">
          <Plus className="h-4 w-4" /> Nova Inseminação
        </Button>
      </div>

      <Hint id="reproducao-intro" title="Controle reprodutivo e Lançamento em Lote">
        Registre cada inseminação em modo individual ou agilizado por lote. Se usar Sêmen artificial vinculado,
        o <strong>estoque será deduzido automaticamente</strong> das doses disponíveis no Banco de Sêmen.
      </Hint>

      {showForm && (
        <Card className="animate-fade-in border-emerald-200">
          <CardHeader>
            <div className="flex justify-between items-start">
               <div>
                 <CardTitle>Registrar Inseminação</CardTitle>
                 <CardDescription>Insira os dados. (RN05: deve ser registrada antes do diagnóstico)</CardDescription>
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
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {formMode === "lote" ? (
                <div className="space-y-4 rounded-lg bg-gray-50 p-4 border border-gray-100">
                  <div className="space-y-2">
                     <Label>Filtrar Vacas por Piquete / Área</Label>
                     <select 
                       value={selectedPiqueteId} 
                       onChange={(e) => setSelectedPiqueteId(e.target.value)} 
                       className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                     >
                        <option value="">Selecionar Piquete...</option>
                        {piquetes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                     </select>
                  </div>
                  
                  {selectedPiqueteId && (
                     <div className="space-y-2">
                       <div className="flex items-center justify-between">
                         <Label>Selecione as fêmeas para inseminação</Label>
                         <Button 
                           type="button" 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => handleSelectAllBovinosLote(vacasNoPiqueteId.map(v => v.id))}
                           className="h-8 text-xs text-emerald-600 hover:text-emerald-700"
                         >
                           {selectedBovinoIds.length === vacasNoPiqueteId.length ? "Desselcionar Todos" : "Selecionar Todos"}
                         </Button>
                       </div>
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                          {vacasNoPiqueteId.length === 0 ? (
                            <div className="col-span-full text-sm text-gray-500 py-2">Nenhuma vaca encontrada neste piquete.</div>
                          ) : (
                            vacasNoPiqueteId.map(v => (
                               <label key={v.id} className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer ${selectedBovinoIds.includes(v.id) ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
                                 <input type="checkbox" checked={selectedBovinoIds.includes(v.id)} onChange={() => handleToggleBovinoLote(v.id)} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                 <span className="text-sm font-medium">{v.brinco} {v.nome ? `- ${v.nome}` : ""}</span>
                               </label>
                            ))
                          )}
                       </div>
                       <p className="text-xs text-gray-500 mt-1">Total selecionado: <strong>{selectedBovinoIds.length}</strong> vacas</p>
                     </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Vaca *</Label>
                    <select value={form.bovinoId} onChange={(e) => setForm({ ...form, bovinoId: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" required={formMode === "individual"}>
                      <option value="">Selecionar</option>
                      {bovinos.map((b) => <option key={b.id} value={b.id}>{b.brinco} — {b.nome || ""}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <hr className="border-gray-100" />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2"><Label>Data *</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required /></div>
                
                {formMode === "individual" && (
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as "NATURAL" | "ARTIFICIAL", bancoSemenId: "" })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                      <option value="ARTIFICIAL">Inseminação Artificial</option>
                      <option value="NATURAL">Monta Natural</option>
                    </select>
                  </div>
                )}
                
                {/* Sempre é Artificial no modo lote */}

                {form.tipo === "ARTIFICIAL" && (
                  <div className="space-y-2">
                    <Label>Sêmen do Catálogo {formMode === "lote" && "(Abate Automático)"}</Label>
                    <select 
                      value={form.bancoSemenId} 
                      onChange={(e) => setForm({ ...form, bancoSemenId: e.target.value, touroSemen: "" })} 
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">(Nenhum / Preencher Manual)</option>
                      {bancoSemenList.map(s => (
                        <option key={s.id} value={s.id} disabled={s.quantidade === 0}>
                           {s.codigo} - {s.nomeTouro} ({s.quantidade} doses)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!form.bancoSemenId && (
                  <div className="space-y-2"><Label>Identificação Touro/Sêmen</Label><Input value={form.touroSemen} onChange={(e) => setForm({ ...form, touroSemen: e.target.value })} placeholder="Identificação manual" /></div>
                )}

                <div className="space-y-2">
                  <Label>Veterinário Cadastrado</Label>
                  <select 
                    value={form.veterinarioId} 
                    onChange={(e) => {
                      const vId = e.target.value;
                      const vNome = veterinarios.find(v => v.id === vId)?.nome || "";
                      setForm({ ...form, veterinarioId: vId, responsavel: vNome || form.responsavel });
                    }} 
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">(Nenhum / Não aplicável)</option>
                    {veterinarios.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><Label>Responsável (texto livre)*</Label><Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome do técnico" required /></div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-3"><Label>Observações</Label><Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar Inseminação"}</Button>
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
                <td>
                   {ins.veterinario ? (
                     <span className="font-medium text-emerald-700">{ins.veterinario.nome}</span>
                   ) : (
                     ins.responsavel
                   )}
                </td>
                <td>
                   {ins.bancoSemen ? (
                     <div className="flex font-medium text-blue-700">{ins.bancoSemen.codigo} - {ins.bancoSemen.nomeTouro}</div>
                   ) : (
                     ins.touroSemen || "—"
                   )}
                </td>
                <td>
                  {ins.prenhez === null ? (
                    <Badge variant="warning">Pendente</Badge>
                  ) : ins.prenhez ? (
                    <Badge variant="success">✓ Prenhe</Badge>
                  ) : (
                    <Badge variant="destructive">✗ Vazia</Badge>
                  )}
                </td>
                <td>
                  {ins.prenhez === null && (
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
