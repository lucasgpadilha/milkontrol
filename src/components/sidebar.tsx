"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Beef,
  Milk,
  Baby,
  Heart,
  FlaskConical,
  Syringe,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  HelpCircle,
  Fence,
  Stethoscope,
  Snowflake,
  Wheat,
  Brain,
  KeyRound,
  BookOpen,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { SeletorFazenda } from "@/components/seletor-fazenda";
import { useFazendaAtiva } from "@/components/fazenda-context";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { type: "separator" as const },
  { href: "/bovinos", label: "Bovinos", icon: Beef },
  { href: "/bezerros", label: "Bezerros", icon: Baby },
  { href: "/piquetes", label: "Piquetes", icon: Fence },
  { href: "/veterinarios", label: "Veterinários", icon: Stethoscope },
  { type: "separator" as const },
  { href: "/producao", label: "Produção", icon: Milk, roles: ["PROPRIETARIO", "GERENTE", "OPERADOR"] },
  { href: "/lactacao", label: "Lactação", icon: FlaskConical, roles: ["PROPRIETARIO", "GERENTE", "OPERADOR"] },
  { href: "/tanque", label: "Tanque", icon: FlaskConical, roles: ["PROPRIETARIO", "GERENTE"] },
  { type: "separator" as const },
  { href: "/semen", label: "Banco de Sêmen", icon: Snowflake, roles: ["PROPRIETARIO", "GERENTE", "VETERINARIO"] },
  { href: "/reproducao", label: "Reprodução", icon: Heart, roles: ["PROPRIETARIO", "GERENTE", "VETERINARIO"] },
  { type: "separator" as const },
  { href: "/sanitario", label: "Sanitário", icon: Syringe, roles: ["PROPRIETARIO", "GERENTE", "OPERADOR", "VETERINARIO"] },
  { href: "/alimentacao", label: "Alimentação", icon: Wheat, roles: ["PROPRIETARIO", "GERENTE", "OPERADOR"] },
  { type: "separator" as const },
  { href: "/inteligencia", label: "Inteligência", icon: Brain, roles: ["PROPRIETARIO", "GERENTE"] },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, roles: ["PROPRIETARIO", "GERENTE"] },
  { type: "separator" as const },
  { href: "/equipe", label: "Equipe", icon: Users, roles: ["PROPRIETARIO"] },
  { href: "/api-keys", label: "API Keys", icon: KeyRound, roles: ["PROPRIETARIO"] },
  { href: "/api-docs", label: "Docs API", icon: BookOpen, roles: ["PROPRIETARIO", "GERENTE", "VETERINARIO"] },
  { href: "/ajuda", label: "Ajuda", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { papelAtivo } = useFazendaAtiva();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden"
        id="mobile-menu-btn"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 custom-scrollbar",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                <Milk className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">
                  Mil
                  <span className="text-emerald-600">Kontrol</span>
                </span>
              </div>
            </Link>
          )}
          {collapsed && (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <Milk className="h-5 w-5 text-white" />
            </div>
          )}
          <button
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className="hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:block"
            id="sidebar-collapse-btn"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Seletor de Fazenda (Workspace) */}
        <SeletorFazenda collapsed={collapsed} />

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map((item, idx) => {
            if ("type" in item && item.type === "separator") {
              // Somente renderiza separador se o próximo item for visível, mas p/ simplificar renderizamos sempre (css handles excess)
              return (
                <div
                  key={`sep-${idx}`}
                  className={cn("my-2 border-t border-gray-100", collapsed && "mx-1")}
                />
              );
            }

            const navItem = item as { href: string; label: string; icon: React.ComponentType<{ className?: string }>; roles?: string[] };
            
            // Check roles
            if (navItem.roles && papelAtivo && !navItem.roles.includes(papelAtivo)) {
              return null;
            }
            const isActive =
              pathname === navItem.href ||
              (navItem.href !== "/" && pathname.startsWith(navItem.href));
            const Icon = navItem.icon;

            return (
              <Link
                key={navItem.href}
                href={navItem.href}
                onClick={() => setMobileOpen(false)}
                className={cn("sidebar-link", isActive && "active")}
                title={collapsed ? navItem.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{navItem.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-100 p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5",
              collapsed && "justify-center px-0"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900">
                  {session?.user?.name || "Usuário"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {session?.user?.email}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => signOut()}
            className={cn(
              "sidebar-link mt-1 w-full text-red-500 hover:bg-red-50 hover:text-red-700",
              collapsed && "justify-center"
            )}
            id="logout-btn"
            title={collapsed ? "Sair" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
