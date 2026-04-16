"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface FazendaResumo {
  id: string;
  nome: string;
  ordenhasDia: number;
  papel: string;
  _count?: { bovinos: number };
}

interface FazendaContextType {
  fazendas: FazendaResumo[];
  fazendaAtiva: FazendaResumo | null;
  papelAtivo: string | null;
  todasSelecionadas: boolean;
  carregando: boolean;
  selecionarFazenda: (fazendaId: string | "todas") => Promise<void>;
}

const FazendaContext = createContext<FazendaContextType>({
  fazendas: [],
  fazendaAtiva: null,
  papelAtivo: null,
  todasSelecionadas: true,
  carregando: true,
  selecionarFazenda: async () => {},
});

export function useFazendaAtiva() {
  return useContext(FazendaContext);
}

export function FazendaProvider({ children }: { children: React.ReactNode }) {
  const [fazendas, setFazendas] = useState<FazendaResumo[]>([]);
  const [fazendaAtiva, setFazendaAtiva] = useState<FazendaResumo | null>(null);
  const [papelAtivo, setPapelAtivo] = useState<string | null>(null);
  const [todasSelecionadas, setTodasSelecionadas] = useState(true);
  const [carregando, setCarregando] = useState(true);

  const carregarFazendas = useCallback(async () => {
    try {
      const [fazRes, ativaRes] = await Promise.all([
        fetch("/api/fazendas"),
        fetch("/api/fazenda-ativa"),
      ]);

      const fazendasData = await fazRes.json();
      const ativaData = await ativaRes.json();

      setFazendas(fazendasData);

      if (ativaData.fazendaId && ativaData.fazendaId !== "todas") {
        const ativa = fazendasData.find((f: FazendaResumo) => f.id === ativaData.fazendaId);
        if (ativa) {
          setFazendaAtiva(ativa);
          setPapelAtivo(ativa.papel);
          setTodasSelecionadas(false);
        } else {
          setFazendaAtiva(null);
          setPapelAtivo("PROPRIETARIO"); // Fallback for "todas"
          setTodasSelecionadas(true);
        }
      } else {
        setFazendaAtiva(null);
        setPapelAtivo("PROPRIETARIO"); // Se vê todas, assume proprietario (ou o papel primario)
        setTodasSelecionadas(true);
      }
    } catch {
      // silently fail
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarFazendas();
  }, [carregarFazendas]);

  const selecionarFazenda = useCallback(
    async (fazendaId: string | "todas") => {
      await fetch("/api/fazenda-ativa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fazendaId }),
      });

      if (fazendaId === "todas") {
        setFazendaAtiva(null);
        setPapelAtivo("PROPRIETARIO");
        setTodasSelecionadas(true);
      } else {
        const ativa = fazendas.find((f) => f.id === fazendaId);
        setFazendaAtiva(ativa || null);
        setPapelAtivo(ativa?.papel || null);
        setTodasSelecionadas(false);
      }

      // Recarregar a página para atualizar os dados
      window.location.reload();
    },
    [fazendas]
  );

  return (
    <FazendaContext.Provider
      value={{ fazendas, fazendaAtiva, papelAtivo, todasSelecionadas, carregando, selecionarFazenda }}
    >
      {children}
    </FazendaContext.Provider>
  );
}
