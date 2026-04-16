"use client";

import { SessionProvider } from "next-auth/react";
import { FazendaProvider } from "@/components/fazenda-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FazendaProvider>{children}</FazendaProvider>
    </SessionProvider>
  );
}
