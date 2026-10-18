/**
 * Custom-host path allowlist (Stage 3b) — the design's (d) lists as data.
 *
 * On a Cloudflare-for-SaaS hostname, ONLY these paths exist: middleware.ts
 * returns a hard 404 for everything else (no page render, no proxy, no leak
 * of existence). Verified against src/app/(public) routes + public API.
 *
 * NOTE: the API entry mirrors PUBLIC_API_PREFIX in proxyHelper.ts — that
 * module's second guard refuses backend calls outside /api/public/**.
 * Keep the two in sync.
 */

/** Exact pathname matches (pages + loose assets). */
const ALLOWED_EXACT: ReadonlySet<string> = new Set([
  '/', // landing
  '/changelog',
  '/contact',
  '/feedback',
  '/profile',
  '/roadmap',
  '/policy',
  '/features-request',
  '/favicon.ico', // browser default request (no favicon file exists — 404s from Next either way)
  '/icon.png', // src/app/icon.png — tab icon on every allowed page
  '/robots.txt', // public/robots.txt
  '/sitemap.xml', // src/app/sitemap.ts
  '/_next/image', // image optimizer: /_next/image?url=... (query, no subpath)
]);

/** Pathname prefixes (trailing-slash globs from the design's /** lists). */
const ALLOWED_PREFIXES: readonly string[] = [
  '/board/', // /board/**
  '/feedback/', // /feedback/**
  '/_next/static/',
  '/api/public/', // /api/public/**
  // public/ static assets (inventory of public/): fonts = globals.css (every
  // page), videos = landing (/), images = feedback/landing/marketing pages.
  // Static content, not app surface — pages themselves gate behavior.
  '/fonts/',
  '/images/',
  '/videos/',
];

/**
 * Whether a custom (customer) hostname may serve this path.
 *
 * Args:
 *   pathname: URL pathname (request.nextUrl.pathname); a query string or
 *   fragment, if present, is ignored before matching.
 *
 * Returns:
 *   true when the path is on the custom-host allowlist; false = middleware
 *   must 404 it.
 */
export function isCustomHostPathAllowed(pathname: string): boolean {
  const path = pathname.split(/[?#]/)[0];
  return ALLOWED_EXACT.has(path) || ALLOWED_PREFIXES.some((p) => path.startsWith(p));
}
