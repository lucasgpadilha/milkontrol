-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "PapelFazenda" AS ENUM ('PROPRIETARIO', 'GERENTE', 'OPERADOR', 'VETERINARIO');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MACHO', 'FEMEA');

-- CreateEnum
CREATE TYPE "SituacaoBovino" AS ENUM ('ATIVA', 'VENDIDA', 'MORTA');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MANHA', 'TARDE', 'NOITE');

-- CreateEnum
CREATE TYPE "TipoInseminacao" AS ENUM ('NATURAL', 'ARTIFICIAL');

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "TipoSaida" AS ENUM ('VENDA', 'CONSUMO_INTERNO', 'DESCARTE');

-- CreateEnum
CREATE TYPE "TipoRegistroSanitario" AS ENUM ('VACINA', 'VERMIFUGO', 'MEDICAMENTO', 'TRATAMENTO');

-- CreateEnum
CREATE TYPE "TipoAlimento" AS ENUM ('SILAGEM', 'RACAO', 'FENO', 'SAL_MINERAL', 'CONCENTRADO', 'PASTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "QuartoMamario" AS ENUM ('AD', 'AE', 'PD', 'PE');

-- CreateEnum
CREATE TYPE "TipoMastite" AS ENUM ('CLINICA', 'SUBCLINICA');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('DIAGNOSTICO_PRENHEZ', 'VACINACAO_PROGRAMADA', 'RETORNO_CARENCIA', 'SECAGEM_PREVISTA', 'PARTO_PREVISTO', 'REVISAO_EQUIPAMENTO', 'IATF_ETAPA', 'OUTRO');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('ALTA', 'MEDIA', 'BAIXA');

-- CreateEnum
CREATE TYPE "TipoParto" AS ENUM ('NORMAL', 'DISTOCICO', 'CESAREA', 'ABORTO', 'NATIMORTO');

-- CreateEnum
CREATE TYPE "TipoInsumo" AS ENUM ('MEDICAMENTO', 'VACINA', 'SUPLEMENTO', 'OUTRO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "fazendaAtivaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioFazenda" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fazendaId" TEXT NOT NULL,
    "papel" "PapelFazenda" NOT NULL DEFAULT 'OPERADOR',

    CONSTRAINT "UsuarioFazenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConviteFazenda" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "papel" "PapelFazenda" NOT NULL,
    "fazendaId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConviteFazenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BancoSemen" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nomeTouro" TEXT NOT NULL,
    "raca" TEXT,
    "fornecedor" TEXT,
    "origem" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "fazendaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BancoSemen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Veterinario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "crmv" TEXT,
    "especialidade" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "fazendaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Veterinario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fazenda" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "ordenhasDia" INTEGER NOT NULL DEFAULT 2,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fazenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "prefixo" TEXT NOT NULL,
    "fazendaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY['read']::TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoUso" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Piquete" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "fazendaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Piquete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bovino" (
    "id" TEXT NOT NULL,
    "brinco" TEXT NOT NULL,
    "nome" TEXT,
    "raca" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "situacao" "SituacaoBovino" NOT NULL DEFAULT 'ATIVA',
    "foto" TEXT,
    "observacoes" TEXT,
    "fazendaId" TEXT NOT NULL,
    "piqueteId" TEXT,
    "maeId" TEXT,
    "paiInfo" TEXT,
    "ecc" DOUBLE PRECISION,
    "eccData" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Bovino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pesagem" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "pesoKg" DOUBLE PRECISION NOT NULL,
    "bovinoId" TEXT NOT NULL,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pesagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProducaoLeite" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "turno" "Turno",
    "bovinoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProducaoLeite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lactacao" (
    "id" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "bovinoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lactacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inseminacao" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoInseminacao" NOT NULL,
    "responsavel" TEXT NOT NULL,
    "touroSemen" TEXT,
    "prenhez" BOOLEAN,
    "dataDiagnostico" TIMESTAMP(3),
    "dataPartoPrevisto" TIMESTAMP(3),
    "observacoes" TEXT,
    "bovinoId" TEXT NOT NULL,
    "veterinarioId" TEXT,
    "bancoSemenId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inseminacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tanque" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "capacidadeMax" DOUBLE PRECISION NOT NULL,
    "volumeAtual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fazendaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tanque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentacaoTanque" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoMovimentacao" NOT NULL,
    "tipoSaida" "TipoSaida",
    "quantidade" DOUBLE PRECISION NOT NULL,
    "comprador" TEXT,
    "precoLitro" DOUBLE PRECISION,
    "tanqueId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentacaoTanque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroSanitario" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoRegistroSanitario" NOT NULL,
    "produto" TEXT NOT NULL,
    "dose" TEXT,
    "responsavel" TEXT,
    "diasCarencia" INTEGER NOT NULL DEFAULT 0,
    "fimCarencia" TIMESTAMP(3),
    "observacoes" TEXT,
    "bovinoId" TEXT NOT NULL,
    "veterinarioId" TEXT,
    "insumoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroSanitario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroAlimentacao" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tipoAlimento" "TipoAlimento" NOT NULL,
    "descricao" TEXT,
    "quantidadeKg" DOUBLE PRECISION NOT NULL,
    "custoUnitario" DOUBLE PRECISION,
    "piqueteId" TEXT NOT NULL,
    "fazendaId" TEXT NOT NULL,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroAlimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnaliseLeite" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "ccs" DOUBLE PRECISION NOT NULL,
    "cpp" DOUBLE PRECISION NOT NULL,
    "gordura" DOUBLE PRECISION,
    "proteina" DOUBLE PRECISION,
    "esnf" DOUBLE PRECISION,
    "laboratorio" TEXT,
    "fazendaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnaliseLeite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroMastite" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoMastite" NOT NULL,
    "quarto" "QuartoMamario" NOT NULL,
    "resultado" TEXT,
    "tratamento" TEXT,
    "diasTratamento" INTEGER,
    "cura" BOOLEAN,
    "dataCura" TIMESTAMP(3),
    "observacoes" TEXT,
    "bovinoId" TEXT NOT NULL,
    "veterinarioId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroMastite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaEvento" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "dataConclusao" TIMESTAMP(3),
    "prioridade" "Prioridade" NOT NULL DEFAULT 'MEDIA',
    "notas" TEXT,
    "bovinoId" TEXT,
    "fazendaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgendaEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parto" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tipoParto" "TipoParto" NOT NULL,
    "pesoBezerroKg" DOUBLE PRECISION,
    "sexoBezerro" "Sexo",
    "colostroFornecido" BOOLEAN NOT NULL DEFAULT false,
    "gemelar" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "bovinoId" TEXT NOT NULL,
    "bezerroId" TEXT,
    "fazendaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Parto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstoqueInsumo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoInsumo" NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unidade" TEXT NOT NULL,
    "estoqueMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "fazendaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstoqueInsumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentacaoEstoque" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMovimentacao" NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT,
    "insumoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentacaoEstoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocoloIatf" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "fazendaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProtocoloIatf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtapaIatf" (
    "id" TEXT NOT NULL,
    "dia" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "protocoloId" TEXT NOT NULL,

    CONSTRAINT "EtapaIatf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoteIatf" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "protocoloId" TEXT NOT NULL,
    "fazendaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoteIatf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimalLoteIatf" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "bovinoId" TEXT NOT NULL,

    CONSTRAINT "AnimalLoteIatf_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioFazenda_userId_fazendaId_key" ON "UsuarioFazenda"("userId", "fazendaId");

-- CreateIndex
CREATE UNIQUE INDEX "ConviteFazenda_token_key" ON "ConviteFazenda"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ConviteFazenda_email_fazendaId_key" ON "ConviteFazenda"("email", "fazendaId");

-- CreateIndex
CREATE INDEX "BancoSemen_fazendaId_idx" ON "BancoSemen"("fazendaId");

-- CreateIndex
CREATE INDEX "Veterinario_fazendaId_idx" ON "Veterinario"("fazendaId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_key_idx" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_fazendaId_idx" ON "ApiKey"("fazendaId");

-- CreateIndex
CREATE UNIQUE INDEX "Piquete_nome_fazendaId_key" ON "Piquete"("nome", "fazendaId");

-- CreateIndex
CREATE UNIQUE INDEX "Bovino_brinco_fazendaId_key" ON "Bovino"("brinco", "fazendaId");

-- CreateIndex
CREATE INDEX "Pesagem_bovinoId_data_idx" ON "Pesagem"("bovinoId", "data");

-- CreateIndex
CREATE INDEX "ProducaoLeite_bovinoId_data_idx" ON "ProducaoLeite"("bovinoId", "data");

-- CreateIndex
CREATE INDEX "Lactacao_bovinoId_idx" ON "Lactacao"("bovinoId");

-- CreateIndex
CREATE INDEX "Inseminacao_bovinoId_idx" ON "Inseminacao"("bovinoId");

-- CreateIndex
CREATE INDEX "MovimentacaoTanque_tanqueId_data_idx" ON "MovimentacaoTanque"("tanqueId", "data");

-- CreateIndex
CREATE INDEX "RegistroSanitario_bovinoId_idx" ON "RegistroSanitario"("bovinoId");

-- CreateIndex
CREATE INDEX "RegistroAlimentacao_fazendaId_data_idx" ON "RegistroAlimentacao"("fazendaId", "data");

-- CreateIndex
CREATE INDEX "RegistroAlimentacao_piqueteId_idx" ON "RegistroAlimentacao"("piqueteId");

-- CreateIndex
CREATE INDEX "AnaliseLeite_fazendaId_data_idx" ON "AnaliseLeite"("fazendaId", "data");

-- CreateIndex
CREATE INDEX "RegistroMastite_bovinoId_data_idx" ON "RegistroMastite"("bovinoId", "data");

-- CreateIndex
CREATE INDEX "AgendaEvento_fazendaId_dataHora_idx" ON "AgendaEvento"("fazendaId", "dataHora");

-- CreateIndex
CREATE INDEX "AgendaEvento_bovinoId_idx" ON "AgendaEvento"("bovinoId");

-- CreateIndex
CREATE UNIQUE INDEX "Parto_bezerroId_key" ON "Parto"("bezerroId");

-- CreateIndex
CREATE INDEX "Parto_bovinoId_idx" ON "Parto"("bovinoId");

-- CreateIndex
CREATE INDEX "Parto_fazendaId_data_idx" ON "Parto"("fazendaId", "data");

-- CreateIndex
CREATE INDEX "EstoqueInsumo_fazendaId_idx" ON "EstoqueInsumo"("fazendaId");

-- CreateIndex
CREATE INDEX "MovimentacaoEstoque_insumoId_idx" ON "MovimentacaoEstoque"("insumoId");

-- CreateIndex
CREATE INDEX "LoteIatf_fazendaId_idx" ON "LoteIatf"("fazendaId");

-- CreateIndex
CREATE INDEX "AnimalLoteIatf_loteId_idx" ON "AnimalLoteIatf"("loteId");

-- CreateIndex
CREATE INDEX "AnimalLoteIatf_bovinoId_idx" ON "AnimalLoteIatf"("bovinoId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_fazendaAtivaId_fkey" FOREIGN KEY ("fazendaAtivaId") REFERENCES "Fazenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioFazenda" ADD CONSTRAINT "UsuarioFazenda_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioFazenda" ADD CONSTRAINT "UsuarioFazenda_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConviteFazenda" ADD CONSTRAINT "ConviteFazenda_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BancoSemen" ADD CONSTRAINT "BancoSemen_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Veterinario" ADD CONSTRAINT "Veterinario_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Piquete" ADD CONSTRAINT "Piquete_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bovino" ADD CONSTRAINT "Bovino_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bovino" ADD CONSTRAINT "Bovino_piqueteId_fkey" FOREIGN KEY ("piqueteId") REFERENCES "Piquete"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bovino" ADD CONSTRAINT "Bovino_maeId_fkey" FOREIGN KEY ("maeId") REFERENCES "Bovino"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pesagem" ADD CONSTRAINT "Pesagem_bovinoId_fkey" FOREIGN KEY ("bovinoId") REFERENCES "Bovino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducaoLeite" ADD CONSTRAINT "ProducaoLeite_bovinoId_fkey" FOREIGN KEY ("bovinoId") REFERENCES "Bovino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lactacao" ADD CONSTRAINT "Lactacao_bovinoId_fkey" FOREIGN KEY ("bovinoId") REFERENCES "Bovino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inseminacao" ADD CONSTRAINT "Inseminacao_bovinoId_fkey" FOREIGN KEY ("bovinoId") REFERENCES "Bovino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inseminacao" ADD CONSTRAINT "Inseminacao_veterinarioId_fkey" FOREIGN KEY ("veterinarioId") REFERENCES "Veterinario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inseminacao" ADD CONSTRAINT "Inseminacao_bancoSemenId_fkey" FOREIGN KEY ("bancoSemenId") REFERENCES "BancoSemen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tanque" ADD CONSTRAINT "Tanque_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoTanque" ADD CONSTRAINT "MovimentacaoTanque_tanqueId_fkey" FOREIGN KEY ("tanqueId") REFERENCES "Tanque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroSanitario" ADD CONSTRAINT "RegistroSanitario_bovinoId_fkey" FOREIGN KEY ("bovinoId") REFERENCES "Bovino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroSanitario" ADD CONSTRAINT "RegistroSanitario_veterinarioId_fkey" FOREIGN KEY ("veterinarioId") REFERENCES "Veterinario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroSanitario" ADD CONSTRAINT "RegistroSanitario_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "EstoqueInsumo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroAlimentacao" ADD CONSTRAINT "RegistroAlimentacao_piqueteId_fkey" FOREIGN KEY ("piqueteId") REFERENCES "Piquete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroAlimentacao" ADD CONSTRAINT "RegistroAlimentacao_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnaliseLeite" ADD CONSTRAINT "AnaliseLeite_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroMastite" ADD CONSTRAINT "RegistroMastite_bovinoId_fkey" FOREIGN KEY ("bovinoId") REFERENCES "Bovino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroMastite" ADD CONSTRAINT "RegistroMastite_veterinarioId_fkey" FOREIGN KEY ("veterinarioId") REFERENCES "Veterinario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaEvento" ADD CONSTRAINT "AgendaEvento_bovinoId_fkey" FOREIGN KEY ("bovinoId") REFERENCES "Bovino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaEvento" ADD CONSTRAINT "AgendaEvento_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parto" ADD CONSTRAINT "Parto_bovinoId_fkey" FOREIGN KEY ("bovinoId") REFERENCES "Bovino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parto" ADD CONSTRAINT "Parto_bezerroId_fkey" FOREIGN KEY ("bezerroId") REFERENCES "Bovino"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parto" ADD CONSTRAINT "Parto_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueInsumo" ADD CONSTRAINT "EstoqueInsumo_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "EstoqueInsumo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocoloIatf" ADD CONSTRAINT "ProtocoloIatf_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaIatf" ADD CONSTRAINT "EtapaIatf_protocoloId_fkey" FOREIGN KEY ("protocoloId") REFERENCES "ProtocoloIatf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoteIatf" ADD CONSTRAINT "LoteIatf_protocoloId_fkey" FOREIGN KEY ("protocoloId") REFERENCES "ProtocoloIatf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoteIatf" ADD CONSTRAINT "LoteIatf_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalLoteIatf" ADD CONSTRAINT "AnimalLoteIatf_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "LoteIatf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalLoteIatf" ADD CONSTRAINT "AnimalLoteIatf_bovinoId_fkey" FOREIGN KEY ("bovinoId") REFERENCES "Bovino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
