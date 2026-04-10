import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Beef,
  Milk,
  Heart,
  FlaskConical,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { DashboardHints } from "@/components/dashboard-hints";

async function getStats(userId: string) {
  // Get user's farms
  const userFazendas = await prisma.usuarioFazenda.findMany({
    where: { userId },
    select: { fazendaId: true },
  });

  const fazendaIds = userFazendas.map((uf) => uf.fazendaId);

  if (fazendaIds.length === 0) {
    return {
      totalFazendas: 0,
      totalBovinos: 0,
      totalVacas: 0,
      vacasLactacao: 0,
      producaoHoje: 0,
      producaoMes: 0,
      inseminacoesAbertas: 0,
      alertasCarencia: 0,
    };
  }

  const [totalBovinos, totalVacas, vacasLactacao, producaoHoje, producaoMes, inseminacoesAbertas, alertasCarencia] =
    await Promise.all([
      prisma.bovino.count({
        where: { fazendaId: { in: fazendaIds }, situacao: "ATIVA" },
      }),
      prisma.bovino.count({
        where: { fazendaId: { in: fazendaIds }, situacao: "ATIVA", sexo: "FEMEA" },
      }),
      prisma.lactacao.count({
        where: {
          bovino: { fazendaId: { in: fazendaIds } },
          fim: null,
        },
      }),
      prisma.producaoLeite.aggregate({
        where: {
          bovino: { fazendaId: { in: fazendaIds } },
          data: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { quantidade: true },
      }),
      prisma.producaoLeite.aggregate({
        where: {
          bovino: { fazendaId: { in: fazendaIds } },
          data: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { quantidade: true },
      }),
      prisma.inseminacao.count({
        where: {
          bovino: { fazendaId: { in: fazendaIds } },
          prenpiez: null,
        },
      }),
      prisma.registroSanitario.count({
        where: {
          bovino: { fazendaId: { in: fazendaIds } },
          fimCarencia: { gte: new Date() },
        },
      }),
    ]);

  return {
    totalFazendas: fazendaIds.length,
    totalBovinos,
    totalVacas,
    vacasLactacao,
    producaoHoje: producaoHoje._sum.quantidade || 0,
    producaoMes: producaoMes._sum.quantidade || 0,
    inseminacoesAbertas,
    alertasCarencia,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const stats = await getStats(session.user.id);

  const statCards = [
    {
      label: "Bovinos Ativos",
      value: stats.totalBovinos,
      icon: Beef,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Vacas em Lactação",
      value: stats.vacasLactacao,
      icon: FlaskConical,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Produção Hoje (L)",
      value: stats.producaoHoje.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
      icon: Milk,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Produção Mês (L)",
      value: stats.producaoMes.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Prenhez Pendente",
      value: stats.inseminacoesAbertas,
      icon: Heart,
      color: "text-pink-600",
      bg: "bg-pink-50",
    },
    {
      label: "Em Carência",
      value: stats.alertasCarencia,
      icon: AlertTriangle,
      color: stats.alertasCarencia > 0 ? "text-amber-600" : "text-gray-400",
      bg: stats.alertasCarencia > 0 ? "bg-amber-50" : "bg-gray-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">
          Visão geral da sua produção leiteira
        </p>
      </div>

      <DashboardHints />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {card.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg}`}
                >
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick info */}
      {stats.totalFazendas === 0 && (
        <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Beef className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Bem-vindo ao MilKontrol!
          </h3>
          <p className="mt-2 text-gray-600">
            Comece cadastrando sua primeira fazenda para começar a gerenciar seu rebanho.
          </p>
          <a
            href="/fazendas"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg"
          >
            Cadastrar Fazenda
          </a>
        </div>
      )}
    </div>
  );
}
