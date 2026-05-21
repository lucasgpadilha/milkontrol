"use client";

import { useEffect, useState } from "react";
import { Loader2, CalendarRange, Plus, Info, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useFazendaAtiva } from "@/components/fazenda-context";
import Link from "next/link";

export default function IATFPage() {
  const { fazendaAtiva, todasSelecionadas } = useFazendaAtiva();
  const [lotes, setLotes] = useState<any[]>([]);
  const [protocolos, setProtocolos] = useState<any[]>([]);
  const [vacas, setVacas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"LOTES" | "PROTOCOLOS">("LOTES");

  const [form, setForm] = useState({
    nome: "",
    dataInicio: new Date().toISOString().split("T")[0],
    protocoloId: "",
    bovinosIds: [] as string[],
  });

  const fetchData = async () => {
    try {
      const [lotesRes, protRes, vacasRes] = await Promise.all([
        fetch("/api/iatf/lotes"),
        fetch("/api/iatf/protocolos"),
        fetch("/api/bovinos?sexo=FEMEA"),
      ]);
      if (lotesRes.ok) setLotes(await lotesRes.json());
      if (protRes.ok) setProtocolos(await protRes.json());
      if (vacasRes.ok) setVacas(await vacasRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fazendaAtiva]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.bovinosIds.length === 0) {
      alert("Selecione pelo menos um animal para o lote.");
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch("/api/iatf/lotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        setForm({ nome: "", dataInicio: new Date().toISOString().split("T")[0], protocoloId: "", bovinosIds: [] });
        fetchData();
        alert("Lote IATF criado! Os eventos foram adicionados à sua Agenda.");
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao criar lote");
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleVaca = (id: string) => {
    setForm(prev => ({
      ...prev,
      bovinosIds: prev.bovinosIds.includes(id) 
        ? prev.bovinosIds.filter(bId => bId !== id)
        : [...prev.bovinosIds, id]
    }));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-pink-600" /></div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/reproducao" className="text-sm font-medium text-pink-600 hover:underline">← Voltar para Reprodução</Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-100 shadow-sm">
              <CalendarRange className="h-5 w-5 text-pink-600" />
            </div>
            Automação IATF
          </h1>
          <p className="mt-1 text-gray-500">Inseminação Artificial em Tempo Fixo</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} disabled={todasSelecionadas} className="bg-pink-600 hover:bg-pink-700">
          <Plus className="h-4 w-4 mr-2" /> Iniciar Novo Lote
        </Button>
      </div>

      {showForm && !todasSelecionadas && (
        <Card className="border-pink-200 shadow-sm">
          <CardHeader className="bg-pink-50/50 pb-4 border-b border-pink-100">
            <CardTitle className="text-lg text-pink-900">Iniciar Novo Protocolo (Lote)</CardTitle>
            <CardDescription>O sistema agendará automaticamente as aplicações para cada vaca selecionada.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Lote *</Label>
                  <Input placeholder="Ex: Lote Seca Maio/26" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Data de Início (D0) *</Label>
                  <Input type="date" value={form.dataInicio} onChange={e => setForm({ ...form, dataInicio: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Protocolo a ser usado *</Label>
                  <select
                    value={form.protocoloId}
                    onChange={(e) => setForm({ ...form, protocoloId: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-pink-500/20"
                    required
                  >
                    <option value="">Selecione um protocolo...</option>
                    {protocolos.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {form.protocoloId && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2 text-sm text-blue-800">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>{protocolos.find(p => p.id === form.protocoloId)?.nome}</strong>: 
                    Este protocolo possui {protocolos.find(p => p.id === form.protocoloId)?.etapas.length} etapas. 
                    Ao salvar, <strong>{protocolos.find(p => p.id === form.protocoloId)?.etapas.length * form.bovinosIds.length}</strong> eventos serão adicionados à agenda da fazenda.
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex justify-between">
                  <span>Selecionar Animais (Vacas/Novilhas) *</span>
                  <span className="text-pink-600 font-semibold">{form.bovinosIds.length} selecionados</span>
                </Label>
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto p-2 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {vacas.map(v => {
                      const isSelected = form.bovinosIds.includes(v.id);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => toggleVaca(v.id)}
                          className={`flex items-center gap-2 p-2 rounded-md border text-sm text-left transition-colors ${
                            isSelected ? "bg-pink-100 border-pink-300 text-pink-900" : "bg-white border-gray-200 hover:border-pink-200"
                          }`}
                        >
                          <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${isSelected ? "border-pink-600 bg-pink-600" : "border-gray-300"}`}>
                            {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                          <span className="truncate">{v.brinco} {v.nome ? `(${v.nome})` : ""}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar IATF e Agendar Eventos"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex border-b border-gray-200">
        <button
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === "LOTES" ? "border-pink-600 text-pink-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("LOTES")}
        >
          Lotes em Andamento
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === "PROTOCOLOS" ? "border-pink-600 text-pink-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("PROTOCOLOS")}
        >
          Modelos de Protocolos
        </button>
      </div>

      {activeTab === "LOTES" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lotes.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Nenhum lote de IATF registrado.
            </div>
          ) : (
            lotes.map(lote => (
              <Card key={lote.id} className="overflow-hidden shadow-sm">
                <CardHeader className="bg-pink-50/30 pb-3 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-gray-900">{lote.nome}</CardTitle>
                      <CardDescription className="mt-1">
                        Iniciado em {formatDate(lote.dataInicio)}
                      </CardDescription>
                    </div>
                    <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">{lote.animais.length} Animais</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Protocolo: {lote.protocolo.nome}</div>
                    <div className="flex gap-1 overflow-x-auto pb-2">
                      {lote.protocolo.etapas.map((etapa: any, idx: number) => {
                        const d = new Date(lote.dataInicio);
                        d.setDate(d.getDate() + etapa.dia);
                        const isPast = d < new Date();
                        const isToday = d.toISOString().split("T")[0] === new Date().toISOString().split("T")[0];
                        return (
                          <div key={etapa.id} className={`shrink-0 flex flex-col items-center p-2 rounded-lg border text-xs min-w-[100px] ${isToday ? "bg-amber-50 border-amber-300 ring-1 ring-amber-300" : isPast ? "bg-gray-50 border-gray-200 text-gray-500" : "bg-white border-gray-200"}`}>
                            <span className="font-bold">D{etapa.dia}</span>
                            <span className="font-medium truncate w-full text-center" title={etapa.titulo}>{etapa.titulo}</span>
                            <span className="mt-1 opacity-75">{d.toLocaleDateString("pt-BR", {day: "2-digit", month: "2-digit"})}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Animais no Lote</div>
                    <div className="flex flex-wrap gap-1">
                      {lote.animais.map((a: any) => (
                        <Badge key={a.id} variant="outline" className="bg-gray-50 text-xs">
                          {a.bovino.brinco}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "PROTOCOLOS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {protocolos.map(prot => (
            <Card key={prot.id} className="border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  {prot.nome}
                  {!prot.fazendaId && <Badge variant="secondary" className="text-[10px]">Padrão do Sistema</Badge>}
                </CardTitle>
                {prot.descricao && <CardDescription>{prot.descricao}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mt-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Linha do Tempo (Etapas)</div>
                  <ul className="space-y-2">
                    {prot.etapas.map((etapa: any) => (
                      <li key={etapa.id} className="flex gap-3 items-start text-sm">
                        <div className="bg-pink-100 text-pink-800 font-bold px-2 py-0.5 rounded text-xs shrink-0 w-10 text-center">D{etapa.dia}</div>
                        <div>
                          <div className="font-medium text-gray-900">{etapa.titulo}</div>
                          {etapa.descricao && <div className="text-gray-500 text-xs">{etapa.descricao}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
