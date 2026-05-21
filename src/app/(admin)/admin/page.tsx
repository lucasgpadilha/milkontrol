import { prisma } from "@/lib/prisma";
import { 
  Building2, 
  Users, 
  Beef, 
  Milk,
  TrendingUp
} from "lucide-react";

async function getAdminStats() {
  const [
    totalUsers,
    totalFarms,
    totalBovinos,
    prodUltimos30Dias,
    totalInseminacoes
  ] = await Promise.all([
    prisma.user.count(),
    prisma.fazenda.count(),
    prisma.bovino.count({ where: { deletedAt: null } }),
    prisma.producaoLeite.aggregate({
      where: {
        data: {
          gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      _sum: { quantidade: true }
    }),
    prisma.inseminacao.count()
  ]);

  return {
    totalUsers,
    totalFarms,
    totalBovinos,
    litrosMes: Math.round(prodUltimos30Dias._sum.quantidade || 0),
    totalInseminacoes
  };
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Visão Global do SaaS</h1>
        <p className="text-slate-400 mt-2">
          Monitoramento em tempo real do MilKontrol
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-slate-400">Total Usuários</h3>
            <Users className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-3xl font-bold text-slate-100">{stats.totalUsers}</div>
          <p className="text-xs text-slate-500 mt-1">Registrados na base</p>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-slate-400">Total Fazendas</h3>
            <Building2 className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-3xl font-bold text-slate-100">{stats.totalFarms}</div>
          <p className="text-xs text-slate-500 mt-1">Workspaces (Tenants)</p>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-slate-400">Bovinos Gerenciados</h3>
            <Beef className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-slate-100">{stats.totalBovinos}</div>
          <p className="text-xs text-slate-500 mt-1">Animais ativos na plataforma</p>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
             <TrendingUp className="w-24 h-24" />
          </div>
          <div className="flex flex-row items-center justify-between pb-4 relative z-10">
            <h3 className="text-sm font-medium text-slate-400">Litragem 30d</h3>
            <Milk className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400 relative z-10">{stats.litrosMes.toLocaleString('pt-BR')} L</div>
          <p className="text-xs text-slate-500 mt-1 relative z-10">Ordenhados e transitados</p>
        </div>
      </div>

    </div>
  );
}
