"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, UserPlus, Shield, Trash2, Mail, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface Membro {
  id: string;
  papel: string;
  user: { id: string; nome: string; email: string };
}

interface Convite {
  id: string;
  email: string;
  papel: string;
  token: string;
  expiraEm: string;
  criadoEm: string;
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    PROPRIETARIO: "bg-purple-50 text-purple-700 border-purple-200",
    GERENTE: "bg-blue-50 text-blue-700 border-blue-200",
    OPERADOR: "bg-emerald-50 text-emerald-700 border-emerald-200",
    VETERINARIO: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${colors[role] || "bg-gray-50 text-gray-700"}`}>
      {role}
    </span>
  );
}

export default function EquipePage() {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [convites, setConvites] = useState<Convite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  
  // Form Invite
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState("OPERADOR");
  const [inviting, setInviting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/equipe");
    if (res.ok) {
      const data = await res.json();
      setMembros(data.membros || []);
      setConvites(data.convites || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleInvite = async () => {
    if (!email) return;
    setInviting(true);
    setErrorMsg("");
    setInviteResult(null);

    const res = await fetch("/api/equipe/convites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, papel }),
    });

    const data = await res.json();
    setInviting(false);

    if (!res.ok) {
      setErrorMsg(data.error || "Erro ao convidar");
      return;
    }

    setInviteResult(data.link);
    setShowInvite(false);
    setEmail("");
    fetchData();
  };

  const handleRemove = async (type: "membro" | "convite", id: string, name: string) => {
    if (!confirm(`Remover ${name}? Ele perderá acesso à fazenda imediatamente.`)) return;
    
    await fetch(`/api/equipe?type=${type}&id=${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md">
              <Users className="h-5 w-5 text-white" />
            </div>
            Equipe da Fazenda
          </h1>
          <p className="mt-1 text-gray-500">
            Gerencie os colaboradores e veterinários que possuem acesso a esta fazenda.
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <UserPlus className="h-4 w-4 mr-2" /> Convidar Membro
        </Button>
      </div>

      {inviteResult && (
        <Card className="border-emerald-200 bg-emerald-50/50 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-emerald-900">Convite Criado com Sucesso!</h3>
                <p className="text-sm text-emerald-700 mt-1">Copie o link abaixo e envie para o colaborador:</p>
                <code className="mt-2 block w-full rounded-lg bg-white border border-emerald-200 px-4 py-2.5 font-mono text-sm select-all">
                  {inviteResult}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showInvite && (
        <Card className="border-indigo-200 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Novo Convite</CardTitle>
            <CardDescription>O colaborador receberá um link de acesso. Novas contas serão criadas automaticamente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail do colaborador</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@email.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nível de Acesso</label>
              <select 
                value={papel} 
                onChange={(e) => setPapel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="PROPRIETARIO">Proprietário (Acesso Total)</option>
                <option value="GERENTE">Gerente (Edição Limitada, sem Billing)</option>
                <option value="OPERADOR">Operador de Curral (Somente Lançamentos Diários)</option>
                <option value="VETERINARIO">Veterinário (Somente Sanitário/Reprodutivo)</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleInvite} disabled={inviting || !email} className="bg-indigo-600 hover:bg-indigo-700">
                {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                Gerar Link
              </Button>
              <Button variant="ghost" onClick={() => setShowInvite(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Membros Ativos */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-3 border-b border-gray-50">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Membros Ativos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400"/></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {membros.map(m => (
                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {m.user.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{m.user.nome}</p>
                      <p className="text-sm text-gray-500">{m.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <RoleBadge role={m.papel} />
                    <button 
                      onClick={() => handleRemove("membro", m.id, m.user.nome)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Convites Pendentes */}
      {convites.length > 0 && (
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-500" /> Convites Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {convites.map(c => (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                  <div>
                    <p className="font-medium text-gray-900">{c.email}</p>
                    <p className="text-xs text-gray-500">
                      Enviado em {formatDate(c.criadoEm)} • Expira em {formatDate(c.expiraEm)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <RoleBadge role={c.papel} />
                    <button 
                      onClick={() => handleRemove("convite", c.id, c.email)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Cancelar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
