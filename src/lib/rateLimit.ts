import type { NextRequest } from 'next/server';

/**
 * In-memory rate limiter (sliding-window-ish, fixed window). Use only for
 * public-facing endpoints with low-to-moderate traffic. The single-process
 * map is fine for our scale (Hostinger VPS, single PM2 instance per region);
 * for multi-instance deployments swap for Redis/Upstash.
 *
 * Each call records the current timestamp under the rate-limit key and
 * trims any timestamps older than `windowMs`. Returns `false` once the
 * caller exceeds `limit` requests within the window.
 */
type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

// Background sweep every 5 minutes — drops keys with no hits in the last
// hour to keep memory bounded under sustained traffic.
let sweepStarted = false;
function startSweep() {
  if (sweepStarted) return;
  sweepStarted = true;
  // setInterval is safe inside a Node server route (long-lived process).
  setInterval(() => {
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [key, bucket] of buckets) {
      bucket.hits = bucket.hits.filter((t) => t > cutoff);
      if (bucket.hits.length === 0) buckets.delete(key);
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  /** Max number of requests allowed inside the window. */
  limit: number;
  /** Window length in milliseconds (e.g. 60_000 for 1 min). */
  windowMs: number;
  /** Logical bucket name to namespace this limiter (e.g. 'leads', 'pdf'). */
  bucket: string;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Seconds until the oldest hit ages out — useful for Retry-After header. */
  retryAfterSec: number;
}

/**
 * Best-effort client identifier. Reads `x-forwarded-for` (Hostinger Nginx
 * sets this) and falls back to `x-real-ip`. When neither is set we bucket
 * by user-agent + a constant fallback to avoid global lockouts.
 */
export function getClientKey(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  // Last-resort identifier — not cryptographically meaningful, but keeps
  // anonymous clients in distinct buckets.
  return 'anon:' + (request.headers.get('user-agent') || 'unknown').slice(0, 80);
}

export function rateLimit(
  request: NextRequest,
  options: RateLimitOptions,
): RateLimitResult {
  startSweep();

  const key = `${options.bucket}:${getClientKey(request)}`;
  const now = Date.now();
  const cutoff = now - options.windowMs;

  const bucket = buckets.get(key) ?? { hits: [] };
  // Drop expired hits before counting
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= options.limit) {
    const oldest = bucket.hits[0]!;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000));
    buckets.set(key, bucket);
    return { ok: false, remaining: 0, retryAfterSec };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return {
    ok: true,
    remaining: options.limit - bucket.hits.length,
    retryAfterSec: 0,
  };
}
