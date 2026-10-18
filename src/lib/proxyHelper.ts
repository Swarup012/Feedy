import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * Tenant and infra headers that must never be trusted from any incoming
 * object. Stripped unconditionally from `extra` (a caller may spread request
 * headers into it); only the server-derived values below are re-attached.
 * x-middleware-subrequest is stripped as defense-in-depth for CVE-2025-29927 —
 * Next 15.3.8 is patched, but the header must never cross the proxy boundary.
 */
const CLIENT_STRIPPED_HEADERS = new Set([
  'x-subdomain',
  'x-tenant-secret',
  'x-custom-host',
  'x-tenant-sig',
  'x-middleware-subrequest',
]);

/** First-party host labels that never carry a tenant (www/admin/api). */
const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'admin']);

/**
 * Host suffixes that are never custom hosts (env-configurable).
 * NON_CUSTOM_HOST_SUFFIXES="faddy.site,localhost" — comma-separated.
 * Default by NODE_ENV: production -> "faddy.site" only; anything else
 * (dev/test) -> "localhost" only (spec: faddy.site first-party only in
 * production, localhost only outside it).
 */
const DEFAULT_NON_CUSTOM_SUFFIXES =
  process.env.NODE_ENV === 'production' ? 'faddy.site' : 'localhost';

const NON_CUSTOM_SUFFIXES: string[] = (
  process.env.NON_CUSTOM_HOST_SUFFIXES || DEFAULT_NON_CUSTOM_SUFFIXES
)
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

/** Backend paths reachable from a custom (Cloudflare-for-SaaS) hostname. */
export const PUBLIC_API_PREFIX = '/api/public/';

/**
 * Thrown when a custom-host request targets a backend path outside
 * /api/public/**. Carries the client-facing status so route catch blocks
 * can surface a plain 404 without leaking host-resolution details.
 */
export class PublicOnlyProxyError extends Error {
  readonly status = 404;

  constructor(pathname: string) {
    super(`custom-host request refused (non-public path): ${pathname}`);
    this.name = 'PublicOnlyProxyError';
  }
}

/**
 * Strict DNS-name validation for a normalized host: lowercase labels of
 * [a-z0-9-] (no spaces, no underscores, no colons, no empty labels),
 * label ≤63 chars, total ≤253. Single labels ("localhost") pass — the
 * NON_CUSTOM suffix check decides first-party vs custom from there.
 */
const HOSTNAME_RE =
  /^(?=.{1,253}$)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/;

/**
 * Normalize a Host header value: lowercase, DNS-root trailing dots removed,
 * numeric port stripped (in both orders — "faddy.site.:443" and
 * "faddy.site:443." both normalize to "faddy.site"), IPv6 brackets unwrapped.
 * Non-numeric ports / junk are left in place so HOSTNAME_RE can reject them.
 * Shared by isCustomHost, extractSubdomainFromHost, the tenant-signature
 * scheme, and hostResolver.ts so every consumer compares the same form.
 */
export function normalizeHost(raw: string): string {
  const host = raw.trim().toLowerCase();
  if (host.startsWith('[')) {
    const close = host.indexOf(']');
    const inside = close === -1 ? host.slice(1) : host.slice(1, close);
    return inside.replace(/\.+$/, '');
  }
  let out = host.replace(/\.+$/, '');
  out = out.replace(/:\d+$/, '');
  return out.replace(/\.+$/, '');
}

function isIpLiteral(host: string): boolean {
  if (host.includes(':')) return /^[0-9a-f:]+$/.test(host); // IPv6: hex groups only
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host); // IPv4
}

/**
 * Decide whether a Host header is a custom (customer) hostname.
 *
 * Fail closed: first-party ONLY when the normalized host strictly validates
 * as a DNS name AND matches a NON_CUSTOM suffix. Everything else — absent
 * host, malformed names (spaces, underscores), stray colons, non-numeric
 * ports, IP literals in production — is custom/restricted (resolve-host or
 * refuse; never tenant context). IP literals are first-party only when
 * NODE_ENV !== 'production' (dev convenience: 127.0.0.1/[::1] browsing).
 * Derived from the Host header itself — never from the x-custom-host flag —
 * so the guard holds even when middleware did not run.
 */
export function isCustomHost(hostHeader: string | null): boolean {
  if (!hostHeader) return true; // fail closed: no host to trust
  const host = normalizeHost(hostHeader);
  if (!host) return true;
  if (isIpLiteral(host)) return process.env.NODE_ENV === 'production';
  if (!HOSTNAME_RE.test(host)) return true; // malformed → restricted
  return !NON_CUSTOM_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`));
}

/**
 * Derive the tenant subdomain from a first-party Host header.
 *
 * acme.faddy.site -> "acme"; apex / www / api / admin -> null;
 * custom hosts, IP literals, malformed hosts -> null (never host-derived).
 * Requires EXACTLY ONE label before the suffix, matching ^[a-z0-9-]{1,63}$
 * (a.b.faddy.site -> null). This is the ONLY subdomain source on first-party
 * hosts — the incoming x-subdomain request header is ignored (middleware may
 * set it, a bypassing attacker may forge it; both are irrelevant here).
 *
 * Shared with middleware.ts so the header middleware sets and the header the
 * proxy forwards can never disagree.
 */
export function extractSubdomainFromHost(hostHeader: string | null): string | null {
  if (!hostHeader) return null;
  const host = normalizeHost(hostHeader);
  if (!host || isIpLiteral(host)) return null;
  if (!HOSTNAME_RE.test(host)) return null;
  const suffix = NON_CUSTOM_SUFFIXES.find((s) => host === s || host.endsWith(`.${s}`));
  if (!suffix) return null; // custom host — subdomain comes from host-lookup, not DNS
  if (host === suffix) return null; // apex
  const label = host.slice(0, -(suffix.length + 1));
  if (!/^[a-z0-9-]{1,63}$/.test(label)) return null; // one label only; dots fail here
  if (RESERVED_SUBDOMAINS.has(label)) return null;
  return label;
}

/**
 * Compute the tenant signature: HMAC-SHA256("<normalized-host>|<subdomain>")
 * keyed by TENANT_HEADER_SECRET, hex-encoded. middleware.ts sets this as
 * x-tenant-sig after resolving a custom host; buildBackendHeaders verifies
 * it before trusting x-subdomain. Uses WebCrypto so the same implementation
 * runs in Edge middleware and Node route handlers.
 *
 * Returns:
 *   64-char hex digest, or "" when TENANT_HEADER_SECRET is not configured
 *   (nothing can be signed or verified then — fail closed).
 */
export async function computeTenantSig(host: string, subdomain: string): Promise<string> {
  const keyMaterial = process.env.TENANT_HEADER_SECRET;
  if (!keyMaterial) return '';
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(keyMaterial),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${normalizeHost(host)}|${subdomain}`));
  return Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Timing-safe verification of a tenant signature (constant-time compare of
 * fixed-length hex digests; format-gated first so length never leaks).
 *
 * Returns:
 *   true only for a well-formed signature matching computeTenantSig for
 *   this host+subdomain with the configured secret.
 */
export async function verifyTenantSig(
  host: string,
  subdomain: string,
  sig: string | null
): Promise<boolean> {
  if (!sig || !process.env.TENANT_HEADER_SECRET) return false;
  if (!/^[0-9a-f]{64}$/.test(sig)) return false;
  const expected = await computeTenantSig(host, subdomain);
  if (!expected) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/**
 * Extract the auth token from an incoming Next.js request.
 *
 * SECURITY: Only the access_token HttpOnly cookie is trusted. The frontend
 * no longer sends an Authorization header (the localStorage fallback was
 * removed to prevent stale-token identity cross-contamination). Accepting
 * an Authorization header here would reintroduce the vulnerability.
 *
 * Returns a "Bearer <token>" string or null.
 */
export function extractAuthHeader(request: NextRequest): string | null {
  const cookieToken = request.cookies.get('access_token')?.value;
  if (cookieToken) {
    return `Bearer ${cookieToken}`;
  }

  return null;
}

/**
 * Build the standard headers to forward to the Express backend.
 *
 * - Subdomain is NEVER taken from the incoming x-subdomain header:
 *   first-party hosts derive it from Host itself (extractSubdomainFromHost);
 *   custom hosts accept it only with a valid x-tenant-sig (HMAC over
 *   host|subdomain keyed by TENANT_HEADER_SECRET) set by middleware —
 *   otherwise no x-subdomain and no x-tenant-secret are sent at all.
 * - Strips every client-supplied tenant/infra header (CLIENT_STRIPPED_HEADERS)
 *   before attaching the server-derived values.
 * - Second guard, Host-derived: a custom-host request outside /api/public/**
 *   throws PublicOnlyProxyError (status 404) — holds even if middleware
 *   never ran.
 * - Always includes Authorization when available. Content-Type defaults to
 *   application/json — override via `extra` for multipart / binary bodies.
 *
 * Throws:
 *   PublicOnlyProxyError: custom host + path outside /api/public/**.
 */
export async function buildBackendHeaders(
  request: NextRequest,
  authHeader: string | null,
  extra: Record<string, string> = {}
): Promise<Record<string, string>> {
  const rawHost = request.headers.get('host');
  const custom = isCustomHost(rawHost);
  const pathname = request.nextUrl.pathname;

  if (custom && !pathname.startsWith(PUBLIC_API_PREFIX)) {
    throw new PublicOnlyProxyError(pathname);
  }

  let subdomain: string | null;
  if (custom) {
    const candidate = request.headers.get('x-subdomain');
    const sig = request.headers.get('x-tenant-sig');
    subdomain = candidate && (await verifyTenantSig(rawHost ?? '', candidate, sig))
      ? candidate
      : null;
  } else {
    subdomain = extractSubdomainFromHost(rawHost);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  for (const key of Object.keys(headers)) {
    if (CLIENT_STRIPPED_HEADERS.has(key.toLowerCase())) delete headers[key];
  }

  if (subdomain) headers['x-subdomain'] = subdomain;
  const secret = process.env.TENANT_HEADER_SECRET;
  if (subdomain && secret) headers['x-tenant-secret'] = secret;

  if (authHeader) headers['Authorization'] = authHeader;

  return headers;
}

/**
 * Design reject-list for the public catch-all proxy: any of these tokens in
 * the raw pathname is refused BEFORE URL construction — no backend call.
 * Traversal the URL parser would normalize away ('..', '%2e%2e' as whole
 * segments) never reaches the route; the list still refuses surviving
 * substrings and encoded forms as defense in depth. Returns a reason string,
 * or null when the path is clean.
 */
const PUBLIC_PATH_REJECTIONS: readonly [pattern: RegExp, reason: string][] = [
  [/\.\./, '".." path traversal'],
  [/%2e%2e/i, 'encoded ".." traversal'],
  [/\/\//, 'double slash (protocol-relative / absolute-URL attempt)'],
  [/%2f/i, 'encoded slash'],
  [/%5c/i, 'encoded backslash'],
  [/%00/i, 'encoded NUL'],
  [/%3f/i, 'encoded query separator'],
  [/%23/i, 'encoded fragment separator'],
];

export function findUnsafePublicPath(rawPath: string): string | null {
  for (const [pattern, reason] of PUBLIC_PATH_REJECTIONS) {
    if (pattern.test(rawPath)) return reason;
  }
  return null;
}

/**
 * Build a backend URL from a path/query and assert it stays on the
 * BACKEND_URL origin. Blocks absolute URLs, protocol-relative //host paths,
 * and anything else that would resolve off the backend origin — the public
 * catch-all proxy must never fetch off the configured backend.
 *
 * When requiredPrefix is given (catch-all: '/api/public/'), the normalized
 * pathname must stay under it: URL construction already resolves literal
 * '..' and '%2e%2e' segments away (they land outside the prefix and throw),
 * and the decoded form is re-checked for traversal the URL parser keeps
 * (e.g. '..%2f').
 *
 * Throws:
 *   Error: off-origin URL, path outside requiredPrefix, or decoded traversal.
 */
export function toBackendUrl(path: string, requiredPrefix?: string): URL {
  const url = new URL(path, BACKEND_URL);
  if (url.origin !== new URL(BACKEND_URL).origin) {
    throw new Error(`refusing cross-origin backend URL: ${url.origin}`);
  }
  if (requiredPrefix) {
    if (!url.pathname.startsWith(requiredPrefix)) {
      throw new Error(`refusing path outside required prefix: ${requiredPrefix}`);
    }
    let decoded: string;
    try {
      decoded = decodeURIComponent(url.pathname);
    } catch {
      throw new Error('refusing malformed percent-encoding in path');
    }
    if (!decoded.startsWith(requiredPrefix) || /(^|\/)\.\.(\/|$)/.test(decoded)) {
      throw new Error(`refusing traversal in path: ${requiredPrefix}`);
    }
  }
  return url;
}

export { BACKEND_URL };
