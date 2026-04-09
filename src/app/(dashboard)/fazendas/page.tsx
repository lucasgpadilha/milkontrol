"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  MapPin,
  Beef,
  Pencil,
  Trash2,
  Loader2,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface Fazenda {
  id: string;
  nome: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  _count: { bovinos: number };
}

export default function FazendasPage() {
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    endereco: "",
    cidade: "",
    estado: "",
  });

  const fetchFazendas = async () => {
    const res = await fetch("/api/fazendas");
    const data = await res.json();
    setFazendas(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFazendas();
  }, []);

  const resetForm = () => {
    setForm({ nome: "", endereco: "", cidade: "", estado: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/fazendas/${editingId}` : "/api/fazendas";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    resetForm();
    setSaving(false);
    fetchFazendas();
  };

  const handleEdit = (fazenda: Fazenda) => {
    setForm({
      nome: fazenda.nome,
      endereco: fazenda.endereco || "",
      cidade: fazenda.cidade || "",
      estado: fazenda.estado || "",
    });
    setEditingId(fazenda.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta fazenda? Todos os dados serão perdidos.")) return;
    await fetch(`/api/fazendas/${id}`, { method: "DELETE" });
    fetchFazendas();
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
          <h1 className="text-2xl font-bold text-gray-900">Fazendas</h1>
          <p className="mt-1 text-gray-500">
            Gerencie suas propriedades rurais
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          id="add-fazenda-btn"
        >
          <Plus className="h-4 w-4" />
          Nova Fazenda
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="animate-fade-in border-emerald-200">
          <CardHeader>
            <CardTitle>
              {editingId ? "Editar Fazenda" : "Nova Fazenda"}
            </CardTitle>
            <CardDescription>
              Preencha os dados da propriedade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    onChange={(e) =>
                      setForm({ ...form, nome: e.target.value })
                    }
                    placeholder="Nome da fazenda"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={form.endereco}
                    onChange={(e) =>
                      setForm({ ...form, endereco: e.target.value })
                    }
                    placeholder="Endereço"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={form.cidade}
                    onChange={(e) =>
                      setForm({ ...form, cidade: e.target.value })
                    }
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={form.estado}
                    onChange={(e) =>
                      setForm({ ...form, estado: e.target.value })
                    }
                    placeholder="UF"
                    maxLength={2}
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Farm list */}
      {fazendas.length === 0 && !showForm ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center animate-fade-in">
          <Warehouse className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Nenhuma fazenda cadastrada
          </h3>
          <p className="mt-2 text-gray-500">
            Cadastre sua primeira fazenda para começar
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fazendas.map((fazenda, i) => (
            <Card
              key={fazenda.id}
              className="animate-fade-in group"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                      <Warehouse className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {fazenda.nome}
                      </h3>
                      {(fazenda.cidade || fazenda.estado) && (
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {[fazenda.cidade, fazenda.estado]
                            .filter(Boolean)
                            .join(" — ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleEdit(fazenda)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(fazenda.id)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Beef className="h-4 w-4" />
                  <span>{fazenda._count.bovinos} bovinos</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
