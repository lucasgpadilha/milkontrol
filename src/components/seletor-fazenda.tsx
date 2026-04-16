"use client";

import { useState, useRef, useEffect } from "react";
import { useFazendaAtiva } from "@/components/fazenda-context";
import {
  Warehouse,
  ChevronDown,
  Check,
  BarChart3,
  Settings,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SeletorFazendaProps {
  collapsed?: boolean;
}

export function SeletorFazenda({ collapsed }: SeletorFazendaProps) {
  const { fazendas, fazendaAtiva, todasSelecionadas, carregando, selecionarFazenda } =
    useFazendaAtiva();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (carregando) {
    return (
      <div className="mx-3 my-2 flex items-center justify-center rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (fazendas.length === 0) {
    return (
      <Link
        href="/fazendas"
        className="mx-3 my-2 flex items-center gap-2 rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-2.5 text-sm text-emerald-600 transition-colors hover:bg-emerald-50"
      >
        <Warehouse className="h-4 w-4" />
        {!collapsed && <span className="font-medium">Cadastrar Fazenda</span>}
      </Link>
    );
  }

  const nomeExibido = todasSelecionadas
    ? "Todas as Fazendas"
    : fazendaAtiva?.nome || "Selecionar";

  if (collapsed) {
    return (
      <button
        onClick={() => setAberto(!aberto)}
        className="relative mx-auto my-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100"
        title={nomeExibido}
      >
        <Warehouse className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div ref={ref} className="relative mx-3 my-2">
      {/* Botão principal */}
      <button
        onClick={() => setAberto(!aberto)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
          aberto
            ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-500/20"
            : "border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
        )}
        id="seletor-fazenda-btn"
      >
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
            todasSelecionadas
              ? "bg-purple-100 text-purple-600"
              : "bg-emerald-100 text-emerald-600"
          )}
        >
          {todasSelecionadas ? (
            <BarChart3 className="h-3.5 w-3.5" />
          ) : (
            <Warehouse className="h-3.5 w-3.5" />
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate font-medium text-gray-900">{nomeExibido}</p>
          {!todasSelecionadas && fazendaAtiva && (
            <p className="truncate text-xs text-gray-400">
              {fazendaAtiva.ordenhasDia}x ordenha/dia
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-gray-400 transition-transform",
            aberto && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {aberto && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 animate-fade-in rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {/* Lista de fazendas */}
          {fazendas.map((f) => {
            const isAtiva = fazendaAtiva?.id === f.id && !todasSelecionadas;
            return (
              <button
                key={f.id}
                onClick={() => {
                  selecionarFazenda(f.id);
                  setAberto(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                  isAtiva
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Warehouse className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="flex-1 truncate text-left">{f.nome}</span>
                {isAtiva && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
              </button>
            );
          })}

          {/* Separador */}
          <div className="my-1 border-t border-gray-100" />

          {/* Todas as fazendas */}
          <button
            onClick={() => {
              selecionarFazenda("todas");
              setAberto(false);
            }}
            className={cn(
              "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
              todasSelecionadas
                ? "bg-purple-50 text-purple-700"
                : "text-gray-700 hover:bg-gray-50"
            )}
          >
            <BarChart3 className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="flex-1 text-left">Todas as Fazendas</span>
            {todasSelecionadas && <Check className="h-4 w-4 shrink-0 text-purple-600" />}
          </button>

          {/* Separador */}
          <div className="my-1 border-t border-gray-100" />

          {/* Gerenciar */}
          <Link
            href="/fazendas"
            onClick={() => setAberto(false)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Gerenciar Fazendas</span>
          </Link>
        </div>
      )}
    </div>
  );
}
