"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  ArrowLeft, Check, ChevronRight, Loader2, Search, 
  AlertTriangle, Heart, Bug, Thermometer, Wifi, WifiOff,
  Delete, Filter, Undo2
} from "lucide-react";
import Link from "next/link";
import { fetchWithOfflineFallback } from "@/lib/offline-queue";
import { useFazendaAtiva } from "@/components/fazenda-context";

// ─── Types ───────────────────────────────────────────────────────────

interface VacaOrdenha {
  id: string;
  brinco: string;
  nome: string | null;
  raca: string;
  piquete: { id: string; nome: string } | null;
  del: number;
  media7d: number;
  jaRegistrada: boolean;
  valorRegistrado: number | null;
  emCarencia: boolean;
  carenciaInfo: { produto: string; fimCarencia: string } | null;
  ordemOntem: number;
}

type AlertaRapido = "SAUDE" | "UBERE" | "COMPORTAMENTO" | "CLAUDICACAO";

const ALERTA_ICONS: Record<AlertaRapido, { icon: typeof Heart; label: string; color: string }> = {
  SAUDE:         { icon: Thermometer, label: "Saúde",        color: "text-red-400 border-red-500/30 bg-red-500/10" },
  UBERE:         { icon: Heart,       label: "Úbere",        color: "text-pink-400 border-pink-500/30 bg-pink-500/10" },
  COMPORTAMENTO: { icon: Bug,         label: "Comportamento", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  CLAUDICACAO:   { icon: AlertTriangle, label: "Mancando",   color: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
};

// ─── Helper: Turno automático ────────────────────────────────────────

function getTurnoAtual(ordenhasDia: number): string {
  const hora = new Date().getHours();
  if (ordenhasDia >= 3) {
    if (hora < 10) return "MANHA";
    if (hora < 17) return "TARDE";
    return "NOITE";
  }
  return hora < 14 ? "MANHA" : "TARDE";
}

const TURNO_LABEL: Record<string, string> = {
  MANHA: "Manhã ☀️",
  TARDE: "Tarde 🌤️",
  NOITE: "Noite 🌙",
};

// ─── Teclado Numérico Custom ─────────────────────────────────────────

function NumericKeypad({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (val: string) => void; 
}) {
  const handleKey = (key: string) => {
    if (navigator.vibrate) navigator.vibrate(30); // haptic sutil

    if (key === "⌫") {
      onChange(value.slice(0, -1));
    } else if (key === ".") {
      if (!value.includes(".")) onChange(value + ".");
    } else {
      // Max 2 decimais
      const parts = value.split(".");
      if (parts[1] && parts[1].length >= 1) return;
      // Max 3 dígitos inteiros
      if (!value.includes(".") && parts[0].length >= 3) return;
      onChange(value + key);
    }
  };

  const keys = ["1","2","3","4","5","6","7","8","9",".","0","⌫"];

  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => handleKey(key)}
          className={`h-16 rounded-xl text-2xl font-bold transition-all active:scale-95 select-none
            ${key === "⌫" 
              ? "bg-slate-800 text-red-400 border border-slate-700 active:bg-red-500/20" 
              : "bg-slate-800 text-slate-100 border border-slate-700 active:bg-emerald-500/20 active:border-emerald-500/50"
            }`}
        >
          {key === "⌫" ? <Delete className="h-6 w-6 mx-auto" /> : key}
        </button>
      ))}
    </div>
  );
}

// ─── Componente Principal ────────────────────────────────────────────

export default function ModoOrdenhaPage() {
  const { fazendaAtiva } = useFazendaAtiva();
  const ordenhasDia = fazendaAtiva?.ordenhasDia || 2;

  const [vacas, setVacas] = useState<VacaOrdenha[]>([]);
  const [loading, setLoading] = useState(true);
  const [turno, setTurno] = useState(getTurnoAtual(ordenhasDia));
  const [busca, setBusca] = useState("");
  const [piqueteFilter, setPiqueteFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Fase de registro (vaca selecionada)
  const [vacaSelecionada, setVacaSelecionada] = useState<VacaOrdenha | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [alertas, setAlertas] = useState<AlertaRapido[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [online, setOnline] = useState(true);
  const [toastUndo, setToastUndo] = useState<{ id: string, name: string, value: number, timeoutId?: NodeJS.Timeout } | null>(null);

  // ─── Screen Wake Lock (Prevenção de Tela Apagada) ───────────────────
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err: any) {
        // Suprime erros em browsers não suportados
      }
    };
    requestWakeLock();
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      if (wakeLock !== null) wakeLock.release();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // ─── Data Fetching ──────────────────────────────────────────────────

  const fetchVacas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ turno });
      if (piqueteFilter) params.set("piqueteId", piqueteFilter);
      
      const res = await fetch(`/api/producao/ordenha?${params}`);
      if (res.ok) {
        setVacas(await res.json());
      }
    } catch {
      // Offline — manter lista atual
    }
    setLoading(false);
  }, [turno, piqueteFilter]);

  useEffect(() => { fetchVacas(); }, [fetchVacas]);

  // Online status
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ─── Ações ──────────────────────────────────────────────────────────

  const selecionarVaca = (vaca: VacaOrdenha) => {
    if (vaca.emCarencia) return; // Bloqueada
    setVacaSelecionada(vaca);
    setInputValue("");
    setAlertas([]);
    setSaveSuccess(false);
  };

  const toggleAlerta = (tipo: AlertaRapido) => {
    setAlertas(prev => 
      prev.includes(tipo) ? prev.filter(a => a !== tipo) : [...prev, tipo]
    );
  };

  const salvarEProxima = async () => {
    if (!vacaSelecionada || !inputValue) return;
    
    const quantidade = parseFloat(inputValue);
    if (isNaN(quantidade) || quantidade <= 0) return;

    setSaving(true);

    try {
      const res = await fetchWithOfflineFallback("/api/producao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bovinoId: vacaSelecionada.id,
          data: new Date().toISOString().split("T")[0],
          quantidade,
          turno,
          // Alertas salvos como observação (futuro: tabela dedicada)
          observacoes: alertas.length > 0 
            ? `[ALERTA] ${alertas.map(a => ALERTA_ICONS[a].label).join(", ")}` 
            : undefined,
        }),
      });

      if (res.ok || res.status === 0) {
        // Haptic feedback de sucesso
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);

        setSaveSuccess(true);

        // Atualizar lista localmente
        setVacas(prev => prev.map(v => 
          v.id === vacaSelecionada.id 
            ? { ...v, jaRegistrada: true, valorRegistrado: quantidade }
            : v
        ));

        const nomeDisplay = vacaSelecionada.nome ? `${vacaSelecionada.brinco} (${vacaSelecionada.nome})` : vacaSelecionada.brinco;
        const currentId = vacaSelecionada.id;
        
        // Configurar desfazer rápido
        const tid = setTimeout(() => setToastUndo(null), 5000);
        setToastUndo({ id: currentId, name: nomeDisplay, value: quantidade, timeoutId: tid });

        // Após 600ms, ir para próxima vaca pendente
        setTimeout(() => {
          const pendentes = vacas.filter(v => !v.jaRegistrada && v.id !== vacaSelecionada.id && !v.emCarencia);
          if (pendentes.length > 0) {
            selecionarVaca(pendentes[0]);
          } else {
            setVacaSelecionada(null);
            setSaveSuccess(false);
          }
        }, 600);
      }
    } catch {
      // Offline — fetchWithOfflineFallback já enfileirou
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      setSaveSuccess(true);

      const nomeDisplay = vacaSelecionada.nome ? `${vacaSelecionada.brinco} (${vacaSelecionada.nome})` : vacaSelecionada.brinco;
      const tid = setTimeout(() => setToastUndo(null), 5000);
      setToastUndo({ id: vacaSelecionada.id, name: nomeDisplay, value: parseFloat(inputValue), timeoutId: tid });

      setTimeout(() => {
        setVacas(prev => prev.map(v => 
          v.id === vacaSelecionada.id 
            ? { ...v, jaRegistrada: true, valorRegistrado: parseFloat(inputValue) }
            : v
        ));
        const pendentes = vacas.filter(v => !v.jaRegistrada && v.id !== vacaSelecionada.id);
        if (pendentes.length > 0) selecionarVaca(pendentes[0]);
        else { setVacaSelecionada(null); setSaveSuccess(false); }
      }, 600);
    }
    
    setSaving(false);
  };

  const desfazerAcao = () => {
    if (!toastUndo) return;
    clearTimeout(toastUndo.timeoutId);
    
    const vaca = vacas.find(v => v.id === toastUndo.id);
    if (vaca) {
      setVacaSelecionada(vaca);
      setInputValue(toastUndo.value.toString());
      // Remover flag local de registrada para forçar reedição
      setVacas(prev => prev.map(v => v.id === toastUndo.id ? { ...v, jaRegistrada: false, valorRegistrado: null } : v));
    }
    setToastUndo(null);
  };

  // ─── Métricas ───────────────────────────────────────────────────────

  const totalVacas = vacas.length;
  const registradas = vacas.filter(v => v.jaRegistrada).length;
  const pendentes = totalVacas - registradas;
  const piquetes = [...new Set(vacas.filter(v => v.piquete).map(v => JSON.stringify(v.piquete)))].map(p => JSON.parse(p));

  const vacasFiltradas = vacas.filter(v => {
    if (!busca) return true;
    const s = busca.toLowerCase();
    return v.brinco.toLowerCase().includes(s) || (v.nome || "").toLowerCase().includes(s);
  });

  // ─── Validação de valor ─────────────────────────────────────────────

  const valorNum = parseFloat(inputValue);
  const desvio = vacaSelecionada && vacaSelecionada.media7d > 0 && !isNaN(valorNum)
    ? ((valorNum - vacaSelecionada.media7d) / vacaSelecionada.media7d) * 100
    : null;
  const valorSuspeito = desvio !== null && (desvio > 65 || desvio < -65);

  // ═══════════════════════════════════════════════════════════════════
  // TELA DE REGISTRO (vaca selecionada)
  // ═══════════════════════════════════════════════════════════════════

  if (vacaSelecionada) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] text-slate-100 flex flex-col z-50 select-none">
        {/* Flash verde de sucesso */}
        {saveSuccess && (
          <div className="absolute inset-0 bg-emerald-500/15 z-50 flex items-center justify-center animate-pulse pointer-events-none">
            <Check className="h-24 w-24 text-emerald-400" strokeWidth={3} />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <button
            onClick={() => setVacaSelecionada(null)}
            className="flex items-center gap-2 text-slate-400 active:text-white py-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Voltar</span>
          </button>
          <div className="text-right">
            <div className="text-xs text-slate-500">Turno</div>
            <div className="text-sm font-bold text-emerald-400">{TURNO_LABEL[turno]}</div>
          </div>
        </div>

        {/* Vaca Info */}
        <div className="px-4 py-4 border-b border-slate-800/50 shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{vacaSelecionada.brinco}</span>
            {vacaSelecionada.nome && (
              <span className="text-lg text-slate-400">{vacaSelecionada.nome}</span>
            )}
          </div>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-slate-500">
              DEL: <span className="text-slate-300 font-semibold">{vacaSelecionada.del}d</span>
            </span>
            <span className="text-slate-500">
              Média 7d: <span className="text-emerald-400 font-semibold">{vacaSelecionada.media7d}L</span>
            </span>
            <span className="text-slate-500">
              {vacaSelecionada.raca}
            </span>
          </div>
        </div>

        {/* Input Display */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6 min-h-0">
          {/* Valor */}
          <div className="text-center">
            <div className={`text-7xl font-bold tabular-nums tracking-tight transition-colors ${
              valorSuspeito ? "text-amber-400" : inputValue ? "text-white" : "text-slate-600"
            }`}>
              {inputValue || "0"}
              <span className="text-3xl text-slate-500 ml-1">L</span>
            </div>
            
            {/* Alerta de valor suspeito com ícone claro */}
            {valorSuspeito && (
              <div className="mt-2 flex items-center justify-center gap-2 text-amber-400 text-sm animate-pulse font-medium bg-amber-500/10 px-4 py-1.5 rounded-full inline-flex">
                <AlertTriangle className="h-4 w-4" />
                <span>⚠️ Valor fora do padrão ({desvio! > 0 ? "+" : ""}{Math.abs(desvio!).toFixed(0)}%)</span>
              </div>
            )}
          </div>

          <div className="flex-1" /> {/* Empurra o conteúdo interativo para baixo (Thumb Zone) */}

          {/* Alertas Rápidos */}
          <div className="flex gap-2 justify-center">
            {(Object.keys(ALERTA_ICONS) as AlertaRapido[]).map((tipo) => {
              const { icon: Icon, label, color } = ALERTA_ICONS[tipo];
              const ativo = alertas.includes(tipo);
              return (
                <button
                  key={tipo}
                  onClick={() => toggleAlerta(tipo)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all text-xs
                    ${ativo 
                      ? `${color} border-current ring-1 ring-current/30` 
                      : "text-slate-600 border-slate-800 active:border-slate-600"
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Teclado */}
          <NumericKeypad value={inputValue} onChange={setInputValue} />
        </div>

        {/* Botão Salvar (Thumb zone restrita ao final da tela) */}
        <div className="p-4 border-t border-slate-800 shrink-0 bg-[#0a0a0a] pb-6">
          <button
            onClick={salvarEProxima}
            disabled={saving || !inputValue || parseFloat(inputValue) <= 0}
            className={`w-full py-5 rounded-2xl text-xl font-bold transition-all active:scale-[0.98] select-none
              ${(!inputValue || parseFloat(inputValue) <= 0)
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 active:bg-emerald-500"
              }`}
          >
            {saving ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            ) : (
              <>✅ SALVAR E PRÓXIMA</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // TELA PRINCIPAL (Lista de vacas)
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-slate-100 flex flex-col z-50 select-none">
      
      {/* Undo Toast */}
      {toastUndo && !vacaSelecionada && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-800 border border-slate-700 shadow-2xl rounded-xl p-3 flex items-center gap-3 z-[60] animate-in fade-in slide-in-from-top-5">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-200 truncate">{toastUndo.name}</div>
            <div className="text-xs text-slate-400">Salvo: {toastUndo.value}L</div>
          </div>
          <button 
            onClick={desfazerAcao}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold text-white transition-colors"
          >
            <Undo2 className="h-4 w-4" /> Desfazer
          </button>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <Link href="/producao" className="flex items-center gap-2 text-slate-400 active:text-white py-1">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Sair do Modo Ordenha</span>
          </Link>
          <div className="flex items-center gap-2">
            {online ? (
              <Wifi className="h-4 w-4 text-emerald-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-amber-400" />
            )}
          </div>
        </div>

        {/* Turno Selector */}
        <div className="flex gap-2 mb-3">
          {["MANHA", "TARDE", ...(ordenhasDia >= 3 ? ["NOITE"] : [])].map(t => (
            <button
              key={t}
              onClick={() => setTurno(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
                ${t === turno
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-slate-800 text-slate-400 border border-slate-700 active:bg-slate-700"
                }`}
            >
              {TURNO_LABEL[t]}
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${totalVacas > 0 ? (registradas / totalVacas) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm font-bold text-emerald-400 whitespace-nowrap">
            {registradas}/{totalVacas}
          </span>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2 mt-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Brinco ou nome..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          {piquetes.length > 1 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 rounded-xl border transition-all ${
                piqueteFilter 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Piquete Filter Dropdown */}
        {showFilters && piquetes.length > 1 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              onClick={() => { setPiqueteFilter(""); setShowFilters(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !piqueteFilter ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              Todos
            </button>
            {piquetes.map(p => (
              <button
                key={p.id}
                onClick={() => { setPiqueteFilter(p.id); setShowFilters(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  piqueteFilter === p.id ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {p.nome}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Vacas */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : vacasFiltradas.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            {busca ? "Nenhuma vaca encontrada" : "Nenhuma vaca em lactação"}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {vacasFiltradas.map(vaca => (
              <button
                key={vaca.id}
                onClick={() => selecionarVaca(vaca)}
                disabled={vaca.emCarencia}
                className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-all active:bg-slate-800
                  ${vaca.jaRegistrada ? "opacity-50" : ""}
                  ${vaca.emCarencia ? "opacity-30 cursor-not-allowed" : ""}
                `}
              >
                {/* Status indicator */}
                <div className={`w-3 h-3 rounded-full shrink-0 ${
                  vaca.emCarencia ? "bg-red-500" :
                  vaca.jaRegistrada ? "bg-emerald-500" : "bg-slate-600 border-2 border-slate-500"
                }`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-lg">{vaca.brinco}</span>
                    {vaca.nome && <span className="text-sm text-slate-400 truncate">{vaca.nome}</span>}
                  </div>
                  <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                    <span>DEL {vaca.del}d</span>
                    <span>Média {vaca.media7d}L</span>
                    {vaca.piquete && <span>{vaca.piquete.nome}</span>}
                    {vaca.emCarencia && (
                      <span className="text-red-400">⚠ Carência ({vaca.carenciaInfo?.produto})</span>
                    )}
                  </div>
                </div>

                {/* Valor registrado ou seta */}
                {vaca.jaRegistrada ? (
                  <div className="flex items-center gap-1 text-emerald-400">
                    <Check className="h-4 w-4" />
                    <span className="font-bold">{vaca.valorRegistrado?.toFixed(1)}L</span>
                  </div>
                ) : !vaca.emCarencia ? (
                  <ChevronRight className="h-5 w-5 text-slate-600" />
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer com resumo */}
      {pendentes > 0 && (
        <div className="px-4 py-3 border-t border-slate-800 text-center text-sm text-slate-500 shrink-0">
          {pendentes} vaca{pendentes > 1 ? "s" : ""} pendente{pendentes > 1 ? "s" : ""} · Toque para registrar
        </div>
      )}
      {pendentes === 0 && totalVacas > 0 && !loading && (
        <div className="px-4 py-4 border-t border-emerald-500/20 text-center shrink-0">
          <div className="text-emerald-400 font-bold text-lg">✅ Ordenha Completa!</div>
          <div className="text-slate-500 text-sm mt-1">Todas as {totalVacas} vacas registradas neste turno</div>
        </div>
      )}
    </div>
  );
}
