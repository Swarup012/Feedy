import { BACKEND_URL, normalizeHost } from './proxyHelper';

/**
 * Feedy-side custom-host resolver (Stage 3b) — a thin client for the
 * backend's GET /api/internal/host-lookup, which is the single source of
 * truth (backend host-resolver.service owns eligibility + its own cache).
 *
 * - ≤5s in-process entry, positive results only — NEVER a negative cache of
 *   its own: unknown hosts and outages must see backend activation the
 *   moment it happens; the worst Feedy-side staleness is ≤5s.
 * - in-flight dedup absorbs bursts of same-host subrequests (the first
 *   request's lookup is shared, nothing is stored after settle).
 */
export type HostLookupResult =
  | { status: 'ok'; subdomain: string; organizationId: string }
  | { status: 'unresolved' } // backend answered: unknown/ineligible host
  | { status: 'unavailable' }; // 503 / non-2xx / network / bad body — never cached

const CACHE_TTL_MS = 5000;
const MAX_CACHE_ENTRIES = 1000;

type OkEntry = Extract<HostLookupResult, { status: 'ok' }>;
const cache = new Map<string, { entry: OkEntry; expires: number }>();
const inflight = new Map<string, Promise<HostLookupResult>>();

/**
 * Resolve a custom hostname to its organization subdomain via the backend
 * internal lookup (INTERNAL_API_SECRET header, no-store).
 *
 * Args:
 *   host: raw Host header value (any case/port/trailing dot).
 *
 * Returns:
 *   'ok' (subdomain + organizationId), 'unresolved' (unknown host), or
 *   'unavailable' (backend error — safe to retry immediately).
 */
export async function resolveHost(host: string): Promise<HostLookupResult> {
  const key = normalizeHost(host);
  if (!key) return { status: 'unresolved' };

  const hit = cache.get(key);
  if (hit) {
    if (hit.expires > Date.now()) return hit.entry;
    cache.delete(key);
  }

  const pending = inflight.get(key);
  if (pending) return pending;
  const promise = lookup(key).finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

async function lookup(host: string): Promise<HostLookupResult> {
  let res: Response;
  try {
    res = await fetch(
      `${BACKEND_URL}/api/internal/host-lookup?host=${encodeURIComponent(host)}`,
      {
        headers: { 'x-internal-secret': process.env.INTERNAL_API_SECRET || '' },
        cache: 'no-store',
      }
    );
  } catch {
    return { status: 'unavailable' };
  }
  if (!res.ok) return { status: 'unavailable' }; // 503/401/400 — never cached
  const data = await res.json().catch(() => null);
  if (!data?.success || !data.organization_id || !data.subdomain) {
    return data ? { status: 'unresolved' } : { status: 'unavailable' };
  }
  const entry: OkEntry = {
    status: 'ok',
    subdomain: data.subdomain,
    organizationId: data.organization_id,
  };
  // ponytail: positive-only, 5s TTL, 1000-entry cap (evict oldest) — upgrade
  // to a real LRU with sweep if sustained same-second diversity ever matters.
  while (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
  cache.set(host, { entry, expires: Date.now() + CACHE_TTL_MS });
  return entry;
}

/** Drop the positive cache (tests; never needed for correctness — TTL ≤5s). */
export function clearHostCache(): void {
  cache.clear();
}
