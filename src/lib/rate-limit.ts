// Simple in-process sliding-window rate limiter.
// NOTE (OWASP-RATELIMIT-001): in-memory state is only correct for a single
// instance. A horizontally-scaled deployment must back this with a shared store
// (Redis/Upstash). Kept in-memory here to stay zero-dependency for local dev.

const hits = new Map<string, number[]>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    hits.set(key, timestamps);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return { allowed: true, remaining: limit - timestamps.length, retryAfterSeconds: 0 };
}
