"use client";

import { useEffect, useState } from "react";
import { Loader2, Package, AlertTriangle, Plus, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useFazendaAtiva } from "@/components/fazenda-context";

interface Insumo {
  id: string;
  nome: string;
  tipo: string;
  quantidade: number;
  unidade: string;
  estoqueMinimo: number;
  observacoes: string | null;
}

export default function EstoquePage() {
  const { fazendaAtiva, todasSelecionadas } = useFazendaAtiva();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [movimentandoId, setMovimentandoId] = useState<string | null>(null);
  const [movForm, setMovForm] = useState({ tipoMovimentacao: "ENTRADA", quantidade: "", motivo: "" });

  const [form, setForm] = useState({
    nome: "",
    tipo: "MEDICAMENTO",
    quantidade: "",
    unidade: "Frascos",
    estoqueMinimo: "0",
    observacoes: "",
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/estoque");
      if (res.ok) setInsumos(await res.json());
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
      const res = await fetch("/api/estoque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        setForm({ nome: "", tipo: "MEDICAMENTO", quantidade: "", unidade: "Frascos", estoqueMinimo: "0", observacoes: "" });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao criar insumo");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleMovimentacao = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/estoque/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movForm),
      });
      if (res.ok) {
        setMovimentandoId(null);
        setMovForm({ tipoMovimentacao: "ENTRADA", quantidade: "", motivo: "" });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao movimentar estoque");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este insumo? Todo o histórico de movimentações também será apagado.")) return;
    try {
      await fetch(`/api/estoque/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const tipoColors: Record<string, string> = {
    MEDICAMENTO: "bg-blue-100 text-blue-800",
    VACINA: "bg-emerald-100 text-emerald-800",
    SUPLEMENTO: "bg-amber-100 text-amber-800",
    OUTRO: "bg-gray-100 text-gray-800",
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 shadow-sm">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
            Estoque de Insumos
          </h1>
          <p className="mt-1 text-gray-500">Gestão de medicamentos, vacinas e suplementos</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} disabled={todasSelecionadas} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" /> Novo Insumo
        </Button>
      </div>

      {showForm && !todasSelecionadas && (
        <Card className="border-orange-200 shadow-sm">
          <CardHeader className="bg-orange-50/50 pb-4">
            <CardTitle className="text-lg text-orange-900">Cadastrar Insumo</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome / Produto *</Label>
                  <Input placeholder="Ex: Terramicina LA, Vacina Aftosa" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="MEDICAMENTO">Medicamento / Antibiótico</option>
                    <option value="VACINA">Vacina</option>
                    <option value="SUPLEMENTO">Suplemento / Vitamina</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Saldo Inicial</Label>
                  <Input type="number" step="0.1" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Unidade de Medida *</Label>
                  <select value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="mL">Mililitros (mL)</option>
                    <option value="Doses">Doses</option>
                    <option value="Frascos">Frascos</option>
                    <option value="Caixas">Caixas</option>
                    <option value="Kg">Quilos (Kg)</option>
                    <option value="Gramas">Gramas (g)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Alerta de Estoque Mínimo</Label>
                  <Input type="number" step="0.1" value={form.estoqueMinimo} onChange={e => setForm({ ...form, estoqueMinimo: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input placeholder="Princípio ativo, local de armazenamento, etc." value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Insumo"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insumos.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            Nenhum insumo cadastrado no estoque.
          </div>
        ) : (
          insumos.map((insumo) => (
            <Card key={insumo.id} className={`overflow-hidden transition-all ${insumo.quantidade <= insumo.estoqueMinimo && insumo.estoqueMinimo > 0 ? "border-red-300 shadow-sm shadow-red-100" : "border-gray-200"}`}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className={tipoColors[insumo.tipo]}>{insumo.tipo}</Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-600" onClick={() => handleDelete(insumo.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg mt-2">{insumo.nome}</CardTitle>
                <CardDescription className="text-xs truncate" title={insumo.observacoes || ""}>{insumo.observacoes || "Sem observações"}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Saldo Atual</div>
                    <div className={`text-2xl font-bold flex items-baseline gap-1 ${insumo.quantidade <= insumo.estoqueMinimo && insumo.estoqueMinimo > 0 ? "text-red-600" : "text-gray-900"}`}>
                      {insumo.quantidade} <span className="text-sm font-medium text-gray-500">{insumo.unidade}</span>
                    </div>
                  </div>
                  {insumo.estoqueMinimo > 0 && (
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500 uppercase">Mínimo</div>
                      <div className="text-sm font-medium text-gray-700">{insumo.estoqueMinimo}</div>
                    </div>
                  )}
                </div>

                {insumo.quantidade <= insumo.estoqueMinimo && insumo.estoqueMinimo > 0 && (
                  <div className="mt-3 text-xs flex items-center gap-1.5 text-red-600 bg-red-50 p-2 rounded-md">
                    <AlertTriangle className="h-3.5 w-3.5" /> Estoque baixo! Reabasteça.
                  </div>
                )}

                {movimentandoId === insumo.id ? (
                  <form onSubmit={(e) => handleMovimentacao(e, insumo.id)} className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant={movForm.tipoMovimentacao === "ENTRADA" ? "default" : "outline"} className={`flex-1 ${movForm.tipoMovimentacao === "ENTRADA" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`} onClick={() => setMovForm({ ...movForm, tipoMovimentacao: "ENTRADA" })}>
                        <ArrowDownRight className="h-3 w-3 mr-1" /> Entrada
                      </Button>
                      <Button type="button" size="sm" variant={movForm.tipoMovimentacao === "SAIDA" ? "default" : "outline"} className={`flex-1 ${movForm.tipoMovimentacao === "SAIDA" ? "bg-red-600 hover:bg-red-700" : ""}`} onClick={() => setMovForm({ ...movForm, tipoMovimentacao: "SAIDA" })}>
                        <ArrowUpRight className="h-3 w-3 mr-1" /> Saída
                      </Button>
                    </div>
                    <Input type="number" step="0.1" required placeholder={`Qtd em ${insumo.unidade}`} value={movForm.quantidade} onChange={e => setMovForm({ ...movForm, quantidade: e.target.value })} className="h-8 text-sm" />
                    <Input placeholder="Motivo (opcional)" value={movForm.motivo} onChange={e => setMovForm({ ...movForm, motivo: e.target.value })} className="h-8 text-sm" />
                    <div className="flex gap-2 pt-1">
                      <Button type="button" variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => setMovimentandoId(null)}>Cancelar</Button>
                      <Button type="submit" size="sm" className="flex-1 h-8 text-xs bg-gray-900 text-white">Confirmar</Button>
                    </div>
                  </form>
                ) : (
                  <Button variant="outline" className="w-full mt-4 h-9 border-dashed" onClick={() => setMovimentandoId(insumo.id)}>
                    Registrar Movimentação
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
