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
