import { NextRequest, NextResponse } from 'next/server';
import {
  BACKEND_URL,
  PUBLIC_API_PREFIX,
  buildBackendHeaders,
  extractAuthHeader,
  findUnsafePublicPath,
  isCustomHost,
  toBackendUrl,
} from '@/lib/proxyHelper';
import { verifySameOriginRequest } from '@/lib/csrf';

// Custom-host public API catch-all (Stage 3b item 4, design (a)/(b)).
//
// GET/HEAD on any host; POST on FIRST-PARTY hosts only, and only for the
// three authenticated write routes the public feedback UI needs (upvote,
// comment, comment-like). Everything else non-GET/HEAD answers 405
// (Allow: GET, HEAD on custom hosts, GET, HEAD, POST on first-party).
// POST additionally requires a same-origin CSRF check (Sec-Fetch-Site /
// Origin) and a JSON body under POST_BODY_LIMIT_BYTES.
//
// The raw Cookie header is NEVER forwarded, on any host. First-party auth is
// Authorization only, built from the access_token cookie by extractAuthHeader
// (the backend's authenticate/optionalAuthenticate both read Authorization
// first — the cookie fallback there is never needed through this proxy).
// Custom hosts are unauthenticated public surface: no Authorization at all.
// Response side: Set-Cookie and hop-by-hop headers are always stripped
// (Set-Cookie keeps custom-host sessions isolated by construction), plus
// content-encoding/content-length, which are stale after fetch decodes the
// body.
//
// Path safety, in order, all before any backend call:
//   1. design reject-list (.., %2e%2e, //, absolute URLs, %2f %5c %00 %3f %23)
//      -> 400
//   2. toBackendUrl(path, '/api/public/'): origin assertion + required
//      prefix + decoded traversal + malformed encoding -> 400
// Backend call has a hard 10s timeout -> 504; network failure -> 502;
// redirect: 'manual' — a 3xx passes through, never followed server-side.
// Response side additionally drops every access-control-* header (CORS is
// meaningless through a same-origin proxy), and responses that carried
// Authorization are forced Cache-Control: private, no-store.

const ALLOWED_HEADER_GET_HEAD = 'GET, HEAD';
const ALLOWED_HEADER_FIRST_PARTY = 'GET, HEAD, POST';
const TIMEOUT_MS = 10_000;

/**
 * POST body size cap. The backend caps comment text at 2000 chars and the
 * upvote route takes no body at all; 8KB is generous for {content, parent_id}
 * and keeps a hostile client from pushing large payloads through the proxy.
 */
const POST_BODY_LIMIT_BYTES = 8 * 1024;

/**
 * Exact-match allowlist of backend POST routes reachable through this proxy
 * on first-party hosts (task 3b-2 step 2). One regex per backend route in
 * src/routes/public.routes.js that the public feedback pages mutate with;
 * anything else stays 405. Matched on the pathname AFTER the reject-list
 * (encoding tricks get the clearer 400 first). IDs are strict single path
 * segments: [A-Za-z0-9_-]+ — URL-safe identifiers only (uuid, nanoid, cuid,
 * numeric), no dots, no percent, no empty match, no second slash. The
 * anchors (^...$) pin the full pathname, so trailing segments never match.
 */
const ALLOWED_POST_PATHS: readonly RegExp[] = [
  /^\/api\/public\/posts\/[A-Za-z0-9_-]+\/upvote$/,
  /^\/api\/public\/posts\/[A-Za-z0-9_-]+\/comments$/,
  /^\/api\/public\/posts\/[A-Za-z0-9_-]+\/comments\/[A-Za-z0-9_-]+\/like$/,
];

function isAllowedPostPath(pathname: string): boolean {
  return ALLOWED_POST_PATHS.some((re) => re.test(pathname));
}

/** Response headers never passed back to the client. */
const STRIPPED_RESPONSE_HEADERS: ReadonlySet<string> = new Set([
  'set-cookie',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-encoding', // fetch decodes the body; the stale encoding must not pass
  'content-length', // stale after decode
]);

/**
 * CORS response headers are meaningless through a same-origin proxy and
 * actively misleading if forwarded (the backend's CORS policy is for
 * direct-to-backend access, which this proxy exists to eliminate). All
 * access-control-* headers are dropped on every response.
 */
function isStrippedResponseHeader(key: string): boolean {
  const lower = key.toLowerCase();
  return STRIPPED_RESPONSE_HEADERS.has(lower) || lower.startsWith('access-control-');
}

function badRequest(reason: string): NextResponse {
  return NextResponse.json(
    { success: false, error: `rejected public path: ${reason}` },
    { status: 400 }
  );
}

function methodNotAllowed(allowed: string): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405, headers: { Allow: allowed } }
  );
}

async function proxy(
  request: NextRequest,
  method: 'GET' | 'HEAD' | 'POST',
  body?: BodyInit
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  // 1. reject-list — before URL construction, no backend call
  const unsafe = findUnsafePublicPath(pathname);
  if (unsafe) return badRequest(unsafe);

  // 2. origin + required-prefix assertion (also catches malformed encoding)
  let url: URL;
  try {
    url = toBackendUrl(pathname + request.nextUrl.search, PUBLIC_API_PREFIX);
  } catch (err) {
    return badRequest(err instanceof Error ? err.message : 'invalid path');
  }

  // 3. headers: derived tenant via buildBackendHeaders; Authorization from
  //    the access_token cookie on first-party only; Cookie never forwarded
  const custom = isCustomHost(request.headers.get('host'));
  const authHeader = custom ? null : extractAuthHeader(request);
  const headers = await buildBackendHeaders(request, authHeader);

  // 4. backend call with hard timeout; redirect: 'manual' — a 3xx is passed
  //    through as-is, never followed server-side (the backend must not be
  //    able to steer this proxy at an arbitrary URL)
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const aborted =
      err instanceof Error &&
      (err.name === 'TimeoutError' || err.name === 'AbortError');
    return NextResponse.json(
      {
        success: false,
        error: aborted ? 'backend timeout' : 'backend unavailable',
      },
      { status: aborted ? 504 : 502 }
    );
  }

  // 5. response: strip Set-Cookie + hop-by-hop + decode artifacts +
  //    access-control-*; authenticated (first-party, Authorization attached)
  //    responses are never cacheable
  const responseHeaders = new Headers();
  res.headers.forEach((value, key) => {
    if (!isStrippedResponseHeader(key)) {
      responseHeaders.set(key, value);
    }
  });
  if (authHeader) {
    responseHeaders.set('Cache-Control', 'private, no-store');
  }

  if (method === 'HEAD') {
    return new NextResponse(null, { status: res.status, headers: responseHeaders });
  }
  return new NextResponse(res.body, { status: res.status, headers: responseHeaders });
}

export async function GET(request: NextRequest) {
  return proxy(request, 'GET');
}

export async function HEAD(request: NextRequest) {
  return proxy(request, 'HEAD');
}

/**
 * POST — first-party hosts only, allowlisted paths only, same-origin only.
 * Custom hosts stay GET/HEAD-only by design (d): a write on a customer
 * hostname has no session (host-only cookies) and must render as a login
 * link, never execute.
 */
export async function POST(request: NextRequest) {
  if (isCustomHost(request.headers.get('host'))) {
    return methodNotAllowed(ALLOWED_HEADER_GET_HEAD);
  }
  // Reject-list before the allowlist so a traversal attempt gets the clearer
  // 400 (and can never match an allowlist regex via encoding tricks).
  const unsafe = findUnsafePublicPath(request.nextUrl.pathname);
  if (unsafe) return badRequest(unsafe);
  if (!isAllowedPostPath(request.nextUrl.pathname)) {
    return methodNotAllowed(ALLOWED_HEADER_FIRST_PARTY);
  }
  if (!verifySameOriginRequest(request)) {
    return NextResponse.json(
      { success: false, error: 'Cross-origin request refused' },
      { status: 403 }
    );
  }

  // JSON body with a size cap; empty body is fine (upvote takes none)
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json(
      { success: false, error: 'unreadable request body' },
      { status: 400 }
    );
  }
  if (byteLength(body) > POST_BODY_LIMIT_BYTES) {
    return NextResponse.json(
      { success: false, error: 'request body too large' },
      { status: 413 }
    );
  }
  if (body.length > 0) {
    const contentType = (request.headers.get('content-type') ?? '').toLowerCase();
    if (!contentType.startsWith('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 415 }
      );
    }
  }

  return proxy(request, 'POST', body.length > 0 ? body : undefined);
}

export async function PUT() {
  return methodNotAllowed(ALLOWED_HEADER_GET_HEAD);
}

export async function PATCH() {
  return methodNotAllowed(ALLOWED_HEADER_GET_HEAD);
}

export async function DELETE() {
  return methodNotAllowed(ALLOWED_HEADER_GET_HEAD);
}

export async function OPTIONS() {
  return methodNotAllowed(ALLOWED_HEADER_GET_HEAD);
}

function byteLength(s: string): number {
  return new TextEncoder().encode(s).byteLength;
}
