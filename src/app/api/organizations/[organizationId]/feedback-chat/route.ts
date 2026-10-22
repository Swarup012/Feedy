import { NextRequest, NextResponse } from 'next/server';
import {
  BACKEND_URL,
  buildBackendHeaders,
  extractAuthHeader,
  PublicOnlyProxyError,
} from '@/lib/proxyHelper';

// Proxy for the backend's POST /api/organizations/:orgId/feedback-chat
// (Stage 3b-2 step 3 — removes the last admin browser->backend direct call
// carrying client x-subdomain; design table row #6).
//
// The backend route (feedbackChat.routes.js) is authenticate + authorize
// (admin/owner) + requirePlan + rate limit, then streams an SSE response
// (text/event-stream) — this proxy PIPES res.body through untouched so the
// client's incremental reader keeps working. Auth: access_token cookie ->
// Authorization (extractAuthHeader); tenant: Host-derived via
// buildBackendHeaders. Admin stays first-party only: on a custom host
// buildBackendHeaders throws PublicOnlyProxyError (path outside
// /api/public/**) -> 404, and middleware's allowlist 404s it earlier anyway.

const TIMEOUT_MS = 120_000; // AI streaming can outlive a 30s cap; client abort propagates via request.signal

type Params = { params: Promise<{ organizationId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const authHeader = extractAuthHeader(request);
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { organizationId } = await params;
    const targetUrl = `${BACKEND_URL}/api/organizations/${organizationId}/feedback-chat`;

    const contentType = request.headers.get('content-type') ?? 'application/json';
    const headers = await buildBackendHeaders(request, authHeader, {
      'Content-Type': contentType,
      Accept: 'text/event-stream',
    });

    const body = await request.text();

    let res: Response;
    try {
      res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: body.length > 0 ? body : undefined,
        signal: AbortSignal.any([
          AbortSignal.timeout(TIMEOUT_MS),
          request.signal,
        ]),
      });
    } catch (err) {
      const aborted =
        err instanceof Error &&
        (err.name === 'TimeoutError' || err.name === 'AbortError');
      if (aborted) return new NextResponse(null, { status: 499 });
      return NextResponse.json(
        { success: false, error: 'backend unavailable' },
        { status: 502 }
      );
    }

    // Pipe the SSE (or pre-stream JSON error: 429/403/400) body through.
    // Strip set-cookie/decode artifacts; force no-store (AI output, rate-limit
    // JSON — never cacheable).
    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (
        !['set-cookie', 'connection', 'keep-alive', 'transfer-encoding',
          'content-encoding', 'content-length'].includes(lower)
      ) {
        responseHeaders.set(key, value);
      }
    });
    responseHeaders.set('Cache-Control', 'no-store');

    return new NextResponse(res.body, { status: res.status, headers: responseHeaders });
  } catch (error) {
    if (error instanceof PublicOnlyProxyError) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    console.error('Feedback-chat proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
