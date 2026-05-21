import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminSidebar from "./admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Verifica se está logado e se é ADMIN global
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    // Pode redirecionar para '/' (dashboard da fazenda) ou para um login.
    // Assim não revelamos que o painel admin existe para usuários comuns.
    redirect("/");
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans text-slate-100">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
