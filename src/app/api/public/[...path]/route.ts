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

// Custom-host public API catch-all (Stage 3b item 4, design (a)/(b)).
//
// Serves GET/HEAD only — every other method answers 405 (Allow: GET, HEAD).
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
// Backend call has a hard 10s timeout -> 504; network failure -> 502.

const ALLOW_HEADER = 'GET, HEAD';
const TIMEOUT_MS = 10_000;

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

function badRequest(reason: string): NextResponse {
  return NextResponse.json(
    { success: false, error: `rejected public path: ${reason}` },
    { status: 400 }
  );
}

function methodNotAllowed(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405, headers: { Allow: ALLOW_HEADER } }
  );
}

async function proxy(
  request: NextRequest,
  method: 'GET' | 'HEAD'
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
  const headers = await buildBackendHeaders(
    request,
    custom ? null : extractAuthHeader(request)
  );

  // 4. backend call with hard timeout
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
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

  // 5. response: strip Set-Cookie + hop-by-hop + decode artifacts
  const responseHeaders = new Headers();
  res.headers.forEach((value, key) => {
    if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

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

export async function POST() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

export async function OPTIONS() {
  return methodNotAllowed();
}
