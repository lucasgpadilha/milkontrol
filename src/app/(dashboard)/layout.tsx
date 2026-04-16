import { Sidebar } from "@/components/sidebar";
import { OfflineIndicator } from "@/components/offline-indicator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
