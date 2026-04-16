"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Fence,
  Beef,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useFazendaAtiva } from "@/components/fazenda-context";

interface Piquete {
  id: string;
  nome: string;
  descricao: string | null;
  fazenda: { nome: string };
  _count: { bovinos: number };
}

const cores = [
  "from-emerald-400 to-teal-500",
  "from-blue-400 to-indigo-500",
  "from-amber-400 to-orange-500",
  "from-pink-400 to-rose-500",
  "from-violet-400 to-purple-500",
  "from-cyan-400 to-sky-500",
];

export default function PiquetesPage() {
  const [piquetes, setPiquetes] = useState<Piquete[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { fazendaAtiva, todasSelecionadas } = useFazendaAtiva();
  const [form, setForm] = useState({ nome: "", descricao: "" });

  const fetchPiquetes = async () => {
    const res = await fetch("/api/piquetes");
    setPiquetes(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchPiquetes();
  }, []);

  const resetForm = () => {
    setForm({ nome: "", descricao: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/piquetes/${editingId}` : "/api/piquetes";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
      setSaving(false);
      return;
    }

    resetForm();
    setSaving(false);
    fetchPiquetes();
  };

  const handleEdit = (p: Piquete) => {
    setForm({ nome: p.nome, descricao: p.descricao || "" });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este piquete? Os bovinos ficarão sem piquete atribuído.")) return;
    await fetch(`/api/piquetes/${id}`, { method: "DELETE" });
    fetchPiquetes();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Piquetes</h1>
          <p className="mt-1 text-gray-500">
            {piquetes.length} piquete{piquetes.length !== 1 ? "s" : ""} cadastrado{piquetes.length !== 1 ? "s" : ""}
            {fazendaAtiva && ` em ${fazendaAtiva.nome}`}
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          disabled={todasSelecionadas}
          title={todasSelecionadas ? "Selecione uma fazenda para criar piquetes" : ""}
          id="add-piquete-btn"
        >
          <Plus className="h-4 w-4" />
          Novo Piquete
        </Button>
      </div>

      <Hint id="piquetes-intro" title="Organize seu rebanho por áreas">
        Piquetes são as divisões de área da sua fazenda (ex: Pasto 1, Confinamento, Maternidade).
        Vincule bovinos a piquetes para organizar e filtrar seu rebanho por localização.
        Na Reprodução, você poderá selecionar vacas por piquete para inseminação em lote.
      </Hint>

      {todasSelecionadas && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <strong>Dica:</strong> Selecione uma fazenda específica no seletor da sidebar para criar e gerenciar piquetes.
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card className="animate-fade-in border-emerald-200">
          <CardHeader>
            <CardTitle>{editingId ? "Editar Piquete" : "Novo Piquete"}</CardTitle>
            <CardDescription>
              {editingId ? "Atualize os dados do piquete" : "Cadastre uma nova área na fazenda"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="piquete-nome">Nome *</Label>
                  <Input
                    id="piquete-nome"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex: Pasto 1, Confinamento, Maternidade"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="piquete-desc">Descrição</Label>
                  <Input
                    id="piquete-desc"
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    placeholder="Descrição opcional do piquete"
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

      {/* Piquetes grid */}
      {piquetes.length === 0 && !showForm ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center animate-fade-in">
          <Fence className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Nenhum piquete cadastrado
          </h3>
          <p className="mt-2 text-gray-500">
            Cadastre seu primeiro piquete para organizar o rebanho por área
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {piquetes.map((piquete, i) => (
            <Card
              key={piquete.id}
              className="animate-fade-in group overflow-hidden transition-shadow hover:shadow-md"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Colored top bar */}
              <div className={`h-1.5 bg-gradient-to-r ${cores[i % cores.length]}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${cores[i % cores.length]} text-white shadow-sm`}>
                      <Fence className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{piquete.nome}</h3>
                      {piquete.descricao && (
                        <p className="text-xs text-gray-500 line-clamp-1">{piquete.descricao}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleEdit(piquete)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(piquete.id)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant={piquete._count.bovinos > 0 ? "default" : "secondary"}>
                    <Beef className="mr-1 h-3 w-3" />
                    {piquete._count.bovinos} bovino{piquete._count.bovinos !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
