/**
 * ⏱️ Rate Limiter — Sliding Window in-memory
 *
 * Limita 100 requests/minuto por API Key.
 * Sem Redis, adequado para single-instance.
 */

interface WindowEntry {
  timestamps: number[];
}

const WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 100;

const windows = new Map<string, WindowEntry>();

// Limpar entradas antigas periodicamente (a cada 5 min)
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS * 2;
  for (const [key, entry] of windows.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) windows.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // timestamp ms
}

export function checkRateLimit(apiKeyId: string): RateLimitResult {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  let entry = windows.get(apiKeyId);
  if (!entry) {
    entry = { timestamps: [] };
    windows.set(apiKeyId, entry);
  }

  // Limpar timestamps fora da janela
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  const remaining = Math.max(0, MAX_REQUESTS - entry.timestamps.length);
  const resetAt = entry.timestamps.length > 0
    ? entry.timestamps[0] + WINDOW_MS
    : now + WINDOW_MS;

  if (entry.timestamps.length >= MAX_REQUESTS) {
    return { allowed: false, limit: MAX_REQUESTS, remaining: 0, resetAt };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    limit: MAX_REQUESTS,
    remaining: remaining - 1,
    resetAt,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
