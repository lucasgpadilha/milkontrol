"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, Database, LogOut, Activity } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Painel de Controle", href: "/admin", icon: BarChart3 },
  { name: "Usuários & Clientes", href: "/admin/usuarios", icon: Users },
  { name: "Health (Log)", href: "/admin/health", icon: Activity },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col h-full shrink-0 relative z-10 transition-transform duration-300 md:translate-x-0">
      <div className="p-6 border-b border-slate-800">
        <Link href="/admin" className="flex items-center space-x-2">
          <Database className="h-6 w-6 text-red-500" />
          <span className="font-bold text-xl tracking-tight uppercase text-red-100">SuperAdmin</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">
          SaaS Management
        </div>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors group ${
                isActive 
                  ? "bg-red-500/10 text-red-400 font-medium" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-red-400" : "text-slate-500 group-hover:text-slate-300"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Button 
          variant="ghost" 
          className="w-full flex items-center justify-start text-slate-400 hover:text-slate-100 hover:bg-slate-800 space-x-3 px-3 py-2.5 h-auto text-base font-normal"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-5 w-5 text-slate-500" />
          <span>Sair (Logout)</span>
        </Button>
      </div>
    </div>
  );
}
