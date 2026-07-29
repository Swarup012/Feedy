import { NextRequest, NextResponse } from 'next/server';
import { extractAuthHeader, buildBackendHeaders, BACKEND_URL } from '@/lib/proxyHelper';

type Params = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, { params }: Params) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const targetUrl = `${BACKEND_URL}/api/auth/${path}${request.nextUrl.search}`;

    const authHeader = extractAuthHeader(request);

    // Forward the original Content-Type (e.g. multipart/form-data for uploads).
    // Fall back to application/json for normal API calls.
    const contentType = request.headers.get('content-type') ?? 'application/json';
    const extraHeaders: Record<string, string> = { 'Content-Type': contentType };
    if (request.headers.get('origin')) extraHeaders['origin'] = request.headers.get('origin')!;

    const headers = buildBackendHeaders(authHeader, extraHeaders);

    let body: BodyInit | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      // arrayBuffer preserves binary data for file uploads; safe for JSON too.
      body = await request.arrayBuffer();
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });

    // Forward ALL Set-Cookie headers from the backend (access_token + refresh_token)
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
