import { NextResponse, type NextRequest } from 'next/server';

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
 * Best-effort client identifier. Reads the *last* `x-forwarded-for` hop so an
 * attacker cannot reset their bucket by prepending fake IPs. The number of
 * trusted upstream proxies is configurable via `RATE_LIMIT_TRUSTED_PROXY_HOPS`
 * (defaults to 1 — fits Hostinger+Nginx or Vercel edge alone). Vercel-specific
 * headers (`x-vercel-forwarded-for`, `x-real-ip`) take precedence when present.
 */
export function getClientKey(request: NextRequest): string {
  const vercelXff = request.headers.get('x-vercel-forwarded-for');
  if (vercelXff) return vercelXff.split(',')[0]!.trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      const hops = Math.max(1, Number(process.env.RATE_LIMIT_TRUSTED_PROXY_HOPS ?? 1));
      const idx = Math.max(0, parts.length - hops);
      return parts[idx]!;
    }
  }

  // Last-resort identifier — not cryptographically meaningful, but keeps
  // anonymous clients in distinct buckets.
  return 'anon:' + (request.headers.get('user-agent') || 'unknown').slice(0, 80);
}

/**
 * One-call helper for routes that just want to bail out with a 429 on excess.
 * Returns a `NextResponse` to be returned by the handler when the limit is hit,
 * or `null` to continue processing. Adds standard X-RateLimit headers.
 */
export function enforceRateLimit(
  request: NextRequest,
  options: RateLimitOptions,
): NextResponse | null {
  const result = rateLimit(request, options);
  if (result.ok) return null;
  return NextResponse.json(
    { error: 'Too many requests. Please wait a moment and try again.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSec),
        'X-RateLimit-Limit': String(options.limit),
        'X-RateLimit-Remaining': '0',
      },
    },
  );
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
