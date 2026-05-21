"use client";

import { useEffect, useState } from "react";
import { Loader2, CalendarClock, CheckCircle2, Circle, AlertTriangle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { useFazendaAtiva } from "@/components/fazenda-context";

interface AgendaEvento {
  id: string;
  titulo: string;
  tipo: string;
  dataHora: string;
  concluido: boolean;
  prioridade: "ALTA" | "MEDIA" | "BAIXA";
  notas: string | null;
  bovino?: { brinco: string; nome: string | null };
}

export default function AgendaPage() {
  const { fazendaAtiva, todasSelecionadas } = useFazendaAtiva();
  const [eventos, setEventos] = useState<AgendaEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    titulo: "",
    tipo: "OUTRO",
    dataHora: new Date().toISOString().split("T")[0],
    prioridade: "MEDIA",
    notas: "",
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/agenda");
      if (res.ok) setEventos(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    requestNotificationPermission();
  }, [fazendaAtiva]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        await Notification.requestPermission();
      }
    }
  };

  const handleToggleConcluido = async (id: string, atual: boolean) => {
    try {
      await fetch(`/api/agenda/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concluido: !atual }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este evento?")) return;
    try {
      await fetch(`/api/agenda/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        setForm({ titulo: "", tipo: "OUTRO", dataHora: new Date().toISOString().split("T")[0], prioridade: "MEDIA", notas: "" });
        fetchData();
      } else {
        alert("Erro ao criar evento");
      }
    } finally {
      setSaving(false);
    }
  };

  const prioridadeColors = {
    ALTA: "bg-red-100 text-red-800 border-red-200",
    MEDIA: "bg-amber-100 text-amber-800 border-amber-200",
    BAIXA: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const hoje = new Date().toISOString().split("T")[0];
  const eventosHoje = eventos.filter(e => e.dataHora.startsWith(hoje) && !e.concluido);
  const eventosPendentes = eventos.filter(e => !e.concluido && !e.dataHora.startsWith(hoje));
  const eventosConcluidos = eventos.filter(e => e.concluido).slice(0, 10); // mostra ultimos 10

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
              <CalendarClock className="h-5 w-5 text-white" />
            </div>
            Agenda e Lembretes
          </h1>
          <p className="mt-1 text-gray-500">Manejos, secagens e partos previstos</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} disabled={todasSelecionadas}>
          <Plus className="h-4 w-4 mr-2" /> Novo Evento
        </Button>
      </div>

      {todasSelecionadas && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Selecione uma fazenda específica para gerenciar a agenda.
        </div>
      )}

      {showForm && !todasSelecionadas && (
        <Card className="border-indigo-100 shadow-sm">
          <CardHeader className="bg-indigo-50/50 pb-4">
            <CardTitle className="text-lg text-indigo-900">Novo Lembrete</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input placeholder="Ex: Comprar vacinas" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="OUTRO">Outro / Geral</option>
                    <option value="VACINACAO_PROGRAMADA">Vacinação Programada</option>
                    <option value="REVISAO_EQUIPAMENTO">Revisão de Equipamento</option>
                    <option value="IATF_ETAPA">Etapa IATF</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input type="date" value={form.dataHora} onChange={e => setForm({ ...form, dataHora: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Prioridade *</Label>
                  <select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value as any })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Notas Adicionais</Label>
                  <Input placeholder="Detalhes da tarefa..." value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Evento"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-emerald-100 shadow-sm">
          <CardHeader className="bg-emerald-50/50 pb-3 border-b border-emerald-100">
            <CardTitle className="text-emerald-900 text-lg flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-emerald-600" /> Para Hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {eventosHoje.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">Nenhum evento agendado para hoje.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {eventosHoje.map(e => (
                  <li key={e.id} className="p-4 hover:bg-gray-50 flex items-start gap-3">
                    <button onClick={() => handleToggleConcluido(e.id, e.concluido)} className="mt-1 text-gray-400 hover:text-emerald-600 transition-colors">
                      <Circle className="h-5 w-5" />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{e.titulo}</span>
                        {e.bovino && <Badge variant="outline" className="bg-gray-50">Vaca: {e.bovino.brinco}</Badge>}
                      </div>
                      {e.notas && <p className="text-sm text-gray-500 mt-1">{e.notas}</p>}
                    </div>
                    <Badge variant="outline" className={prioridadeColors[e.prioridade]}>{e.prioridade}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50/50 pb-3 border-b border-gray-100">
            <CardTitle className="text-gray-900 text-lg">Próximos Eventos Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {eventosPendentes.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">Nenhum evento pendente.</div>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {eventosPendentes.map(e => (
                  <li key={e.id} className="p-4 hover:bg-gray-50 flex items-start gap-3">
                    <button onClick={() => handleToggleConcluido(e.id, e.concluido)} className="mt-1 text-gray-400 hover:text-emerald-600 transition-colors">
                      <Circle className="h-5 w-5" />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{e.titulo}</span>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{formatDate(e.dataHora)}</span>
                      </div>
                      {e.bovino && <p className="text-xs text-gray-500 mt-1">Animal: {e.bovino.brinco} {e.bovino.nome ? `(${e.bovino.nome})` : ""}</p>}
                    </div>
                    <Badge variant="outline" className={prioridadeColors[e.prioridade]}>{e.prioridade}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm md:col-span-2">
          <CardHeader className="bg-gray-50/50 pb-3 border-b border-gray-100">
            <CardTitle className="text-gray-600 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Últimos Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {eventosConcluidos.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">Nenhum histórico recente.</div>
            ) : (
              <ul className="divide-y divide-gray-100 opacity-60 hover:opacity-100 transition-opacity">
                {eventosConcluidos.map(e => (
                  <li key={e.id} className="p-3 flex items-center gap-3">
                    <button onClick={() => handleToggleConcluido(e.id, e.concluido)} className="text-emerald-500">
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                    <span className="flex-1 line-through text-gray-500">{e.titulo} ({formatDate(e.dataHora)})</span>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600 h-8 px-2">Excluir</Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
