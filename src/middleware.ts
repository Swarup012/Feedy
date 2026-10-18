import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  computeTenantSig,
  extractSubdomainFromHost,
  isCustomHost,
} from "@/lib/proxyHelper";
import { resolveHost } from "@/lib/hostResolver";
import { isCustomHostPathAllowed } from "@/lib/customHostAllowlist";

// Multi-tenancy + Cloudflare-for-SaaS custom hostnames (Stage 3b item 3).
//
// Every request first has x-subdomain / x-tenant-sig / x-custom-host /
// x-middleware-subrequest DELETED — only values derived below survive.
// (Next replaces the downstream request header set wholesale with the
// middleware override list — router-utils/resolve-routes.js deletes any
// key not listed — so the deletions stick.)
//
// Custom host (isCustomHost — fail-closed from Host itself):
//   path not on allowlist  -> 404 (checked before any backend lookup)
//   unresolved / unknown   -> 404 (never falls through to any tenant)
//   backend unavailable    -> 503 (fail closed — never guesses a tenant)
//   ok                     -> x-subdomain + x-custom-host + x-tenant-sig
//                            (sig only after 'ok'; missing secret -> no sig
//                            -> proxy forwards no tenant at all)
// First-party host: subdomain derived from Host itself (never the client's
// header). The x-subdomain cookie stays a UI hint (design (b)), never trust
// input.

const TENANT_HEADERS = [
  "x-subdomain",
  "x-tenant-sig",
  "x-custom-host",
  "x-middleware-subrequest",
] as const;

// Refusal responses must never be cached (404 unknown host / disallowed path,
// 503 backend unavailable). Retry-After gives clients a bounded backoff for
// the transient case only.
const REFUSED_404_HEADERS = { "Cache-Control": "no-store" };
const REFUSED_503_HEADERS = { "Cache-Control": "no-store", "Retry-After": "5" };

// Machine-to-machine hosts (Stage 3b item 3 follow-up): docker healthchecks
// (Host: localhost:5173), the backend's cluster-assign call
// (FRONTEND_URL=http://host.docker.internal:5173), and the assign route's
// self-call to /api/clusters/refresh-label (NEXT_PUBLIC_APP_URL unset in the
// image -> http://localhost:5173). Exact Host-header match, comma-separated
// (include the port as sent). Matched hosts reach only the paths below and
// get NO tenant headers, NO signature, NO cookie — the routes behind them
// authenticate via x-internal-secret (clusters) or need nothing (healthcheck).
const INTERNAL_PATHS: ReadonlySet<string> = new Set([
  "/", // docker HEALTHCHECK (compose.prod.yml + Dockerfile)
  "/api/clusters/assign", // backend triggerClusterAssignment
  "/api/clusters/refresh-label", // assign route debounced self-call
]);

function internalHosts(): Set<string> {
  return new Set(
    (process.env.INTERNAL_HOSTS ?? "")
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
  );
}

function setSubdomainCookie(response: NextResponse, subdomain: string) {
  response.cookies.set("x-subdomain", subdomain, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function middleware(request: NextRequest) {
  const rawHost = request.headers.get("host");

  // Strip untrusted tenant/infra headers on EVERY request, first thing.
  const requestHeaders = new Headers(request.headers);
  for (const name of TENANT_HEADERS) requestHeaders.delete(name);

  // Internal machine hosts first: not custom, not first-party-tenanted.
  // Fail closed — anything outside the two lists is refused.
  if (rawHost && internalHosts().has(rawHost.trim().toLowerCase())) {
    if (!INTERNAL_PATHS.has(request.nextUrl.pathname)) {
      return new NextResponse(null, { status: 404, headers: REFUSED_404_HEADERS });
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (isCustomHost(rawHost)) {
    // Path allowlist first — no backend lookup for paths that can't be served.
    if (!isCustomHostPathAllowed(request.nextUrl.pathname)) {
      return new NextResponse(null, { status: 404, headers: REFUSED_404_HEADERS });
    }
    const resolved = await resolveHost(rawHost ?? "");
    if (resolved.status === "unresolved") {
      return new NextResponse(null, { status: 404, headers: REFUSED_404_HEADERS });
    }
    if (resolved.status === "unavailable") {
      return new NextResponse(null, { status: 503, headers: REFUSED_503_HEADERS });
    }

    // "/" is the marketing landing on first-party hosts; a custom host has
    // no landing to show — start visitors at the public feedback board.
    if (request.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/feedback", request.url));
    }

    requestHeaders.set("x-subdomain", resolved.subdomain);
    requestHeaders.set("x-custom-host", "1");
    const sig = await computeTenantSig(rawHost ?? "", resolved.subdomain);
    if (sig) requestHeaders.set("x-tenant-sig", sig);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    setSubdomainCookie(response, resolved.subdomain);
    return response;
  }

  const subdomain = extractSubdomainFromHost(rawHost);
  if (subdomain) requestHeaders.set("x-subdomain", subdomain);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (subdomain) setSubdomainCookie(response, subdomain);
  return response;
}

// Configuration for which routes middleware applies to (unchanged from Stage 2)
export const config = {
  matcher: [
    // Skip Next.js static resources
    "/((?!_next/static|_next/image|favicon.ico).*)",
    // Match all API routes
    "/api/(.*)",
  ],
};
