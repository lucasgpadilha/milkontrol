-- CreateTable
CREATE TABLE "ConfiguracaoAlertas" (
    "id" TEXT NOT NULL,
    "fazendaId" TEXT NOT NULL,
    "quedaProducaoPct" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "delSecagemAviso" INTEGER NOT NULL DEFAULT 240,
    "delSecagemCritico" INTEGER NOT NULL DEFAULT 280,
    "diasPrenhezPendente" INTEGER NOT NULL DEFAULT 45,
    "diasCarenciaVencendo" INTEGER NOT NULL DEFAULT 3,
    "diasSecaRetorno" INTEGER NOT NULL DEFAULT 90,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoAlertas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoAlertas_fazendaId_key" ON "ConfiguracaoAlertas"("fazendaId");

-- CreateIndex
CREATE INDEX "ConfiguracaoAlertas_fazendaId_idx" ON "ConfiguracaoAlertas"("fazendaId");

-- AddForeignKey
ALTER TABLE "ConfiguracaoAlertas" ADD CONSTRAINT "ConfiguracaoAlertas_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
