import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="transition-all duration-300 lg:ml-64">
        <div className="mx-auto max-w-7xl p-4 pt-20 lg:p-8 lg:pt-8">
          {children}
        </div>
        <div className="fixed top-4 right-4 z-50">
          <OfflineIndicator />
        </div>
      </main>
    </div>
  );
}
