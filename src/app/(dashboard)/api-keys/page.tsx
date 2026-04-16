"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Shield,
  Clock,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";

interface ApiKeyItem {
  id: string;
  nome: string;
  prefixo: string;
  scopes: string[];
  ativo: boolean;
  ultimoUso: string | null;
  criadoEm: string;
  expiraEm: string | null;
  fazenda: { nome: string };
}

interface CreatedKey {
  id: string;
  nome: string;
  key: string;
  prefixo: string;
  scopes: string[];
}

function ScopeTag({ scope }: { scope: string }) {
  const colors: Record<string, string> = {
    read: "bg-blue-50 text-blue-700 border-blue-200",
    write: "bg-amber-50 text-amber-700 border-amber-200",
    delete: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${colors[scope] || "bg-gray-50 text-gray-700"}`}>
      {scope}
    </span>
  );
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [nome, setNome] = useState("");
  const [scopeRead, setScopeRead] = useState(true);
  const [scopeWrite, setScopeWrite] = useState(false);
  const [scopeDelete, setScopeDelete] = useState(false);
  const [expiraEm, setExpiraEm] = useState("");

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/api-keys");
    if (res.ok) setKeys(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    if (!nome.trim()) return;
    setCreating(true);

    const scopes = [];
    if (scopeRead) scopes.push("read");
    if (scopeWrite) scopes.push("write");
    if (scopeDelete) scopes.push("delete");

    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, scopes, expiraEm: expiraEm || null }),
    });

    if (res.ok) {
      const data = await res.json();
      setCreatedKey(data);
      setShowCreate(false);
      setNome("");
      setScopeRead(true);
      setScopeWrite(false);
      setScopeDelete(false);
      setExpiraEm("");
      fetchKeys();
    }
    setCreating(false);
  };

  const handleToggle = async (id: string, ativo: boolean) => {
    await fetch("/api/api-keys", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ativo: !ativo }),
    });
    fetchKeys();
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Remover permanentemente a chave "${nome}"?`)) return;
    await fetch(`/api/api-keys?id=${id}`, { method: "DELETE" });
    fetchKeys();
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md">
              <Key className="h-5 w-5 text-white" />
            </div>
            API Keys
          </h1>
          <p className="mt-1 text-gray-500">
            Gerencie chaves de acesso para integrações externas via{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-indigo-600">
              api.milkontrol.cloud
            </code>
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> Nova Chave
        </Button>
      </div>

      {/* Modal: Key Created (mostrada UMA vez) */}
      {createdKey && (
        <Card className="border-emerald-200 bg-emerald-50/50 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-emerald-900">
                  Chave criada: {createdKey.nome}
                </h3>
                <p className="text-sm text-emerald-700 mt-1">
                  ⚠️ Copie agora! Esta chave <strong>não será mostrada novamente</strong>.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-white border border-emerald-200 px-4 py-2.5 font-mono text-sm text-gray-900 select-all">
                    {createdKey.key}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyKey(createdKey.key)}
                    className="shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="mt-2 flex gap-1.5">
                  {createdKey.scopes.map((s) => <ScopeTag key={s} scope={s} />)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-emerald-700"
                  onClick={() => setCreatedKey(null)}
                >
                  Entendi, já copiei
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal: Create Key */}
      {showCreate && (
        <Card className="border-indigo-200 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Criar Nova API Key</CardTitle>
            <CardDescription>A chave será vinculada à fazenda ativa selecionada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Integração</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: App do Laticínio, Balança IoT..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissões (Scopes)</label>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={scopeRead} onChange={(e) => setScopeRead(e.target.checked)} className="rounded text-indigo-600" />
                  <span className="text-sm">read</span>
                  <span className="text-xs text-gray-400">— consultar dados</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={scopeWrite} onChange={(e) => setScopeWrite(e.target.checked)} className="rounded text-amber-600" />
                  <span className="text-sm">write</span>
                  <span className="text-xs text-gray-400">— criar/editar</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={scopeDelete} onChange={(e) => setScopeDelete(e.target.checked)} className="rounded text-red-600" />
                  <span className="text-sm">delete</span>
                  <span className="text-xs text-gray-400">— remover animais</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiração (opcional)</label>
              <input
                type="date"
                value={expiraEm}
                onChange={(e) => setExpiraEm(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={creating || !nome.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                Gerar Chave
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">Suas Chaves</CardTitle>
          <CardDescription>{keys.length} chave(s) registrada(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : keys.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Key className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nenhuma API Key criada ainda.</p>
              <p className="text-sm mt-1">Clique em "Nova Chave" para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                    <th className="py-3 pr-3 text-left font-medium">Nome</th>
                    <th className="py-3 pr-3 text-left font-medium">Prefixo</th>
                    <th className="py-3 pr-3 text-left font-medium">Fazenda</th>
                    <th className="py-3 pr-3 text-left font-medium">Scopes</th>
                    <th className="py-3 pr-3 text-left font-medium">Último Uso</th>
                    <th className="py-3 pr-3 text-left font-medium">Status</th>
                    <th className="py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {keys.map((k) => {
                    const expirado = k.expiraEm && new Date(k.expiraEm) < new Date();
                    return (
                      <tr key={k.id} className="hover:bg-gray-50/50">
                        <td className="py-3.5 pr-3 font-medium text-gray-900">{k.nome}</td>
                        <td className="py-3.5 pr-3">
                          <code className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-600">{k.prefixo}...</code>
                        </td>
                        <td className="py-3.5 pr-3 text-gray-600">{k.fazenda.nome}</td>
                        <td className="py-3.5 pr-3">
                          <div className="flex gap-1">{k.scopes.map((s) => <ScopeTag key={s} scope={s} />)}</div>
                        </td>
                        <td className="py-3.5 pr-3 text-gray-500 text-xs">
                          {k.ultimoUso ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {formatDateTime(k.ultimoUso)}
                            </span>
                          ) : (
                            <span className="text-gray-400">Nunca</span>
                          )}
                        </td>
                        <td className="py-3.5 pr-3">
                          {expirado ? (
                            <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 text-xs">Expirada</Badge>
                          ) : k.ativo ? (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Ativa</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-xs">Revogada</Badge>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggle(k.id, k.ativo)}
                              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              title={k.ativo ? "Revogar" : "Reativar"}
                            >
                              {k.ativo ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(k.id, k.nome)}
                              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
