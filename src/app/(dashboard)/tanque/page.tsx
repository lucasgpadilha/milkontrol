"use client";

import { useEffect, useState } from "react";
import { Plus, FlaskConical, Loader2, AlertTriangle, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/utils";

interface Tanque {
  id: string;
  nome: string;
  capacidadeMax: number;
  volumeAtual: number;
  fazenda: { nome: string };
  movimentacoes: { id: string; data: string; tipo: string; tipoSaida: string | null; quantidade: number }[];
}

interface Fazenda { id: string; nome: string; }

export default function TanquePage() {
  const [tanques, setTanques] = useState<Tanque[]>([]);
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTanqueForm, setShowTanqueForm] = useState(false);
  const [showMovForm, setShowMovForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tanqueForm, setTanqueForm] = useState({ nome: "", capacidadeMax: "", fazendaId: "" });
  const [movForm, setMovForm] = useState({
    data: new Date().toISOString().split("T")[0],
    tipo: "ENTRADA" as "ENTRADA" | "SAIDA",
    tipoSaida: "VENDA",
    quantidade: "",
    tanqueId: "",
  });

  const fetchData = async () => {
    const [tanqRes, fazRes] = await Promise.all([fetch("/api/tanque"), fetch("/api/fazendas")]);
    setTanques(await tanqRes.json());
    const faz = await fazRes.json();
    setFazendas(faz);
    if (faz.length > 0 && !tanqueForm.fazendaId) setTanqueForm((f) => ({ ...f, fazendaId: faz[0].id }));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleTanqueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/tanque", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...tanqueForm, capacidadeMax: parseFloat(tanqueForm.capacidadeMax) }),
    });
    setShowTanqueForm(false);
    setSaving(false);
    fetchData();
  };

  const handleMovSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/tanque", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...movForm,
        quantidade: parseFloat(movForm.quantidade),
        tipoSaida: movForm.tipo === "SAIDA" ? movForm.tipoSaida : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setMovForm({ ...movForm, quantidade: "" });
    setShowMovForm(false);
    setSaving(false);
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Tanque de Leite</h1><p className="mt-1 text-gray-500">{tanques.length} tanque(s)</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTanqueForm(!showTanqueForm)}><Plus className="h-4 w-4" /> Novo Tanque</Button>
          {tanques.length > 0 && (
            <Button onClick={() => setShowMovForm(!showMovForm)} id="add-mov-btn"><Plus className="h-4 w-4" /> Movimentação</Button>
          )}
        </div>
      </div>

      {showTanqueForm && (
        <Card className="animate-fade-in border-emerald-200">
          <CardHeader><CardTitle>Novo Tanque</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleTanqueSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2"><Label>Nome *</Label><Input value={tanqueForm.nome} onChange={(e) => setTanqueForm({ ...tanqueForm, nome: e.target.value })} placeholder="Ex: Tanque Principal" required /></div>
                <div className="space-y-2"><Label>Capacidade Máx (L) *</Label><Input type="number" value={tanqueForm.capacidadeMax} onChange={(e) => setTanqueForm({ ...tanqueForm, capacidadeMax: e.target.value })} required /></div>
                <div className="space-y-2">
                  <Label>Fazenda *</Label>
                  <select value={tanqueForm.fazendaId} onChange={(e) => setTanqueForm({ ...tanqueForm, fazendaId: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" required>
                    {fazendas.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowTanqueForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showMovForm && (
        <Card className="animate-fade-in border-emerald-200">
          <CardHeader><CardTitle>Movimentação</CardTitle><CardDescription>Registre entrada ou saída de leite</CardDescription></CardHeader>
          <CardContent>
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            <form onSubmit={handleMovSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Tanque *</Label>
                  <select value={movForm.tanqueId} onChange={(e) => setMovForm({ ...movForm, tanqueId: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" required>
                    <option value="">Selecionar</option>
                    {tanques.map((t) => <option key={t.id} value={t.id}>{t.nome} ({formatNumber(t.volumeAtual)}L / {formatNumber(t.capacidadeMax)}L)</option>)}
                  </select>
                </div>
                <div className="space-y-2"><Label>Data *</Label><Input type="date" value={movForm.data} onChange={(e) => setMovForm({ ...movForm, data: e.target.value })} required /></div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <select value={movForm.tipo} onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value as "ENTRADA" | "SAIDA" })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                    <option value="ENTRADA">Entrada</option>
                    <option value="SAIDA">Saída</option>
                  </select>
                </div>
                {movForm.tipo === "SAIDA" && (
                  <div className="space-y-2">
                    <Label>Tipo Saída</Label>
                    <select value={movForm.tipoSaida} onChange={(e) => setMovForm({ ...movForm, tipoSaida: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                      <option value="VENDA">Venda</option>
                      <option value="CONSUMO_INTERNO">Consumo Interno</option>
                      <option value="DESCARTE">Descarte</option>
                    </select>
                  </div>
                )}
                <div className="space-y-2"><Label>Quantidade (L) *</Label><Input type="number" step="0.1" value={movForm.quantidade} onChange={(e) => setMovForm({ ...movForm, quantidade: e.target.value })} required /></div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowMovForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tank cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {tanques.map((t) => {
          const pct = (t.volumeAtual / t.capacidadeMax) * 100;
          const isAlerta = pct >= 90;
          return (
            <Card key={t.id} className="animate-fade-in">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{t.nome}</h3>
                  <span className="text-xs text-gray-500">{t.fazenda.nome}</span>
                </div>
                <div className="mb-2 flex items-end justify-between">
                  <span className="text-3xl font-bold text-gray-900">{formatNumber(t.volumeAtual)}L</span>
                  <span className="text-sm text-gray-500">/ {formatNumber(t.capacidadeMax)}L</span>
                </div>
                <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isAlerta ? "bg-red-500" : pct > 70 ? "bg-amber-400" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                {isAlerta && (
                  <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                    <AlertTriangle className="h-3 w-3" /> Tanque quase cheio ({pct.toFixed(0)}%)
                  </div>
                )}
                {t.movimentacoes.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <p className="text-xs font-medium text-gray-500 uppercase">Últimas movimentações</p>
                    {t.movimentacoes.slice(0, 5).map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {m.tipo === "ENTRADA" ? (
                            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-gray-600">{formatDate(m.data)}</span>
                        </div>
                        <span className={`font-medium ${m.tipo === "ENTRADA" ? "text-emerald-600" : "text-red-500"}`}>
                          {m.tipo === "ENTRADA" ? "+" : "-"}{formatNumber(m.quantidade)}L
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
