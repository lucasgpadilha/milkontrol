import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  Beef,
  Milk,
  Heart,
  FlaskConical,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { DashboardHints } from "@/components/dashboard-hints";

async function getStats(userId: string, fazendaIds: string[]) {
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
      vacasParaSecar: 0,
    };
  }

  const [totalBovinos, totalVacas, vacasLactacao, producaoHoje, producaoMes, inseminacoesAbertas, alertasCarencia, vacasParaSecar] =
    await Promise.all([
      prisma.bovino.count({
        where: { fazendaId: { in: fazendaIds }, situacao: "ATIVA", deletedAt: null },
      }),
      prisma.bovino.count({
        where: { fazendaId: { in: fazendaIds }, situacao: "ATIVA", sexo: "FEMEA", deletedAt: null },
      }),
      prisma.lactacao.count({
        where: {
          bovino: { fazendaId: { in: fazendaIds }, deletedAt: null },
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
          prenhez: null,
        },
      }),
      prisma.registroSanitario.count({
        where: {
          bovino: { fazendaId: { in: fazendaIds } },
          fimCarencia: { gte: new Date() },
        },
      }),
      prisma.lactacao.count({
        where: {
          bovino: { fazendaId: { in: fazendaIds }, situacao: "ATIVA", deletedAt: null },
          fim: null,
          inicio: { lte: new Date(new Date().getTime() - 240 * 24 * 60 * 60 * 1000) }, // 240 dias em lactação (preparar para secar)
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
    vacasParaSecar,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Ler fazenda ativa do cookie
  const cookieStore = await cookies();
  const fazendaAtivaCookie = cookieStore.get("fazenda-ativa")?.value;

  // Buscar fazendas do usuário
  const userFazendas = await prisma.usuarioFazenda.findMany({
    where: { userId: session.user.id },
    select: { fazendaId: true },
  });
  const todasFazendaIds = userFazendas.map((uf) => uf.fazendaId);

  // Determinar quais fazendas filtrar
  let fazendaIds = todasFazendaIds;
  let nomeFazendaAtiva = "Todas as Fazendas";

  if (fazendaAtivaCookie && fazendaAtivaCookie !== "todas" && todasFazendaIds.includes(fazendaAtivaCookie)) {
    fazendaIds = [fazendaAtivaCookie];
    const fazenda = await prisma.fazenda.findUnique({
      where: { id: fazendaAtivaCookie },
      select: { nome: true },
    });
    nomeFazendaAtiva = fazenda?.nome || "Fazenda";
  }

  const stats = await getStats(session.user.id, fazendaIds);

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
          {nomeFazendaAtiva === "Todas as Fazendas"
            ? "Visão geral de todas as suas fazendas"
            : `Visão geral — ${nomeFazendaAtiva}`}
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

      {/* Alertas e Agendamentos */}
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        {/* Alertas de Secagem */}
        {stats.vacasParaSecar > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 animate-fade-in shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">Atenção: Secagem Requerida</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Você tem <strong>{stats.vacasParaSecar} vaca(s)</strong> ultrapassando 240 dias em lactação. Programe a secagem para garantir o descanso pé-parto.
                </p>
              </div>
            </div>
            <a href="/lactacao" className="mt-4 inline-block text-sm font-medium text-amber-800 hover:text-amber-900 underline">
              Gerenciar lactações &rarr;
            </a>
          </div>
        )}

        {/* Campanha Aftosa (Maio/Novembro) */}
        {([4, 10].includes(new Date().getMonth())) && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 animate-fade-in shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <FlaskConical className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Campanha de Vacinação</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Mês de campanha de vacinação mandatória (Aftosa/Brucelose). Certifique-se de registrar o lote de vacina para todos os animais ativos.
                </p>
              </div>
            </div>
            <a href="/sanitario/lote" className="mt-4 inline-block text-sm font-medium text-blue-800 hover:text-blue-900 underline">
              Lançamento Sanitário em Lote &rarr;
            </a>
          </div>
        )}
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
