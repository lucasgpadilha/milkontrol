"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Activity, Syringe, Heart, Milk, Calendar, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate, estaEmCarencia } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface CarenciaInfo { estaEmCarencia: boolean; dataFim: string | null; }

interface BovinoDetalhe {
  id: string;
  brinco: string;
  nome: string | null;
  raca: string;
  dataNascimento: string;
  sexo: "MACHO" | "FEMEA";
  situacao: string;
  idadeMeses: number;
  piquete: { nome: string } | null;
  lactacoes: { id: string; inicio: string; fim: string | null }[];
  producoes: { id: string; data: string; quantidade: number; turno: string }[];
  inseminacoes: {
    id: string; data: string; tipo: string; prenhez: boolean | null;
    veterinario?: { nome: string } | null;
    bancoSemen?: { codigo: string; nomeTouro: string } | null;
    touroSemen: string | null;
  }[];
  registrosSanitarios: {
    id: string; data: string; tipo: string; produto: string;
    diasCarencia: number; fimCarencia: string | null;
    responsavel: string | null;
    veterinario?: { nome: string } | null;
  }[];
  pesagens: {
    id: string; data: string; pesoKg: number; observacoes: string | null;
  }[];
}

export default function FichaAnimalPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [bovino, setBovino] = useState<BovinoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"resumo" | "lactacao" | "reproducao" | "sanitario" | "fisico">("resumo");

  const [formPesagem, setFormPesagem] = useState({
    data: new Date().toISOString().split("T")[0],
    pesoKg: "",
    observacoes: "",
    bovinoId: id
  });
  const [savingPesagem, setSavingPesagem] = useState(false);

  const fetchDetalhes = () => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/bovinos/${id}/detalhes`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setBovino(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetalhes();
  }, [id]);

  const handleSalvarPesagem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPesagem(true);
    try {
      const res = await fetch("/api/pesagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formPesagem,
          pesoKg: parseFloat(formPesagem.pesoKg)
        }),
      });
      if (res.ok) {
        fetchDetalhes();
        setFormPesagem({ ...formPesagem, pesoKg: "", observacoes: "" });
      } else {
        alert("Erro ao registrar pesagem.");
      }
    } catch {
      alert("Erro ao registrar pesagem.");
    } finally {
      setSavingPesagem(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  if (!bovino) return <div className="text-center py-20 text-gray-500">Animal não encontrado ou pertencente a outra fazenda.</div>;

  // Calculando carência atual
  const emCarenciaList = bovino.registrosSanitarios.filter(r => estaEmCarencia(r.fimCarencia));
  const carenciaMaisLonga = emCarenciaList.sort((a, b) => new Date(b.fimCarencia!).getTime() - new Date(a.fimCarencia!).getTime())[0];

  // Identificando vacas reprodutivamente "em dia"
  const ultimaInseminacao = bovino.inseminacoes[0]; // já vem 'desc'

  // Calculando taxa de fertilidade
  const inseminacoesResolvidas = bovino.inseminacoes.filter(i => i.prenhez !== null);
  const prenhes = inseminacoesResolvidas.filter(i => i.prenhez === true).length;
  const taxaFertilidade = inseminacoesResolvidas.length > 0 ? ((prenhes / inseminacoesResolvidas.length) * 100).toFixed(1) : "—";

  // Preparando Gráfico de Lactação (Última lactação)
  const lactacaoAtual = bovino.lactacoes.length > 0 ? bovino.lactacoes[0] : null;
  let chartData: any[] = [];
  let mediaProducao = 0;
  let picoProducao = 0;

  if (lactacaoAtual) {
    const inicioDate = new Date(lactacaoAtual.inicio);
    const fimDate = lactacaoAtual.fim ? new Date(lactacaoAtual.fim) : new Date();

    const producoesValidas = bovino.producoes.filter(p => {
       const pDate = new Date(p.data);
       return pDate >= inicioDate && pDate <= fimDate;
    });

    // Agrupando por dia (caso ordenhe 2x ou 3x dia)
    const agrupadoPorDia: Record<string, number> = {};
    producoesValidas.forEach(p => {
       const dataStr = p.data.split("T")[0];
       agrupadoPorDia[dataStr] = (agrupadoPorDia[dataStr] || 0) + p.quantidade;
    });

    // Gerando array e calculando DEL (Dias em Lactação)
    chartData = Object.keys(agrupadoPorDia).sort().map(dataStr => {
       const currDate = new Date(dataStr);
       const del = Math.floor((currDate.getTime() - inicioDate.getTime()) / (1000 * 3600 * 24));
       const total = Number(agrupadoPorDia[dataStr].toFixed(2));
       if (total > picoProducao) picoProducao = total;
       return { dataOriginal: dataStr, dia: formatDate(dataStr).substring(0, 5), del: `DEL ${del}`, producao: total };
    });

    if (chartData.length > 0) {
       mediaProducao = chartData.reduce((acc, curr) => acc + curr.producao, 0) / chartData.length;
    }
  }

  const TabButton = ({ tabId, icon: Icon, label }: any) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors ${
        activeTab === tabId ? "border-emerald-500 text-emerald-600 bg-emerald-50/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Icon className="h-4 w-4" /> <span className="hidden sm:inline">{label}</span>
    </button>
  );

  const handleDeletePermanent = async () => {
    const userInput = prompt('ATENÇÃO: Ação irreversível.\n\nIsso apagará permanentemente o animal e todos os registros (leite, vacinas, inseminações) do banco de dados.\nSe o animal morreu ou foi vendido, apenas mude a Situação.\n\nPara excluir permanentemente digite "EXCLUIR" abaixo:');
    
    if (userInput === "EXCLUIR") {
      try {
        const res = await fetch(`/api/bovinos/${bovino.id}`, { method: "DELETE" });
        if (res.ok) {
          router.push("/bovinos");
        } else {
          alert("Erro ao excluir animal.");
        }
      } catch (e) {
        alert("Erro ao excluir animal.");
      }
    } else if (userInput !== null) {
      alert("Palavra de confirmação incorreta. Exclusão cancelada.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/bovinos")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
             {bovino.brinco} {bovino.nome ? `— ${bovino.nome}` : ""}
             <Badge variant={bovino.situacao === "ATIVA" ? "default" : "secondary"} className="text-sm shadow-sm">{bovino.situacao}</Badge>
          </h1>
          <p className="mt-1 text-gray-500 text-sm flex items-center gap-2">
             {bovino.sexo === "FEMEA" ? "Fêmea ♀" : "Macho ♂"} • {bovino.raca} • {bovino.idadeMeses} meses • Piquete: <span className="font-medium text-gray-700">{bovino.piquete?.nome || "Sem piquete"}</span>
          </p>
        </div>
      </div>

      {/* Alertas Críticos */}
      {carenciaMaisLonga && (
         <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 animate-fade-in shadow-sm flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
               <h4 className="font-semibold text-amber-800 text-sm">Animal em Carência Medicamentosa</h4>
               <p className="text-sm text-amber-700 mt-1">O leite desta vaca não deve ir para o tanque. Fim da carência: <strong>{formatDate(carenciaMaisLonga.fimCarencia!)}</strong> (Referente ao produto: {carenciaMaisLonga.produto}).</p>
            </div>
         </div>
      )}

      {/* Dashboard Top Cards */}
      <div className="grid gap-4 md:grid-cols-4">
         <Card className="shadow-sm border-gray-100">
            <CardHeader className="p-4 pb-2"><CardDescription className="text-xs font-semibold uppercase tracking-wider text-pink-600">Taxa de Fertilidade</CardDescription></CardHeader>
            <CardContent className="p-4 pt-0">
               <div className="text-3xl font-bold tracking-tight text-pink-900">{taxaFertilidade !== "—" ? `${taxaFertilidade}%` : "—"}</div>
               {taxaFertilidade !== "—" && <p className="text-xs text-gray-500 mt-1">{prenhes} acertos em {inseminacoesResolvidas.length} tentativas</p>}
            </CardContent>
         </Card>
         <Card className="shadow-sm border-gray-100">
            <CardHeader className="p-4 pb-2"><CardDescription className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Status Reprodutivo</CardDescription></CardHeader>
            <CardContent className="p-4 pt-0">
               <div className="text-lg font-bold tracking-tight text-emerald-900 line-clamp-1">
                 {!ultimaInseminacao ? "Virgem / Não Registrada" 
                  : ultimaInseminacao.prenhez === null ? "Diagnóstico Pendente"
                  : ultimaInseminacao.prenhez ? "Prenhe ✓" : "Vazia ✗"}
               </div>
               {ultimaInseminacao && <p className="text-xs text-gray-500 mt-1">Última tentativa: {formatDate(ultimaInseminacao.data)}</p>}
            </CardContent>
         </Card>
         <Card className="shadow-sm border-gray-100">
            <CardHeader className="p-4 pb-2"><CardDescription className="text-xs font-semibold uppercase tracking-wider text-blue-600">Média de Produção (Ciclo)</CardDescription></CardHeader>
            <CardContent className="p-4 pt-0">
               <div className="text-3xl font-bold tracking-tight text-blue-900">{bovino.sexo === "FEMEA" ? (mediaProducao > 0 ? mediaProducao.toFixed(1) : "—") : "N/A"}<span className="text-base font-normal text-gray-500 ml-1">L/dia</span></div>
            </CardContent>
         </Card>
         <Card className="shadow-sm border-gray-100">
            <CardHeader className="p-4 pb-2"><CardDescription className="text-xs font-semibold uppercase tracking-wider text-purple-600">Pico de Lactação</CardDescription></CardHeader>
            <CardContent className="p-4 pt-0">
               <div className="text-3xl font-bold tracking-tight text-purple-900">{bovino.sexo === "FEMEA" ? (picoProducao > 0 ? picoProducao.toFixed(1) : "—") : "N/A"}<span className="text-base font-normal text-gray-500 ml-1">L</span></div>
            </CardContent>
         </Card>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar">
          <TabButton tabId="resumo" icon={Activity} label="Curva de Lactação" />
          <TabButton tabId="reproducao" icon={Heart} label="Reprodutivo" />
          <TabButton tabId="sanitario" icon={Syringe} label="Sanitário" />
          <TabButton tabId="fisico" icon={Activity} label="Físico/Peso" />
        </div>

        <div className="p-6">
          {activeTab === "resumo" && (
            <div className="animate-fade-in space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Gráfico de Lactação</h3>
                {lactacaoAtual && (
                  <Badge variant="secondary" className="font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                     Início: {formatDate(lactacaoAtual.inicio)} {lactacaoAtual.fim ? `— Fim: ${formatDate(lactacaoAtual.fim)}` : "— Em andamento"}
                  </Badge>
                )}
              </div>
              
              {bovino.sexo === "MACHO" ? (
                 <div className="py-12 text-center text-gray-400">
                    <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>Machos não possuem curva de lactação.</p>
                 </div>
              ) : chartData.length === 0 ? (
                 <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>Faltam dados de produção de leite. Inicie uma lactação e registre ordenhas no menu "Produção de Leite".</p>
                 </div>
              ) : (
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} dy={10} minTickGap={20} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                        formatter={(val: any) => [`${val} L`, 'Litragem Diária']}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.del ? `${label} (${payload[0].payload.del})` : label}
                      />
                      <Area type="monotone" dataKey="producao" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProd)" activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {activeTab === "reproducao" && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Heart className="h-5 w-5 text-gray-400" /> Histórico de Inseminações</h3>
              {bovino.inseminacoes.length === 0 ? (
                <p className="text-gray-500 py-4">Sem registros reprodutivos.</p>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                      <tr><th className="px-4 py-3 font-medium">Data</th><th className="px-4 py-3 font-medium">Situação</th><th className="px-4 py-3 font-medium">Sêmen/Touro</th><th className="px-4 py-3 font-medium">Veterinário/Resp.</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bovino.inseminacoes.map(ins => (
                        <tr key={ins.id} className="bg-white hover:bg-gray-50/50">
                          <td className="px-4 py-3">{formatDate(ins.data)}</td>
                          <td className="px-4 py-3">
                            {ins.prenhez === null ? <Badge variant="warning">Pendente</Badge> : ins.prenhez ? <Badge variant="success">Prenhe</Badge> : <Badge variant="destructive">Vazia</Badge>}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {ins.bancoSemen ? <span className="text-blue-700">{ins.bancoSemen.codigo} - {ins.bancoSemen.nomeTouro}</span> : (ins.touroSemen || "—")}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{ins.veterinario?.nome || "Registro Manual"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "sanitario" && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Syringe className="h-5 w-5 text-gray-400" /> Histórico de Vacinas & Cuidados</h3>
              {bovino.registrosSanitarios.length === 0 ? (
                <p className="text-gray-500 py-4">Sem registros sanitários.</p>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 font-medium">Data</th>
                        <th className="px-4 py-3 font-medium">Ação/Tipo</th>
                        <th className="px-4 py-3 font-medium">Produto</th>
                        <th className="px-4 py-3 font-medium">Veterinário / Resp.</th>
                        <th className="px-4 py-3 font-medium">Carência</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bovino.registrosSanitarios.map(reg => (
                        <tr key={reg.id} className="bg-white hover:bg-gray-50/50">
                          <td className="px-4 py-3">{formatDate(reg.data)}</td>
                          <td className="px-4 py-3"><Badge variant="outline">{reg.tipo}</Badge></td>
                          <td className="px-4 py-3 font-medium text-gray-800">{reg.produto}</td>
                          <td className="px-4 py-3">
                             {reg.veterinario ? (
                               <span className="font-medium text-emerald-700">{reg.veterinario.nome}</span>
                             ) : (
                               reg.responsavel || "—"
                             )}
                          </td>
                          <td className="px-4 py-3">
                            {reg.fimCarencia ? (
                               estaEmCarencia(reg.fimCarencia) ? <span className="text-amber-600 font-medium">Até {formatDate(reg.fimCarencia)}</span> : <span className="text-gray-400">Encerrada</span>
                            ) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "fisico" && (
            <div className="animate-fade-in space-y-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-gray-400" /> Acompanhamento de Peso</h3>
              
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="py-4">
                  <CardTitle className="text-base text-emerald-800">Nova Pesagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSalvarPesagem} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Data</label>
                      <input type="date" required value={formPesagem.data} onChange={(e) => setFormPesagem({...formPesagem, data: e.target.value})} className="flex h-9 w-full rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Peso (Kg)</label>
                      <input type="number" step="0.1" required value={formPesagem.pesoKg} onChange={(e) => setFormPesagem({...formPesagem, pesoKg: e.target.value})} placeholder="Ex: 450" className="flex h-9 w-full rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Observações</label>
                      <input type="text" value={formPesagem.observacoes} onChange={(e) => setFormPesagem({...formPesagem, observacoes: e.target.value})} placeholder="Opcional" className="flex h-9 w-full rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" disabled={savingPesagem} className="w-full text-sm h-9">
                        {savingPesagem ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar Peso"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {bovino.pesagens.length === 0 ? (
                <p className="text-gray-500 py-4">Sem histórico de peso registrado.</p>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 font-medium">Data</th>
                        <th className="px-4 py-3 font-medium">Peso (Kg)</th>
                        <th className="px-4 py-3 font-medium">Observações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bovino.pesagens.map(p => (
                        <tr key={p.id} className="bg-white hover:bg-gray-50/50">
                          <td className="px-4 py-3">{formatDate(p.data)}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{p.pesoKg} kg</td>
                          <td className="px-4 py-3 text-gray-600">{p.observacoes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-12 rounded-xl border border-red-200 bg-white overflow-hidden animate-fade-in shadow-sm">
        <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="font-semibold text-red-900">Danger Zone (Cuidado)</h3>
        </div>
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="font-medium text-gray-900">Excluir registro permanentemente</h4>
            <p className="text-sm text-gray-500 mt-1">Isso apagará o histórico inteiro do animal no banco de dados. Só use isto em caso de erro de digitação/cadastro indevido.</p>
          </div>
          <Button variant="destructive" onClick={handleDeletePermanent} className="shrink-0 bg-red-600 hover:bg-red-700">
            Excluir Bovino
          </Button>
        </div>
      </div>
    </div>
  );
}
