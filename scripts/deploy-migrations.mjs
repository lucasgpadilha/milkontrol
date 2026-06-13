import "dotenv/config";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

const prismaBin = join(process.cwd(), "node_modules", ".bin", "prisma");
const initialMigration = "0001_initial";

function runPrisma(args) {
  execFileSync(prismaBin, args, {
    stdio: "inherit",
    env: process.env,
  });
}

async function hasTable(client, regclassName) {
  const result = await client.query("SELECT to_regclass($1) AS table_name", [regclassName]);
  return Boolean(result.rows[0]?.table_name);
}

async function baselineInitialMigrationIfNeeded() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada.");
  }

  if (!existsSync(join(process.cwd(), "prisma", "migrations", initialMigration, "migration.sql"))) {
    throw new Error(`Migration inicial ${initialMigration} não encontrada.`);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const hasMigrationsTable = await hasTable(client, "public._prisma_migrations");
    const hasExistingSchema = await hasTable(client, 'public."User"');

    if (hasExistingSchema && !hasMigrationsTable) {
      console.log(`[migrate] Schema existente detectado; marcando ${initialMigration} como aplicada.`);
      runPrisma(["migrate", "resolve", "--applied", initialMigration]);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

await baselineInitialMigrationIfNeeded();
runPrisma(["migrate", "deploy"]);
