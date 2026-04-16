"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Stethoscope,
  Phone,
  Mail,
  BadgeAlert,
  BadgeCheck,
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

interface Veterinario {
  id: string;
  nome: string;
  crmv: string | null;
  especialidade: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  fazenda: { nome: string };
}

const cores = [
  "from-emerald-400 to-teal-500",
  "from-blue-400 to-indigo-500",
  "from-amber-400 to-orange-500",
  "from-pink-400 to-rose-500",
  "from-violet-400 to-purple-500",
  "from-cyan-400 to-sky-500",
];

export default function VeterinariosPage() {
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { fazendaAtiva, todasSelecionadas } = useFazendaAtiva();
  
  const defaultForm = {
    nome: "",
    crmv: "",
    especialidade: "",
    telefone: "",
    email: "",
    ativo: true,
  };
  const [form, setForm] = useState(defaultForm);

  const fetchVeterinarios = async () => {
    const res = await fetch("/api/veterinarios");
    setVeterinarios(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchVeterinarios();
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
    const url = editingId ? `/api/veterinarios/${editingId}` : "/api/veterinarios";

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
    fetchVeterinarios();
  };

  const handleEdit = (v: Veterinario) => {
    setForm({
      nome: v.nome,
      crmv: v.crmv || "",
      especialidade: v.especialidade || "",
      telefone: v.telefone || "",
      email: v.email || "",
      ativo: v.ativo,
    });
    setEditingId(v.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este veterinário? Ele ainda será mantido no histórico dos procedimentos anteriores caso o banco não delete em cascata.")) return;
    await fetch(`/api/veterinarios/${id}`, { method: "DELETE" });
    fetchVeterinarios();
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
          <h1 className="text-2xl font-bold text-gray-900">Veterinários</h1>
          <p className="mt-1 text-gray-500">
            {veterinarios.length} veterinário{veterinarios.length !== 1 ? "s" : ""} cadastrado{veterinarios.length !== 1 ? "s" : ""}
            {fazendaAtiva && ` em ${fazendaAtiva.nome}`}
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          disabled={todasSelecionadas}
          title={todasSelecionadas ? "Selecione uma fazenda para cadastrar veterinários" : ""}
          id="add-vet-btn"
        >
          <Plus className="h-4 w-4" />
          Novo Veterinário
        </Button>
      </div>

      <Hint id="vets-intro" title="Gerencie os profissionais">
        Cadastre os veterinários que atuam na fazenda. Assim que cadastrados, você poderá
        vinculá-los aos acompanhamentos reprodutivos e aos controles sanitários dos bovinos.
      </Hint>

      {todasSelecionadas && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <strong>Dica:</strong> Selecione uma fazenda específica no seletor da sidebar para gerenciar os veterinários.
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card className="animate-fade-in border-emerald-200">
          <CardHeader>
            <CardTitle>{editingId ? "Editar Veterinário" : "Novo Veterinário"}</CardTitle>
            <CardDescription>
              {editingId ? "Atualize os dados do profissional" : "Insira as informações de contato e especialidade"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex: Dr. João Silva"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>CRMV</Label>
                  <Input
                    value={form.crmv}
                    onChange={(e) => setForm({ ...form, crmv: e.target.value })}
                    placeholder="Ex: CRMV-SP 12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Especialidade</Label>
                  <Input
                    value={form.especialidade}
                    onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
                    placeholder="Ex: Reprodução, Clínico Geral"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="dr.joao@email.com"
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer pt-6">
                    <input
                      type="checkbox"
                      checked={form.ativo}
                      onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 font-medium">Veterinário Ativo</span>
                  </label>
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
      {veterinarios.length === 0 && !showForm ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center animate-fade-in">
          <Stethoscope className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Nenhum veterinário cadastrado
          </h3>
          <p className="mt-2 text-gray-500">
            Cadastre o primeiro profissional para vinculá-lo aos procedimentos.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {veterinarios.map((vet, i) => (
            <Card
              key={vet.id}
              className={`animate-fade-in group overflow-hidden transition-shadow hover:shadow-md ${!vet.ativo ? "opacity-60" : ""}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`h-1.5 bg-gradient-to-r ${cores[i % cores.length]}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${cores[i % cores.length]} text-white shadow-sm`}>
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-1">
                         {vet.nome}
                         {!vet.ativo && <span title="Inativo"><BadgeAlert className="h-4 w-4 text-red-500" /></span>}
                         {vet.ativo && <span title="Ativo"><BadgeCheck className="h-4 w-4 text-emerald-500" /></span>}
                      </h3>
                      {vet.especialidade && (
                        <p className="text-xs text-gray-500 line-clamp-1">{vet.especialidade}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleEdit(vet)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(vet.id)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2 text-sm">
                  {vet.crmv && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">CRMV:</span> {vet.crmv}
                    </div>
                  )}
                  {vet.telefone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {vet.telefone}
                    </div>
                  )}
                  {vet.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {vet.email}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
