import { NextRequest, NextResponse } from 'next/server';
import { extractAuthHeader, buildBackendHeaders, BACKEND_URL } from '@/lib/proxyHelper';

/**
 * Proxy for the backend's GET/POST /api/oauth/authorize.
 *
 * Follows the same pattern as src/app/api/auth/[...path]/route.ts: the
 * HttpOnly access_token cookie is turned into a Bearer header (see
 * proxyHelper — cookies are never read or logged here), and the browser's
 * Origin header is forwarded so the backend's consent CSRF check passes.
 */
async function handler(request: NextRequest) {
  try {
    const targetUrl = `${BACKEND_URL}/api/oauth/authorize${request.nextUrl.search}`;

    const authHeader = extractAuthHeader(request);

    const contentType = request.headers.get('content-type') ?? 'application/json';
    const extraHeaders: Record<string, string> = { 'Content-Type': contentType };
    if (request.headers.get('origin')) extraHeaders['origin'] = request.headers.get('origin')!;

    const headers = buildBackendHeaders(authHeader, extraHeaders);

    let body: BodyInit | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.arrayBuffer();
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    // Consent responses carry codes/redirects — never cacheable.
    nextResponse.headers.set('Cache-Control', 'no-store');
    nextResponse.headers.set('Pragma', 'no-cache');

    const setCookies = (response.headers as any).getSetCookie?.() ?? [];
    if (setCookies.length > 0) {
      setCookies.forEach((cookie: string) => {
        nextResponse.headers.append('set-cookie', cookie);
      });
    } else {
      const single = response.headers.get('set-cookie');
      if (single) nextResponse.headers.set('set-cookie', single);
    }

    return nextResponse;
  } catch (error: any) {
    const errorResponse = NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
    errorResponse.headers.set('Cache-Control', 'no-store');
    errorResponse.headers.set('Pragma', 'no-cache');
    return errorResponse;
  }
}

export const GET = handler;
export const POST = handler;
