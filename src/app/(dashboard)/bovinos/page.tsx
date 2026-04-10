"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Beef,
  Pencil,
  Trash2,
  Loader2,
  Filter,
  Baby,
  Milk,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { calcularDEL, formatDate } from "@/lib/utils";

interface Bovino {
  id: string;
  brinco: string;
  nome: string | null;
  raca: string;
  dataNascimento: string;
  sexo: "MACHO" | "FEMEA";
  situacao: "ATIVA" | "VENDIDA" | "MORTA";
  fazenda: { nome: string };
  mae: { id: string; brinco: string; nome: string | null } | null;
  lactacoes: { id: string; inicio: string; fim: string | null }[];
  _count: { producoes: number; inseminacoes: number; filhos: number };
}

interface Fazenda {
  id: string;
  nome: string;
}

const situacaoColors = {
  ATIVA: "success" as const,
  VENDIDA: "warning" as const,
  MORTA: "destructive" as const,
};

const situacaoLabels = {
  ATIVA: "Ativa",
  VENDIDA: "Vendida",
  MORTA: "Morta",
};

export default function BovinosPage() {
  const [bovinos, setBovinos] = useState<Bovino[]>([]);
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroSexo, setFiltroSexo] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("");
  const [form, setForm] = useState({
    brinco: "",
    nome: "",
    raca: "",
    dataNascimento: "",
    sexo: "FEMEA" as "MACHO" | "FEMEA",
    situacao: "ATIVA" as "ATIVA" | "VENDIDA" | "MORTA",
    maeId: "",
    paiInfo: "",
    observacoes: "",
    fazendaId: "",
  });

  const fetchBovinos = async () => {
    const params = new URLSearchParams();
    if (busca) params.set("busca", busca);
    if (filtroSexo) params.set("sexo", filtroSexo);
    if (filtroSituacao) params.set("situacao", filtroSituacao);

    const res = await fetch(`/api/bovinos?${params}`);
    setBovinos(await res.json());
    setLoading(false);
  };

  const fetchFazendas = async () => {
    const res = await fetch("/api/fazendas");
    const data = await res.json();
    setFazendas(data);
    if (data.length > 0 && !form.fazendaId) {
      setForm((f) => ({ ...f, fazendaId: data[0].id }));
    }
  };

  useEffect(() => {
    fetchFazendas();
    fetchBovinos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => fetchBovinos(), 300);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, filtroSexo, filtroSituacao]);

  const resetForm = () => {
    setForm({
      brinco: "",
      nome: "",
      raca: "",
      dataNascimento: "",
      sexo: "FEMEA",
      situacao: "ATIVA",
      maeId: "",
      paiInfo: "",
      observacoes: "",
      fazendaId: fazendas[0]?.id || "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/bovinos/${editingId}` : "/api/bovinos";

    const body = {
      ...form,
      maeId: form.maeId || undefined,
      paiInfo: form.paiInfo || undefined,
    };

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    resetForm();
    setSaving(false);
    fetchBovinos();
  };

  const handleEdit = (b: Bovino) => {
    setForm({
      brinco: b.brinco,
      nome: b.nome || "",
      raca: b.raca,
      dataNascimento: b.dataNascimento.split("T")[0],
      sexo: b.sexo,
      situacao: b.situacao,
      maeId: b.mae?.id || "",
      paiInfo: "",
      observacoes: "",
      fazendaId: "",
    });
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este bovino? Todos os registros relacionados serão perdidos.")) return;
    await fetch(`/api/bovinos/${id}`, { method: "DELETE" });
    fetchBovinos();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const vacas = bovinos.filter((b) => b.sexo === "FEMEA");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bovinos</h1>
          <p className="mt-1 text-gray-500">
            {bovinos.length} animal{bovinos.length !== 1 ? "is" : ""} cadastrado{bovinos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          id="add-bovino-btn"
        >
          <Plus className="h-4 w-4" />
          Novo Bovino
        </Button>
      </div>

      <Hint id="bovinos-intro" title="Gerencie seu rebanho">
        Cadastre cada animal com brinco, raça e data de nascimento. Use os filtros para encontrar animais rapidamente.
        A coluna <strong>Lactação</strong> mostra os DEL (Dias em Lactação) das vacas que estão produzindo.
        Para registrar um bezerro, cadastre-o aqui e selecione a mãe no campo correspondente.
      </Hint>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por brinco, nome ou raça..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
            id="bovinos-search"
          />
        </div>
        <select
          value={filtroSexo}
          onChange={(e) => setFiltroSexo(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">Todos os sexos</option>
          <option value="FEMEA">Fêmea</option>
          <option value="MACHO">Macho</option>
        </select>
        <select
          value={filtroSituacao}
          onChange={(e) => setFiltroSituacao(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">Todas as situações</option>
          <option value="ATIVA">Ativa</option>
          <option value="VENDIDA">Vendida</option>
          <option value="MORTA">Morta</option>
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="animate-fade-in border-emerald-200">
          <CardHeader>
            <CardTitle>{editingId ? "Editar Bovino" : "Novo Bovino"}</CardTitle>
            <CardDescription>Preencha os dados do animal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {!editingId && (
                  <div className="space-y-2">
                    <Label>Fazenda *</Label>
                    <select
                      value={form.fazendaId}
                      onChange={(e) =>
                        setForm({ ...form, fazendaId: e.target.value })
                      }
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    >
                      {fazendas.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="brinco">Brinco *</Label>
                  <Input
                    id="brinco"
                    value={form.brinco}
                    onChange={(e) =>
                      setForm({ ...form, brinco: e.target.value })
                    }
                    placeholder="Ex: 001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome-bovino">Nome</Label>
                  <Input
                    id="nome-bovino"
                    value={form.nome}
                    onChange={(e) =>
                      setForm({ ...form, nome: e.target.value })
                    }
                    placeholder="Nome do animal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="raca">Raça *</Label>
                  <Input
                    id="raca"
                    value={form.raca}
                    onChange={(e) =>
                      setForm({ ...form, raca: e.target.value })
                    }
                    placeholder="Ex: Holandesa"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data-nascimento">Data de Nascimento *</Label>
                  <Input
                    id="data-nascimento"
                    type="date"
                    value={form.dataNascimento}
                    onChange={(e) =>
                      setForm({ ...form, dataNascimento: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sexo *</Label>
                  <select
                    value={form.sexo}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sexo: e.target.value as "MACHO" | "FEMEA",
                      })
                    }
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="FEMEA">Fêmea</option>
                    <option value="MACHO">Macho</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Situação</Label>
                  <select
                    value={form.situacao}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        situacao: e.target.value as "ATIVA" | "VENDIDA" | "MORTA",
                      })
                    }
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="ATIVA">Ativa</option>
                    <option value="VENDIDA">Vendida</option>
                    <option value="MORTA">Morta</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Mãe</Label>
                  <select
                    value={form.maeId}
                    onChange={(e) =>
                      setForm({ ...form, maeId: e.target.value })
                    }
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Sem mãe registrada</option>
                    {vacas.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brinco} — {v.nome || v.raca}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pai-info">Pai / Sêmen</Label>
                  <Input
                    id="pai-info"
                    value={form.paiInfo}
                    onChange={(e) =>
                      setForm({ ...form, paiInfo: e.target.value })
                    }
                    placeholder="Touro ou código do sêmen"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    "Salvar"
                  ) : (
                    "Cadastrar"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {bovinos.length === 0 && !showForm ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Beef className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Nenhum bovino cadastrado
          </h3>
          <p className="mt-2 text-gray-500">
            Cadastre seu primeiro animal para começar
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Brinco</th>
                  <th>Nome</th>
                  <th>Raça</th>
                  <th>Sexo</th>
                  <th>Nascimento</th>
                  <th>Situação</th>
                  <th>Lactação</th>
                  <th>Fazenda</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {bovinos.map((b) => {
                  const emLactacao =
                    b.lactacoes.length > 0 && !b.lactacoes[0].fim;
                  const del = emLactacao
                    ? calcularDEL(b.lactacoes[0].inicio)
                    : null;

                  return (
                    <tr key={b.id} className="animate-fade-in">
                      <td className="font-medium text-gray-900">{b.brinco}</td>
                      <td>{b.nome || "—"}</td>
                      <td>{b.raca}</td>
                      <td>
                        <Badge variant={b.sexo === "FEMEA" ? "default" : "secondary"}>
                          {b.sexo === "FEMEA" ? "♀ Fêmea" : "♂ Macho"}
                        </Badge>
                      </td>
                      <td>{formatDate(b.dataNascimento)}</td>
                      <td>
                        <Badge variant={situacaoColors[b.situacao]}>
                          {situacaoLabels[b.situacao]}
                        </Badge>
                      </td>
                      <td>
                        {b.sexo === "FEMEA" ? (
                          emLactacao ? (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Milk className="h-3.5 w-3.5" />
                              {del} DEL
                            </span>
                          ) : (
                            <span className="text-gray-400">Seca</span>
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-gray-500">{b.fazenda.nome}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEdit(b)}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
