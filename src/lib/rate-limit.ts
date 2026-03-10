import "server-only";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const WINDOW_MS = 60_000;
const LIMIT = 10;

const globalRateLimitStore = globalThis as typeof globalThis & {
  __vitaRateLimitStore?: Map<string, RateLimitBucket>;
};

const buckets = globalRateLimitStore.__vitaRateLimitStore ?? new Map<string, RateLimitBucket>();
globalRateLimitStore.__vitaRateLimitStore = buckets;

/**
 * Aplica rate limiting por clave (ej: IP) en ventana de 1 minuto.
 * Retorna si la petición está permitida y metadatos de cabeceras.
 */
export function consumeRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return {
      allowed: true,
      remaining: LIMIT - 1,
      retryAfterSeconds: Math.ceil(WINDOW_MS / 1000),
    };
  }

  if (bucket.count >= LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    allowed: true,
    remaining: Math.max(0, LIMIT - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}
