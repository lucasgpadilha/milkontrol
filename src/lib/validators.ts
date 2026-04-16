import { z } from "zod";

// ─── Fazenda ─────────────────────────────────────────────────────────

export const fazendaSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  ordenhasDia: z.number().int().min(2).max(3).default(2),
});

export type FazendaInput = z.infer<typeof fazendaSchema>;

// ─── Bovino ──────────────────────────────────────────────────────────

export const bovinoSchema = z.object({
  brinco: z.string().min(1, "Brinco é obrigatório"),
  nome: z.string().optional(),
  raca: z.string().min(1, "Raça é obrigatória"),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  sexo: z.enum(["MACHO", "FEMEA"]),
  situacao: z.enum(["ATIVA", "VENDIDA", "MORTA"]).default("ATIVA"),
  maeId: z.string().optional(),
  paiInfo: z.string().optional(),
  observacoes: z.string().optional(),
  piqueteId: z.string().optional(),
});

export type BovinoInput = z.infer<typeof bovinoSchema>;

// ─── Produção ────────────────────────────────────────────────────────

export const producaoSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  quantidade: z.number().positive("Quantidade deve ser positiva"),
  turno: z.enum(["MANHA", "TARDE", "NOITE"]).optional(),
  bovinoId: z.string().min(1, "Bovino é obrigatório"),
});

export type ProducaoInput = z.infer<typeof producaoSchema>;

// ─── Lactação ────────────────────────────────────────────────────────

export const lactacaoSchema = z.object({
  inicio: z.string().min(1, "Data de início é obrigatória"),
  fim: z.string().optional(),
  bovinoId: z.string().min(1, "Bovino é obrigatório"),
});

export type LactacaoInput = z.infer<typeof lactacaoSchema>;

// ─── Inseminação ─────────────────────────────────────────────────────

export const inseminacaoSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  tipo: z.enum(["NATURAL", "ARTIFICIAL"]),
  responsavel: z.string().min(1, "Responsável é obrigatório"),
  touroSemen: z.string().optional(),
  observacoes: z.string().optional(),
  bovinoId: z.string().min(1, "Bovino é obrigatório"),
  veterinarioId: z.string().optional(),
  bancoSemenId: z.string().optional(),
});

export type InseminacaoInput = z.infer<typeof inseminacaoSchema>;

// ─── Banco de Sêmen ──────────────────────────────────────────────────

export const bancoSemenSchema = z.object({
  codigo: z.string().min(1, "Código ou Identificação é obrigatória"),
  nomeTouro: z.string().min(1, "Nome do touro é obrigatório"),
  raca: z.string().optional(),
  fornecedor: z.string().optional(),
  origem: z.string().optional(),
  quantidade: z.number().int().min(0).default(0),
});

export type BancoSemenInput = z.infer<typeof bancoSemenSchema>;

// ─── Veterinário ──────────────────────────────────────────────────────

export const veterinarioSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  crmv: z.string().optional(),
  especialidade: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  ativo: z.boolean().default(true),
});

export type VeterinarioInput = z.infer<typeof veterinarioSchema>;

// ─── Tanque ──────────────────────────────────────────────────────────

export const tanqueSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  capacidadeMax: z.number().positive("Capacidade deve ser positiva"),
});

export type TanqueInput = z.infer<typeof tanqueSchema>;

export const movimentacaoTanqueSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  tipoSaida: z.enum(["VENDA", "CONSUMO_INTERNO", "DESCARTE"]).optional(),
  quantidade: z.number().positive("Quantidade deve ser positiva"),
  tanqueId: z.string().min(1, "Tanque é obrigatório"),
  comprador: z.string().optional(),
  precoLitro: z.number().min(0).optional(),
});

export type MovimentacaoTanqueInput = z.infer<typeof movimentacaoTanqueSchema>;

// ─── Sanitário ───────────────────────────────────────────────────────

export const registroSanitarioSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  tipo: z.enum(["VACINA", "VERMIFUGO", "MEDICAMENTO", "TRATAMENTO"]),
  produto: z.string().min(1, "Produto é obrigatório"),
  dose: z.string().optional(),
  responsavel: z.string().optional(),
  diasCarencia: z.number().int().min(0).default(0),
  observacoes: z.string().optional(),
  bovinoId: z.string().min(1, "Bovino é obrigatório"),
  veterinarioId: z.string().optional(),
});

export type RegistroSanitarioInput = z.infer<typeof registroSanitarioSchema>;

// ─── Alimentação ─────────────────────────────────────────────────────

export const registroAlimentacaoSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  tipoAlimento: z.enum(["SILAGEM", "RACAO", "FENO", "SAL_MINERAL", "CONCENTRADO", "PASTO", "OUTRO"]),
  descricao: z.string().optional(),
  quantidadeKg: z.number().positive("Quantidade deve ser positiva"),
  custoUnitario: z.number().min(0).optional(),
  piqueteId: z.string().min(1, "Piquete é obrigatório"),
  observacoes: z.string().optional(),
});

export type RegistroAlimentacaoInput = z.infer<typeof registroAlimentacaoSchema>;

// ─── Pesagem ─────────────────────────────────────────────────────────

export const pesagemSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  pesoKg: z.number().positive("Peso deve ser positivo"),
  bovinoId: z.string().min(1, "Bovino é obrigatório"),
  observacoes: z.string().optional(),
});

export type PesagemInput = z.infer<typeof pesagemSchema>;

// ─── Auth ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const registroSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmarSenha: z.string(),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "Senhas não coincidem",
  path: ["confirmarSenha"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
