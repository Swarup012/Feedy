/**
 * Custom-host path allowlist (Stage 3b) — the design's (d) lists as data.
 *
 * On a Cloudflare-for-SaaS hostname, ONLY these paths exist: middleware.ts
 * returns a hard 404 for everything else (no page render, no proxy, no leak
 * of existence). Verified against src/app/(public) routes + public API.
 *
 * Retired on custom hosts (Stage 3b-2 step 1): /contact, /profile, /policy,
 * /features-request — Faddy-only pages; links to them go to faddy.site.
 * Legacy /board/** is allowlisted only so the redirect route
 * (app/board/[[...slug]]/route.ts) can 307 it to the canonical /feedback/**
 * URL with a RELATIVE Location — middleware cannot emit relative Locations
 * (Next 15's adapter URL-parses Location headers).
 *
 * NOTE: the API entry mirrors PUBLIC_API_PREFIX in proxyHelper.ts — that
 * module's second guard refuses backend calls outside /api/public/**.
 * Keep the two in sync.
 */

/** Exact pathname matches (pages + loose assets). */
const ALLOWED_EXACT: ReadonlySet<string> = new Set([
  '/', // landing
  '/changelog',
  '/feedback',
  '/roadmap',
  '/favicon.ico', // browser default request (no favicon file exists — 404s from Next either way)
  '/icon.png', // src/app/icon.png — tab icon on every allowed page
  '/robots.txt', // public/robots.txt
  '/sitemap.xml', // src/app/sitemap.ts
  '/_next/image', // image optimizer: /_next/image?url=... (query, no subpath)
]);

/** Pathname prefixes (trailing-slash globs from the design's /** lists). */
const ALLOWED_PREFIXES: readonly string[] = [
  '/feedback/', // /feedback/**
  '/_next/static/',
  '/api/public/', // /api/public/**
  // Redirect-only endpoint (no page): app/board/[[...slug]]/route.ts 307s
  // legacy /board/** URLs to canonical /feedback/** — allowed so the handler
  // is reachable; it emits redirects or 404, never content.
  '/board/',
  // public/ static assets. /images/icons/ = PostDetails provider icons on
  // /feedback/[postId]; /fonts/ = globals.css (every page). /images/ was
  // narrowed to /images/icons/ — the rest of public/images is admin/marketing
  // only. /videos/ was removed — only the marketing landing used it, and that
  // page never renders on a custom host ("/" 307s to /feedback).
  '/images/icons/',
  '/fonts/',
];

/**
 * Whether a custom (customer) hostname may serve this path.
 *
 * Args:
 *   pathname: URL pathname (request.nextUrl.pathname); a query string or
 *   fragment, if present, is ignored before matching. Checked in BOTH the
 *   raw and percent-decoded form so dot-segment escapes ("/feedback/../admin",
 *   "/feedback%2f..%2fadmin", "%2e%2e") can never ride a prefix match.
 *
 * Returns:
 *   true when the path is on the custom-host allowlist; false = middleware
 *   must 404 it (or, for legacy /board/**, 307 it — see legacyBoardPath).
 */
export function isCustomHostPathAllowed(pathname: string): boolean {
  const path = pathname.split(/[?#]/)[0];
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    // malformed percent-encoding — fall back to the raw form
  }
  if (path.split('/').includes('..') || decoded.split('/').includes('..')) {
    return false; // dot-segment escape, raw or encoded
  }
  return ALLOWED_EXACT.has(path) || ALLOWED_PREFIXES.some((p) => path.startsWith(p));
}

/**
 * Map a legacy /board/** URL to its canonical /feedback/** target.
 *
 * Canonical board URL is /feedback/boards/[slug] (public-API page);
 * canonical post URL is /feedback/[postId]. The old /board/[slug]/[postId]
 * tree used non-public APIs and never worked on a custom host.
 *
 * Args:
 *   pathname: URL pathname (query/fragment ignored).
 *
 * Returns:
 *   The canonical pathname for legacy board URLs —
 *   /board/:slug -> /feedback/boards/:slug,
 *   /board/:slug/:postId -> /feedback/:postId —
 *   or null when the path is not a legacy board URL.
 */
export function legacyBoardPath(pathname: string): string | null {
  const path = pathname.split(/[?#]/)[0];
  const m = path.match(/^\/board\/([^/]+)(?:\/([^/]+))?\/?$/);
  if (!m) return null;
  const [, slug, postId] = m;
  return postId ? `/feedback/${postId}` : `/feedback/boards/${slug}`;
}
