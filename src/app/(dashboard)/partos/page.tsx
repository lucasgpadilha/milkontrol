"use client";

import { useEffect, useState } from "react";
import { Loader2, Baby, AlertCircle, Plus, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Hint } from "@/components/hint";
import { formatDate } from "@/lib/utils";
import { useFazendaAtiva } from "@/components/fazenda-context";

interface Parto {
  id: string;
  data: string;
  tipoParto: string;
  pesoBezerroKg: number | null;
  sexoBezerro: string | null;
  colostroFornecido: boolean;
  gemelar: boolean;
  observacoes: string | null;
  bovino: { brinco: string; nome: string | null };
  bezerro: { brinco: string; nome: string | null } | null;
}

export default function PartosPage() {
  const { fazendaAtiva, todasSelecionadas } = useFazendaAtiva();
  const [partos, setPartos] = useState<Parto[]>([]);
  const [vacas, setVacas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    tipoParto: "NORMAL",
    pesoBezerroKg: "",
    sexoBezerro: "",
    colostroFornecido: false,
    gemelar: false,
    observacoes: "",
    bovinoId: "",
  });

  const fetchData = async () => {
    try {
      const [partosRes, vacasRes] = await Promise.all([
        fetch("/api/partos"),
        fetch("/api/bovinos?sexo=FEMEA"),
      ]);
      if (partosRes.ok) setPartos(await partosRes.json());
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
    setSaving(true);
    try {
      const res = await fetch("/api/partos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        setForm({
          data: new Date().toISOString().split("T")[0],
          tipoParto: "NORMAL", pesoBezerroKg: "", sexoBezerro: "",
          colostroFornecido: false, gemelar: false, observacoes: "", bovinoId: ""
        });
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao registrar parto");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-100 shadow-sm">
              <Baby className="h-5 w-5 text-pink-600" />
            </div>
            Gestão de Partos
          </h1>
          <p className="mt-1 text-gray-500">Acompanhamento de nascimentos e colostragem</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} disabled={todasSelecionadas} className="bg-pink-600 hover:bg-pink-700">
          <Plus className="h-4 w-4 mr-2" /> Registrar Parto
        </Button>
      </div>

      <Hint id="partos-colostro" title="Importância do Colostro">
        Bezerros devem receber 10% do seu peso vivo em colostro de alta qualidade (Brix &gt; 22%) <strong>nas primeiras 6 horas</strong> de vida para garantir imunidade adequada.
      </Hint>

      {showForm && !todasSelecionadas && (
        <Card className="border-pink-200 shadow-sm">
          <CardHeader className="bg-pink-50/50 pb-4">
            <CardTitle className="text-lg text-pink-900">Registrar Nascimento</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data do Parto *</Label>
                  <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Vaca Mãe *</Label>
                  <select
                    value={form.bovinoId}
                    onChange={(e) => setForm({ ...form, bovinoId: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-pink-500/20"
                    required
                  >
                    <option value="">Selecione...</option>
                    {vacas.map(v => (
                      <option key={v.id} value={v.id}>{v.brinco} {v.nome ? `- ${v.nome}` : ""}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Parto *</Label>
                  <select
                    value={form.tipoParto}
                    onChange={(e) => setForm({ ...form, tipoParto: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="NORMAL">Normal / Eutócico</option>
                    <option value="DISTOCICO">Distócico (Com Auxílio)</option>
                    <option value="CESAREA">Cesárea</option>
                    <option value="ABORTO">Aborto</option>
                    <option value="NATIMORTO">Natimorto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Sexo do Bezerro</Label>
                  <select
                    value={form.sexoBezerro}
                    onChange={(e) => setForm({ ...form, sexoBezerro: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Desconhecido / N/A</option>
                    <option value="FEMEA">Fêmea</option>
                    <option value="MACHO">Macho</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Peso Nascer (Kg)</Label>
                  <Input type="number" step="0.5" placeholder="Ex: 38" value={form.pesoBezerroKg} onChange={e => setForm({ ...form, pesoBezerroKg: e.target.value })} />
                </div>
                <div className="space-y-2 flex items-center pt-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.colostroFornecido} onChange={e => setForm({ ...form, colostroFornecido: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-600" />
                    <span className="text-sm font-medium text-gray-700">Colostro Fornecido</span>
                  </label>
                </div>
                <div className="space-y-2 flex items-center pt-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.gemelar} onChange={e => setForm({ ...form, gemelar: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-600" />
                    <span className="text-sm font-medium text-gray-700">Parto Gemelar</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input placeholder="Complicações, retenção de placenta, etc." value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Parto"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Nascimentos</CardTitle>
          <CardDescription>Acompanhe os partos e a saúde inicial dos bezerros.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Mãe</th>
                  <th>Tipo</th>
                  <th>Cria (Bezerro)</th>
                  <th>Colostro</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {partos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">Nenhum parto registrado nesta fazenda.</td>
                  </tr>
                ) : partos.map(p => (
                  <tr key={p.id}>
                    <td>{formatDate(p.data)}</td>
                    <td className="font-semibold text-gray-900">{p.bovino.brinco} {p.bovino.nome ? `(${p.bovino.nome})` : ""}</td>
                    <td>
                      <Badge variant={p.tipoParto === "NORMAL" ? "secondary" : "destructive"}>
                        {p.tipoParto} {p.gemelar && "(Gemelar)"}
                      </Badge>
                    </td>
                    <td>
                      {p.tipoParto === "ABORTO" ? (
                        <span className="text-gray-400 italic">Aborto</span>
                      ) : p.bezerro ? (
                        <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                          Brinco: {p.bezerro.brinco}
                        </Badge>
                      ) : (
                        <span className="text-gray-600 text-sm">
                          {p.sexoBezerro === "FEMEA" ? "Fêmea" : p.sexoBezerro === "MACHO" ? "Macho" : "N/A"}
                          {p.pesoBezerroKg ? ` • ${p.pesoBezerroKg}kg` : ""}
                          <br/><span className="text-xs text-amber-600">Não cadastrado no rebanho</span>
                        </span>
                      )}
                    </td>
                    <td>
                      {p.tipoParto === "ABORTO" || p.tipoParto === "NATIMORTO" ? "—" : 
                        p.colostroFornecido ? (
                          <span className="text-emerald-600 flex items-center gap-1 text-sm font-medium"><CheckCircle2 className="h-4 w-4" /> Sim</span>
                        ) : (
                          <span className="text-red-500 flex items-center gap-1 text-sm font-medium"><AlertCircle className="h-4 w-4" /> Não (Alerta)</span>
                        )
                      }
                    </td>
                    <td className="text-gray-500 max-w-[200px] truncate" title={p.observacoes || ""}>
                      {p.observacoes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
