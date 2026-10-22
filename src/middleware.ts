import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  computeTenantSig,
  extractSubdomainFromHost,
  isCustomHost,
} from "@/lib/proxyHelper";
import { resolveHost } from "@/lib/hostResolver";
import { isCustomHostPathAllowed } from "@/lib/customHostAllowlist";
import { verifySameOriginRequest } from "@/lib/csrf";

// Multi-tenancy + Cloudflare-for-SaaS custom hostnames (Stage 3b item 3).
//
// Every request first has x-subdomain / x-tenant-sig / x-custom-host /
// x-middleware-subrequest DELETED — only values derived below survive.
// (Next replaces the downstream request header set wholesale with the
// middleware override list — router-utils/resolve-routes.js deletes any
// key not listed — so the deletions stick.)
//
// Custom host (isCustomHost — fail-closed from Host itself):
//   legacy /board/**     -> 307 to canonical /feedback/** (pure path rewrite,
//                           no backend lookup; unresolved hosts 404 on target)
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
const REFUSED_403_HEADERS = { "Cache-Control": "no-store" };

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

  // Central CSRF check (3b-2 step 6): every mutating /api request must be
  // provably same-origin (csrf.ts: Sec-Fetch-Site === 'same-origin', else
  // exact Origin == Host). Internal machine hosts returned above — no
  // browser, they authenticate via x-internal-secret — and non-/api POSTs
  // (server actions) are out of scope. Default CSRF_MODE=log records the
  // verdict without blocking (rollout telemetry, SameSite=Lax cookies make
  // real CSRF plausible); CSRF_MODE=enforce refuses with 403. Applies to
  // first-party AND custom-host requests — custom-host browser writes are
  // same-origin to the customer hostname.
  const mutatingApi =
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
    request.nextUrl.pathname.startsWith("/api");
  if (mutatingApi) {
    const sameOrigin = verifySameOriginRequest(request);
    console.log({
      evt: "csrf_check",
      method: request.method,
      path: request.nextUrl.pathname,
      ok: sameOrigin,
    });
    if (!sameOrigin && process.env.CSRF_MODE === "enforce") {
      return new NextResponse(null, { status: 403, headers: REFUSED_403_HEADERS });
    }
  }

  if (isCustomHost(rawHost)) {
    // NOTE: legacy /board/** -> /feedback/** and "/" -> /feedback are NOT
    // redirected here — Next 15's middleware adapter URL-parses every
    // Location header (relative values throw Invalid URL). They live in
    // app/board/[[...slug]]/route.ts and the (marketing) layout, which
    // emit relative Locations untouched.
    //
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
