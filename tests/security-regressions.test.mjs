import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname;
const read = (path) => readFileSync(join(root, path), "utf8");

test("dashboard layout validates the Auth.js session server-side", () => {
  const source = read("src/app/(dashboard)/layout.tsx");

  assert.match(source, /await auth\(\)/);
  assert.match(source, /redirect\("\/login"\)/);
});

test("tank mutations are scoped to the authenticated farm context", () => {
  const source = read("src/app/api/tanque/route.ts");

  assert.match(source, /getFazendaAtivaIds\(\)/);
  assert.match(source, /fazendaId:\s*\{\s*in:\s*ctx\.fazendaIds\s*\}/);
  assert.doesNotMatch(source, /const\s*\{\s*fazendaId/);
  assert.match(source, /fazendaId:\s*ctx\.fazendaAtiva\.id/);
});

test("team deletes cannot cross farm boundaries", () => {
  const source = read("src/app/api/equipe/route.ts");

  assert.match(source, /where:\s*\{\s*id,\s*fazendaId:\s*ctx\.fazendaIds\[0\]\s*\}/);
  assert.match(source, /Membro não encontrado nesta fazenda/);
  assert.match(source, /Convite não encontrado nesta fazenda/);
});

test("batch reproduction validates farm-scoped animals, semen, vet and RBAC", () => {
  const source = read("src/app/api/reproducao/lote/route.ts");

  assert.match(source, /assertRole\(\["PROPRIETARIO",\s*"GERENTE",\s*"VETERINARIO"\]\)/);
  assert.match(source, /id:\s*\{\s*in:\s*bovinoIds\s*\}/);
  assert.match(source, /fazendaId:\s*\{\s*in:\s*ctx\.fazendaIds\s*\}/);
  assert.match(source, /veterinarioId/);
  assert.match(source, /bancoSemenId,\s*fazendaId:\s*\{\s*in:\s*ctx\.fazendaIds\s*\}/);
});

test("service worker does not cache API responses or authenticated pages", () => {
  const source = read("public/sw.js");

  assert.doesNotMatch(source, /API_CACHE/);
  assert.doesNotMatch(source, /caches\.open\(CACHE_NAME\)/);
  assert.match(source, /Never cache them/);
  assert.match(source, /\/offline\.html/);
});

test("production database deploy uses versioned Prisma migrations", () => {
  const packageJson = JSON.parse(read("package.json"));
  const deployScript = read("scripts/deploy-migrations.mjs");

  assert.equal(packageJson.scripts["db:migrate"], "node scripts/deploy-migrations.mjs");
  assert.match(deployScript, /migrate",\s*"resolve",\s*"--applied",\s*initialMigration/);
  assert.match(deployScript, /migrate",\s*"deploy"/);
  assert.ok(existsSync(join(root, "prisma/migrations/0001_initial/migration.sql")));
});

test("health endpoint exposes non-cached application and database status", () => {
  const source = read("src/app/api/health/route.ts");

  assert.match(source, /SELECT 1/);
  assert.match(source, /Cache-Control":\s*"no-store"/);
  assert.match(source, /status:\s*"ok"/);
  assert.match(source, /status:\s*503/);
});

test("intelligence alerts are farm-configurable and forecast production is exposed", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/0002_alert_config/migration.sql");
  const engine = read("src/lib/inteligencia-engine.ts");
  const route = read("src/app/api/inteligencia/route.ts");
  const configRoute = read("src/app/api/alertas-config/route.ts");

  assert.match(schema, /model ConfiguracaoAlertas/);
  assert.match(migration, /CREATE TABLE "ConfiguracaoAlertas"/);
  assert.match(engine, /CONFIG_ALERTAS_PADRAO/);
  assert.match(engine, /calcularPrevisaoProducao/);
  assert.match(route, /tipo:\s*"previsao"/);
  assert.match(route, /gerarAlertasPreditivos\(animais,\s*configAlertas\)/);
  assert.match(configRoute, /assertRole\(\["PROPRIETARIO",\s*"GERENTE"\]\)/);
  assert.match(configRoute, /Cache-Control":\s*"no-store"/);
});

test("production performance check enforces the 3 second MVP threshold", () => {
  const packageJson = JSON.parse(read("package.json"));
  const source = read("scripts/check-performance.mjs");

  assert.equal(packageJson.scripts["check:performance"], "node scripts/check-performance.mjs");
  assert.match(source, /PERFORMANCE_THRESHOLD_MS \|\| 3000/);
  assert.match(source, /\/api\/health/);
});
