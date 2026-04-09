"use client";

import { redirect } from "next/navigation";

export default function BezerrosPage() {
  // Bezerros são bovinos com idade < 1 ano, gerenciados pela tela de bovinos
  // This page redirects to bovinos with appropriate filters
  redirect("/bovinos");
}
