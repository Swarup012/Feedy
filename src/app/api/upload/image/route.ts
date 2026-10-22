import { NextRequest, NextResponse } from 'next/server';
import {
  BACKEND_URL,
  buildBackendHeaders,
  extractAuthHeader,
  PublicOnlyProxyError,
} from '@/lib/proxyHelper';

// Upload proxy for the backend's POST /api/upload/image
// (Stage 3b-2 step 4 — replaces ImageUpload.tsx's hardcoded
// http://localhost:3000 + legacy Bearer header; design table row #5).
//
// Backend chain: authenticate + injectOrganization (app.js:324), then
// express-fileupload with limits.fileSize = 5MB + abortOnLimit
// (app.js:165-167); upload.controller.uploadImage re-checks 5MB. This proxy
// enforces the same 5MB while streaming (running byte counter, aborts
// mid-stream at the limit — chunked bodies with no Content-Length included),
// so an oversized upload is cut off here instead of consuming backend
// bandwidth; the backend stays the authority for the decoded multipart size.
//
// Multipart passthrough: request.body is streamed to the backend with the
// browser's own Content-Type (multipart/form-data; boundary included) —
// buildBackendHeaders' JSON default is overridden. No Cookie forwarding;
// auth is Authorization from the access_token cookie only. First-party only:
// /api/upload/** is outside /api/public/**, so buildBackendHeaders throws
// PublicOnlyProxyError on a custom host (-> 404), and middleware's allowlist
// 404s it before this route ever runs.

/** Mirrors the backend's express-fileupload limits.fileSize (5MB). */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Wrap a request body stream in a running byte counter. Emits chunks
 * through untouched until the cumulative size exceeds limit, then errors
 * the stream (the in-flight fetch reading it rejects) and flips `state.`
 * `overshot` so the handler can answer 413. Never buffers: each chunk is
 * forwarded as it arrives; only the counter is retained.
 *
 * Args:
 *   source: The incoming request body stream (null for bodyless requests).
 *   limit: Maximum cumulative bytes to forward.
 *   state: Shared flag object; `overshot` is set true when the limit trips.
 *
 * Returns:
 *   A ReadableStream to hand fetch as the request body, or null when
 *   source was null.
 */
function limitedBody(
  source: ReadableStream<Uint8Array> | null,
  limit: number,
  state: { overshot: boolean }
): ReadableStream<Uint8Array> | null {
  if (!source) return null;
  const reader = source.getReader();
  let received = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      received += value.byteLength;
      if (received > limit) {
        state.overshot = true;
        controller.error(new Error('upload body exceeds 5MB limit'));
        await reader.cancel();
        return;
      }
      controller.enqueue(value);
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

export async function POST(request: NextRequest) {
  const sizeState = { overshot: false };
  try {
    const authHeader = extractAuthHeader(request);
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated', message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be multipart/form-data' },
        { status: 415 }
      );
    }

    // Cheap pre-check when the browser declares Content-Length; the running
    // counter below is the authority (chunked uploads declare nothing).
    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 413 }
      );
    }

    const headers = await buildBackendHeaders(request, authHeader, {
      'Content-Type': contentType,
    });

    let res: Response;
    try {
      res = await fetch(`${BACKEND_URL}/api/upload/image`, {
        method: 'POST',
        headers,
        body: limitedBody(request.body, MAX_UPLOAD_BYTES, sizeState),
        duplex: 'half',
        signal: request.signal,
      } as RequestInit);
    } catch {
      if (sizeState.overshot) {
        return NextResponse.json(
          { success: false, error: 'File size exceeds 5MB limit' },
          { status: 413 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'backend unavailable' },
        { status: 502 }
      );
    }

    // JSON response ({data: {url, path}}): read + re-emit, strip set-cookie,
    // never cacheable (per-upload signed-ish storage URLs).
    const data = await res.json().catch(() => null);
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    const contentTypeOut = res.headers.get('content-type');
    if (contentTypeOut) responseHeaders.set('content-type', contentTypeOut);
    return NextResponse.json(data ?? { success: false, error: 'bad backend response' }, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error) {
    if (error instanceof PublicOnlyProxyError) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    console.error('Upload proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
