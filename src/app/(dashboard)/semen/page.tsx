"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Snowflake, AlertTriangle, Minus, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFazendaAtiva } from "@/components/fazenda-context";

interface BancoSemen {
  id: string;
  codigo: string;
  nomeTouro: string;
  raca: string | null;
  fornecedor: string | null;
  origem: string | null;
  quantidade: number;
}

const cores = [
  "from-indigo-400 to-cyan-500",
  "from-blue-400 to-sky-500",
  "from-violet-400 to-purple-500",
  "from-slate-400 to-gray-500",
];

export default function SemenPage() {
  const [semens, setSemens] = useState<BancoSemen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { fazendaAtiva, todasSelecionadas } = useFazendaAtiva();
  
  const defaultForm = {
    codigo: "",
    nomeTouro: "",
    raca: "",
    fornecedor: "",
    origem: "",
    quantidade: "0",
  };
  const [form, setForm] = useState(defaultForm);

  const fetchSemens = async () => {
    const res = await fetch("/api/semen");
    setSemens(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchSemens();
  }, [fazendaAtiva]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/semen/${editingId}` : "/api/semen";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantidade: parseInt(form.quantidade) || 0 }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
      setSaving(false);
      return;
    }

    resetForm();
    setSaving(false);
    fetchSemens();
  };

  const handleEdit = (s: BancoSemen) => {
    setForm({
      codigo: s.codigo,
      nomeTouro: s.nomeTouro,
      raca: s.raca || "",
      fornecedor: s.fornecedor || "",
      origem: s.origem || "",
      quantidade: String(s.quantidade),
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este sêmen do banco? Todas as inseminações vinculadas a este sêmen perderão a referência de estoque, mas o histórico básico na vaca será mantido.")) return;
    await fetch(`/api/semen/${id}`, { method: "DELETE" });
    fetchSemens();
  };

  const atualizarEstoque = async (id: string, novaQuantidade: number) => {
    if (novaQuantidade < 0) return;
    
    // Atualização otimista na tela
    setSemens(prev => prev.map(s => s.id === id ? { ...s, quantidade: novaQuantidade } : s));
    
    await fetch(`/api/semen/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantidade: novaQuantidade }),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const estoqueBaixo = semens.filter(s => s.quantidade <= 5 && s.quantidade > 0).length;
  const semEstoque = semens.filter(s => s.quantidade === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banco de Sêmen</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <span>{semens.length} cadastrados</span>
            {(estoqueBaixo > 0 || semEstoque > 0) && (
              <span className="flex items-center gap-1 text-amber-600 font-medium ml-2">
                <AlertTriangle className="h-4 w-4" /> 
                {semEstoque > 0 ? `${semEstoque} esgotados` : `${estoqueBaixo} no fim`}
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          disabled={todasSelecionadas}
          title={todasSelecionadas ? "Selecione uma fazenda para gerenciar o estoque" : ""}
          id="add-semen-btn"
        >
          <Plus className="h-4 w-4" />
          Novo Sêmen
        </Button>
      </div>

      <Hint id="semen-intro" title="Controle do Catálogo Reprodutivo">
        Cadastre os sêmens disponíveis na fazenda. As doses são abatidas do estoque
        automaticamente quando você realiza uma <strong>Inseminação Artificial em Lote</strong>.
      </Hint>

      {todasSelecionadas && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <strong>Dica:</strong> Selecione uma fazenda específica no seletor da sidebar para gerenciar o inventário.
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card className="animate-fade-in border-blue-200">
          <CardHeader>
            <CardTitle>{editingId ? "Editar Sêmen" : "Novo Cadastro"}</CardTitle>
            <CardDescription>
              Insira as informações do touro e o estoque inicial.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Código/ID/Palheta *</Label>
                  <Input
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    placeholder="Ex: 54321A"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome do Touro *</Label>
                  <Input
                    value={form.nomeTouro}
                    onChange={(e) => setForm({ ...form, nomeTouro: e.target.value })}
                    placeholder="Ex: Bandido, Radar"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estoque Inicial (Doses) *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.quantidade}
                    onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Raça</Label>
                  <Input
                    value={form.raca}
                    onChange={(e) => setForm({ ...form, raca: e.target.value })}
                    placeholder="Ex: Holandesa, Gir Leiteiro"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Empresa/Fornecedor</Label>
                  <Input
                    value={form.fornecedor}
                    onChange={(e) => setForm({ ...form, fornecedor: e.target.value })}
                    placeholder="Ex: Alta Genetics, ABS"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Origem (Opcional)</Label>
                  <Input
                    value={form.origem}
                    onChange={(e) => setForm({ ...form, origem: e.target.value })}
                    placeholder="País ou fazenda de origem"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Salvar" : "Cadastrar"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      {semens.length === 0 && !showForm ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center animate-fade-in">
          <Database className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Banco de Sêmen Vazio
          </h3>
          <p className="mt-2 text-gray-500">
            Você ainda não cadastrou nenhum sêmen/touro. Controle os fornecedores e estoque por aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {semens.map((semen, i) => (
            <Card
              key={semen.id}
              className={`animate-fade-in group overflow-hidden transition-shadow hover:shadow-md ${semen.quantidade === 0 ? "opacity-75" : ""}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`h-1.5 bg-gradient-to-r ${semen.quantidade === 0 ? 'from-red-400 to-rose-500' : cores[i % cores.length]}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${semen.quantidade === 0 ? 'from-red-400 to-rose-500' : cores[i % cores.length]} text-white shadow-sm`}>
                      <Snowflake className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-1">
                         {semen.codigo} — {semen.nomeTouro}
                      </h3>
                      {semen.raca && (
                        <p className="text-xs text-gray-500 line-clamp-1">{semen.raca}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleEdit(semen)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(semen.id)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
                  {semen.fornecedor && (
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">Fornecedor</span>
                      <span className="font-medium truncate">{semen.fornecedor}</span>
                    </div>
                  )}
                  {semen.origem && (
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">Origem</span>
                      <span className="font-medium truncate">{semen.origem}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <Badge variant={semen.quantidade === 0 ? "destructive" : semen.quantidade <= 5 ? "warning" : "secondary"} className="text-sm rounded-full px-3">
                    Estoque: {semen.quantidade} {semen.quantidade === 1 ? "dose" : "doses"}
                  </Badge>
                  <div className="flex gap-1">
                     <Button 
                       variant="outline" 
                       size="icon" 
                       className="h-8 w-8 rounded-full" 
                       disabled={semen.quantidade <= 0}
                       onClick={() => atualizarEstoque(semen.id, semen.quantidade - 1)}
                       title="Reduzir 1 dose"
                     >
                       <Minus className="h-3 w-3" />
                     </Button>
                     <Button 
                       variant="outline" 
                       size="icon" 
                       className="h-8 w-8 rounded-full" 
                       onClick={() => atualizarEstoque(semen.id, semen.quantidade + 1)}
                       title="Adicionar 1 dose"
                     >
                       <Plus className="h-3 w-3" />
                     </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
