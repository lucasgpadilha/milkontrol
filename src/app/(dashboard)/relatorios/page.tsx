import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { BarChart3, TrendingUp, Milk, Beef } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { RelatoriosHints } from "@/components/relatorios-hints";

async function getReportData(userId: string) {
  // Ler fazenda ativa do cookie
  const cookieStore = await cookies();
  const fazendaAtivaCookie = cookieStore.get("fazenda-ativa")?.value;

  const userFazendas = await prisma.usuarioFazenda.findMany({
    where: { userId }, select: { fazendaId: true },
  });
  let fazendaIds = userFazendas.map((uf) => uf.fazendaId);
  if (fazendaIds.length === 0) return null;

  // Filtrar pela fazenda ativa se selecionada
  if (fazendaAtivaCookie && fazendaAtivaCookie !== "todas" && fazendaIds.includes(fazendaAtivaCookie)) {
    fazendaIds = [fazendaAtivaCookie];
  }

  const now = new Date();
  const mesAtual = new Date(now.getFullYear(), now.getMonth(), 1);
  const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const fimMesAnterior = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    producaoMesAtual,
    producaoMesAnterior,
    rankingVacas,
    totalAtivos,
    totalVacas,
    taxaPrenhez,
  ] = await Promise.all([
    prisma.producaoLeite.aggregate({
      where: { bovino: { fazendaId: { in: fazendaIds } }, data: { gte: mesAtual } },
      _sum: { quantidade: true },
      _count: true,
    }),
    prisma.producaoLeite.aggregate({
      where: {
        bovino: { fazendaId: { in: fazendaIds } },
        data: { gte: mesAnterior, lte: fimMesAnterior },
      },
      _sum: { quantidade: true },
    }),
    prisma.producaoLeite.groupBy({
      by: ["bovinoId"],
      where: { bovino: { fazendaId: { in: fazendaIds } }, data: { gte: mesAtual } },
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: "desc" } },
      take: 10,
    }),
    prisma.bovino.count({ where: { fazendaId: { in: fazendaIds }, situacao: "ATIVA" } }),
    prisma.bovino.count({ where: { fazendaId: { in: fazendaIds }, situacao: "ATIVA", sexo: "FEMEA" } }),
    prisma.inseminacao.groupBy({
      by: ["prenhez"],
      where: { bovino: { fazendaId: { in: fazendaIds } } },
      _count: true,
    }),
  ]);

  // Get bovino details for ranking
  const bovinoIds = rankingVacas.map((r) => r.bovinoId);
  const bovinosDetail = await prisma.bovino.findMany({
    where: { id: { in: bovinoIds } },
    select: { id: true, brinco: true, nome: true },
  });

  const ranking = rankingVacas.map((r) => {
    const bov = bovinosDetail.find((b) => b.id === r.bovinoId);
    return {
      brinco: bov?.brinco || "?",
      nome: bov?.nome || "",
      total: r._sum.quantidade || 0,
    };
  });

  const totalInseminacoes = taxaPrenhez.reduce((acc, t) => acc + t._count, 0);
  const prenhes = taxaPrenhez.find((t) => t.prenhez === true)?._count || 0;

  return {
    producaoMesAtual: producaoMesAtual._sum.quantidade || 0,
    producaoMesAnterior: producaoMesAnterior._sum.quantidade || 0,
    lancamentosMes: producaoMesAtual._count,
    ranking,
    totalAtivos,
    totalVacas,
    taxaPrenhez: totalInseminacoes > 0 ? ((prenhes / totalInseminacoes) * 100).toFixed(1) : "0",
    totalInseminacoes,
  };
}

export default async function RelatoriosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getReportData(session.user.id);

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-500">Cadastre uma fazenda para ver relatórios.</p>
      </div>
    );
  }

  const variacao = data.producaoMesAnterior > 0
    ? (((data.producaoMesAtual - data.producaoMesAnterior) / data.producaoMesAnterior) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="mt-1 text-gray-500">Visão consolidada da produção</p>
      </div>

      <RelatoriosHints />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Milk className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Produção Mês</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(data.producaoMesAtual)}L</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Variação</p>
              <p className={`text-xl font-bold ${parseFloat(variacao) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {parseFloat(variacao) >= 0 ? "+" : ""}{variacao}%
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <Beef className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rebanho Ativo</p>
              <p className="text-xl font-bold text-gray-900">{data.totalAtivos} ({data.totalVacas} ♀)</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50">
              <BarChart3 className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Taxa Prenhez</p>
              <p className="text-xl font-bold text-gray-900">{data.taxaPrenhez}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">🏆 Ranking de Produtividade (Mês Atual)</h2>
        {data.ranking.length === 0 ? (
          <p className="text-gray-400">Sem dados de produção este mês</p>
        ) : (
          <div className="space-y-3">
            {data.ranking.map((vaca, i) => {
              const maxProd = data.ranking[0].total;
              const pct = maxProd > 0 ? (vaca.total / maxProd) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-500"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{vaca.brinco} — {vaca.nome || "Sem nome"}</span>
                      <span className="font-semibold text-emerald-600">{formatNumber(vaca.total)}L</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
