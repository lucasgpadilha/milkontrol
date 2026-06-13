const baseUrl = process.env.APP_HEALTH_URL || `http://127.0.0.1:${process.env.PORT || 3005}`;
const thresholdMs = Number(process.env.PERFORMANCE_THRESHOLD_MS || 3000);
const startedAt = performance.now();

const res = await fetch(`${baseUrl}/api/health`, {
  headers: { Accept: "application/json" },
});

const elapsedMs = Math.round(performance.now() - startedAt);
const body = await res.json().catch(() => ({}));

if (!res.ok || body.status !== "ok") {
  console.error(`Health check failed in ${elapsedMs}ms`, body);
  process.exit(1);
}

if (elapsedMs > thresholdMs) {
  console.error(`Health check took ${elapsedMs}ms, above ${thresholdMs}ms threshold`);
  process.exit(1);
}

console.log(`Health check ok in ${elapsedMs}ms`);
