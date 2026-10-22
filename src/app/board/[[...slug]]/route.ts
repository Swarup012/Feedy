import type { NextRequest } from "next/server";
import { legacyBoardPath } from "@/lib/customHostAllowlist";

// Legacy /board/** -> canonical /feedback/** on custom hosts (Stage 3b-2).
// A route handler, NOT middleware: Next 15's middleware adapter URL-parses
// every Location header (new NextURL(relative, {headers}) -> Invalid URL),
// so middleware can only emit absolute Locations. Route-handler responses
// pass through untouched — this is the only way to keep the redirect
// origin-free (immune to X-Forwarded-Proto/Host).
//
// Reachable because middleware allowlists /board/ on custom hosts; the
// handler itself gates on the middleware-derived x-custom-host header
// (stripped from inbound requests first thing). First-party requests:
// 404 — same as before the redirect existed.

function refuse(): Response {
  return new Response(null, {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest): Promise<Response> {
  if (request.headers.get("x-custom-host") !== "1") return refuse();

  const target = legacyBoardPath(request.nextUrl.pathname);
  if (!target) return refuse();

  // RELATIVE Location (path + query only) — never built from request.url or
  // forwarded headers; no-store so intermediaries don't cache the hop.
  return new Response(null, {
    status: 307,
    headers: {
      Location: target + request.nextUrl.search,
      "Cache-Control": "no-store",
    },
  });
}
