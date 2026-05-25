import { createHash } from 'node:crypto';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const stores = new Map<string, Map<string, RateLimitEntry>>();

export function getClientRateLimitKey(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp =
    forwardedFor?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown';

  return createHash('sha256').update(clientIp).digest('hex').slice(0, 24);
}

export function checkRateLimit({
  namespace,
  key,
  limit,
  windowMs,
}: {
  namespace: string;
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const store = stores.get(namespace) ?? new Map<string, RateLimitEntry>();
  stores.set(namespace, store);

  for (const [storedKey, value] of store.entries()) {
    if (value.resetAt <= now) {
      store.delete(storedKey);
    }
  }

  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetAt: now + windowMs,
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;

  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  };
}

export function parsePositiveInteger(
  value: string | undefined,
  fallback: number
) {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
