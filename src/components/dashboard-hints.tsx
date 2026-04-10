"use client";

import { Hint } from "@/components/hint";

export function DashboardHints() {
  return (
    <Hint id="dashboard-intro" title="Como usar o Dashboard">
      Este é o painel principal do MilKontrol. Aqui você acompanha os indicadores mais importantes da sua fazenda em tempo real.
      Comece cadastrando uma <strong>Fazenda</strong>, depois seus <strong>Bovinos</strong>, e registre a <strong>Produção</strong> diária.
      Acesse a página de <a href="/ajuda" className="underline font-medium">Ajuda</a> para um guia completo.
    </Hint>
  );
}
