# 🥛 MilKontrol

**Sistema de Controle de Fazenda Leiteira**

Plataforma web para gestão completa de fazendas leiteiras — bovinos, produção, reprodução, tanque e controle sanitário.

> 🌐 **Produção:** [https://milkontrol.cloud](https://milkontrol.cloud)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Banco de Dados | PostgreSQL 16 (Docker) |
| ORM | Prisma 7 (driver adapter) |
| Autenticação | Auth.js v5 (credentials + JWT) |
| UI | Tailwind CSS + shadcn/ui |
| Validação | Zod |
| Deploy | PM2 + Caddy (HTTPS automático) |

## Módulos

- **Dashboard** — KPIs em tempo real (bovinos, produção, prenhez, carência)
- **Fazendas** — CRUD com multi-tenant por usuário
- **Bovinos** — Cadastro, filtros (brinco, raça, sexo, situação), ficha do animal
- **Produção de Leite** — Lançamentos diários por vaca e turno
- **Lactação** — Controle de períodos, DEL (Dias em Lactação) automático
- **Reprodução** — Inseminação (IA/natural), diagnóstico de prenhez inline
- **Tanque de Leite** — Entradas/saídas, gauge visual, alerta de capacidade
- **Controle Sanitário** — Vacinas, vermífugos, medicamentos, período de carência
- **Relatórios** — Produção mensal, variação, ranking de produtividade, taxa de prenhez

## Regras de Negócio

- **RN01** — Apenas vacas podem registrar produção
- **RN02** — Apenas vacas em lactação registram produção
- **RN04** — Volume do tanque não pode ultrapassar a capacidade máxima
- **RN05** — Inseminação deve ser registrada antes do diagnóstico de prenhez
- **Carência** — Vaca medicada bloqueia registro de produção durante o período

## Como rodar

```bash
# 1. Clonar
git clone https://github.com/lucasgpadilha/milkontrol.git
cd milkontrol

# 2. Configurar ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 3. Subir o banco de dados
sudo docker compose up -d db

# 4. Instalar dependências e configurar banco
npm install
npx prisma generate
npx prisma db push

# 5. Rodar em desenvolvimento
npm run dev
```

O app estará em `http://localhost:3005`.

## Deploy (produção)

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

O Caddy cuida do HTTPS automático via Let's Encrypt.

## Estrutura

```
src/
├── app/
│   ├── (dashboard)/     # Páginas protegidas (bovinos, produção, etc.)
│   ├── api/             # API routes (11 endpoints)
│   ├── login/           # Autenticação
│   └── registro/        # Cadastro de usuário
├── components/          # Sidebar, UI components (shadcn)
├── lib/                 # Auth, Prisma, utils, validators
└── middleware.ts        # Proteção de rotas
prisma/
└── schema.prisma        # 10 models, 8 enums
```

## Licença

Projeto privado — © Lucas Padilha
