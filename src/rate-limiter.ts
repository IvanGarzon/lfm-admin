import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// -- Setup --------------------------------------------------------------------

let redis: Redis | null = null;

if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

// -- Limiters -----------------------------------------------------------------

// 10 requests per 10 minutes per IP — brute-force protection for auth endpoints
export const authLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '10 m'), prefix: 'rl:auth' })
  : null;

// 20 requests per minute per IP — flood protection for file uploads
export const uploadLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 m'), prefix: 'rl:upload' })
  : null;

// 60 requests per minute per IP — prevent hobby-tier exhaustion from E2E tests
export const testLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1 m'), prefix: 'rl:test' })
  : null;

// -- Helper -------------------------------------------------------------------

/**
 * Checks rate limit for a given identifier. Fails open when KV is not configured.
 *
 * @param limiter - The Ratelimit instance to check against
 * @param identifier - IP address to scope the limit
 * @returns null if allowed, or { status: 429, retryAfter } if blocked
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ status: 429; retryAfter: number } | null> {
  if (!limiter) {
    return null;
  }

  const { success, reset } = await limiter.limit(identifier);
  if (success) {
    return null;
  }

  return { status: 429, retryAfter: Math.ceil((reset - Date.now()) / 1000) };
}

// -- IP extraction ------------------------------------------------------------

/**
 * Extracts the client IP from Next.js request headers.
 * Falls back to '127.0.0.1' when headers are unavailable.
 *
 * @returns IP address string
 */
export async function getRequestIp(): Promise<string> {
  const { headers } = await import('next/headers');
  const headersList = await headers();
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    '127.0.0.1'
  );
}
