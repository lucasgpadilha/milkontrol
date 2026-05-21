"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Heart, Syringe, Save, User, FileText, Phone, Mail, Award, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface Inseminacao {
  id: string;
  data: string;
  tipo: "NATURAL" | "ARTIFICIAL";
  touroSemen: string | null;
  prenhez: boolean | null;
  bovino: { id: string; brinco: string; nome: string | null };
  bancoSemen?: { codigo: string; nomeTouro: string } | null;
}

interface RegistroSanitario {
  id: string;
  data: string;
  produto: string;
  dose: string | null;
  fimCarencia: string | null;
  bovino: { id: string; brinco: string; nome: string | null };
}

interface VeterinarioDetalhe {
  id: string;
  nome: string;
  crmv: string | null;
  especialidade: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  inseminacoes: Inseminacao[];
  registrosSanitarios: RegistroSanitario[];
}

export default function VeterinarioDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [data, setData] = useState<VeterinarioDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"dados" | "inseminacoes" | "sanitario">("dados");

  const [form, setForm] = useState({
    nome: "",
    crmv: "",
    especialidade: "",
    telefone: "",
    email: "",
    ativo: true,
  });

  useEffect(() => {
    fetch(`/api/veterinarios/${resolvedParams.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setData(d);
          setForm({
            nome: d.nome,
            crmv: d.crmv || "",
            especialidade: d.especialidade || "",
            telefone: d.telefone || "",
            email: d.email || "",
            ativo: d.ativo,
          });
        }
        setLoading(false);
      });
  }, [resolvedParams.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/veterinarios/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      
      const updated = await res.json();
      setData(prev => prev ? { ...prev, ...updated } : null);
      alert("Dados salvos com sucesso!");
    } catch (err: any) {
      alert(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  if (!data) return <div className="p-10 text-center text-gray-500">Veterinário não encontrado.</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/veterinarios" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-2 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar para lista
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {data.nome}
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                <FileText className="h-3.5 w-3.5" />
                {data.crmv || "Sem CRMV"} • {data.especialidade || "Geral"}
              </p>
            </div>
          </div>
        </div>
        <Badge variant={data.ativo ? "success" : "secondary"} className="self-start sm:self-center">
          {data.ativo ? "Ativo no Sistema" : "Inativo"}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("dados")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "dados" ? "border-emerald-500 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
          <User className="h-4 w-4 inline-block mr-1.5 mb-0.5" /> Dados Cadastrais
        </button>
        <button
          onClick={() => setActiveTab("inseminacoes")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "inseminacoes" ? "border-pink-500 text-pink-700" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
          <Heart className="h-4 w-4" /> Reprodução
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{data.inseminacoes.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("sanitario")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "sanitario" ? "border-blue-500 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
          <Syringe className="h-4 w-4" /> Sanitário
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{data.registrosSanitarios.length}</span>
        </button>
      </div>

      {/* Content */}
      <div className="pt-2">
        {activeTab === "dados" && (
          <Card className="animate-fade-in shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle>Editar Perfil</CardTitle>
              <CardDescription>Atualize as informações de contato e registro do profissional.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="pl-9" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Registro (CRMV)</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input value={form.crmv} onChange={(e) => setForm({ ...form, crmv: e.target.value })} placeholder="Ex: CRMV-PR 12345" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Especialidade</Label>
                    <div className="relative">
                      <Award className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input value={form.especialidade} onChange={(e) => setForm({ ...form, especialidade: e.target.value })} placeholder="Ex: Reprodução Bovina" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="veterinario@exemplo.com" className="pl-9" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.ativo}
                      onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Veterinário Ativo</span>
                  </label>

                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === "inseminacoes" && (
          <div className="animate-fade-in space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" /> Histórico Reprodutivo
            </h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Vaca</th>
                    <th className="hidden sm:table-cell">Tipo</th>
                    <th className="hidden md:table-cell">Touro/Sêmen</th>
                    <th>Diagnóstico</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inseminacoes.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhuma inseminação registrada por este profissional.</td></tr>
                  ) : data.inseminacoes.map(ins => (
                    <tr key={ins.id}>
                      <td>{formatDate(ins.data)}</td>
                      <td className="font-medium">
                        <Link href={`/bovinos/${ins.bovino.id}`} className="text-emerald-700 hover:underline">
                          {ins.bovino.brinco}
                        </Link>
                        {ins.bovino.nome ? ` — ${ins.bovino.nome}` : ""}
                      </td>
                      <td className="hidden sm:table-cell">
                        <Badge variant={ins.tipo === "ARTIFICIAL" ? "default" : "secondary"}>{ins.tipo === "ARTIFICIAL" ? "IA" : "Natural"}</Badge>
                      </td>
                      <td className="hidden md:table-cell">
                        {ins.bancoSemen ? (
                          <span className="font-medium text-blue-700">{ins.bancoSemen.codigo} - {ins.bancoSemen.nomeTouro}</span>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "sanitario" && (
          <div className="animate-fade-in space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Syringe className="h-5 w-5 text-blue-500" /> Tratamentos e Vacinas
            </h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Animal</th>
                    <th>Produto</th>
                    <th className="hidden sm:table-cell">Dose</th>
                    <th className="hidden md:table-cell">Fim Carência</th>
                  </tr>
                </thead>
                <tbody>
                  {data.registrosSanitarios.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhum registro sanitário associado.</td></tr>
                  ) : data.registrosSanitarios.map(r => (
                    <tr key={r.id}>
                      <td>{formatDate(r.data)}</td>
                      <td className="font-medium">
                        <Link href={`/bovinos/${r.bovino.id}`} className="text-emerald-700 hover:underline">
                          {r.bovino.brinco}
                        </Link>
                        {r.bovino.nome ? ` — ${r.bovino.nome}` : ""}
                      </td>
                      <td>{r.produto}</td>
                      <td className="hidden sm:table-cell">{r.dose || "—"}</td>
                      <td className="hidden md:table-cell">
                        {r.fimCarencia ? formatDate(r.fimCarencia) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
