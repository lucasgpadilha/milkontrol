import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR");
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("pt-BR");
}

export function formatNumber(num: number, decimals = 1): string {
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function calcularDEL(inicioLactacao: Date | string): number {
  const inicio = new Date(inicioLactacao);
  const hoje = new Date();
  const diffMs = hoje.getTime() - inicio.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function estaEmCarencia(fimCarencia: Date | string | null): boolean {
  if (!fimCarencia) return false;
  return new Date(fimCarencia) > new Date();
}
