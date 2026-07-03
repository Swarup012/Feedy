import { NextRequest, NextResponse } from 'next/server';
import { extractAuthHeader, buildBackendHeaders, BACKEND_URL } from '@/lib/proxyHelper';

type Params = { params: { path: string[] } };

async function handler(request: NextRequest, { params }: Params) {
  try {
    const path = params.path.join('/');
    const targetUrl = `${BACKEND_URL}/api/auth/${path}${request.nextUrl.search}`;

    const authHeader = extractAuthHeader(request);

    const headers = buildBackendHeaders(authHeader, {
      ...(request.headers.get('origin') ? { origin: request.headers.get('origin')! } : {}),
    });

    let body: string | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text();
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });

    // Forward ALL Set-Cookie headers from the backend (access_token + refresh_token)
    // response.headers.getSetCookie() returns an array — safe for multiple cookies.
    const setCookies = (response.headers as any).getSetCookie?.() ?? [];
    if (setCookies.length > 0) {
      // Append each cookie separately to avoid overwriting
      setCookies.forEach((cookie: string) => {
        nextResponse.headers.append('set-cookie', cookie);
      });
    } else {
      // Fallback for runtimes that don't support getSetCookie
      const single = response.headers.get('set-cookie');
      if (single) nextResponse.headers.set('set-cookie', single);
    }

    return nextResponse;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;

