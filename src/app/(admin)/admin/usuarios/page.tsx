import { prisma } from "@/lib/prisma";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

async function getUsers() {
  return await prisma.user.findMany({
    include: {
      fazendas: {
        include: {
          fazenda: true
        }
      }
    },
    orderBy: { criadoEm: "desc" }
  });
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Usuários & Clientes</h1>
        <p className="text-slate-400 mt-2">
          Gestão centralizada de todos os usuários cadastrados na plataforma.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900 border-b border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">Usuário</th>
                <th scope="col" className="px-6 py-4">Global Role</th>
                <th scope="col" className="px-6 py-4">Workspaces (Fazendas)</th>
                <th scope="col" className="px-6 py-4">Membro Desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">{user.nome}</span>
                      <span className="text-slate-500">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === "ADMIN" ? (
                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        ADMIN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        USER
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.fazendas.length === 0 ? (
                      <span className="text-slate-500 italic">Nenhuma</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {user.fazendas.map(f => (
                          <span key={f.fazendaId} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-700">
                            {f.fazenda.nome} ({f.papel})
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {new Date(user.criadoEm).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              Nenhum usuário encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
