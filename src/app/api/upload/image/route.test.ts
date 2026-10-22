import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/upload/image/route';
import { BACKEND_URL } from '@/lib/proxyHelper';

// Step 4 — upload proxy: multipart passthrough (Content-Type forwarded
// verbatim, no JSON default), auth via access_token cookie, 5MB content-length
// pre-check, first-party only, no localhost.

let fetchMock: ReturnType<typeof vi.fn>;

function makeReq(opts: { headers?: Record<string, string>; body?: BodyInit } = {}) {
  return new NextRequest('http://localhost:3000/api/upload/image', {
    method: 'POST',
    headers: {
      host: 'acme.faddy.site',
      'content-type': 'multipart/form-data; boundary=abc',
      cookie: 'access_token=tok123',
      ...opts.headers,
    },
    body: opts.body ?? 'x',
    duplex: 'half',
  } as unknown as ConstructorParameters<typeof NextRequest>[1]);
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('upload image proxy', () => {
  it('streams multipart to the backend with verbatim content-type + auth + tenant', async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ success: true, data: { url: 'https://cdn.example/x.png', path: 'o/posts/x' } }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
    );
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    expect((await res.json()).data.url).toBe('https://cdn.example/x.png');

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${new URL(BACKEND_URL).origin}/api/upload/image`);
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('multipart/form-data; boundary=abc'); // no JSON default
    expect(init.headers['Authorization']).toBe('Bearer tok123');
    expect(init.headers['x-subdomain']).toBe('acme');
  });

  it('no access_token -> 401, no backend call', async () => {
    const res = await POST(makeReq({ headers: { cookie: '' } }));
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('non-multipart content-type -> 415, no backend call', async () => {
    const res = await POST(
      makeReq({ headers: { 'content-type': 'application/json' }, body: '{}' })
    );
    expect(res.status).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('content-length over 5MB -> 413, no backend call', async () => {
    const res = await POST(
      makeReq({ headers: { 'content-length': String(6 * 1024 * 1024) } })
    );
    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('chunked body with NO content-length, >5MB cumulative -> 413 (running counter aborts mid-stream)', async () => {
    // 6 x 1MB chunks, no content-length header at all (chunked transfer).
    // The mock backend consumes the proxied stream; the route's byte counter
    // must forward exactly the first 5MB, error the stream at the 6th chunk,
    // and answer 413. The 6th chunk must never reach the backend.
    const chunk = new Uint8Array(1024 * 1024);
    let pulls = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        if (pulls <= 6) {
          controller.enqueue(chunk);
        } else {
          controller.close();
        }
      },
    });
    let forwardedChunks = 0;
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      const reader = (init.body as ReadableStream<Uint8Array>).getReader();
      try {
        for (;;) {
          const { done } = await reader.read();
          if (done) break;
          forwardedChunks += 1;
        }
      } catch {
        // The counter errored the stream — that is the expected path.
        throw new Error('request body stream aborted');
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });

    const res = await POST(
      makeReq({ headers: { 'content-length': '' }, body })
    );
    expect(res.status).toBe(413);
    expect((await res.json()).error).toContain('5MB');
    // Exactly 5MB (5 chunks) crossed the proxy; the 6th chunk was cut off.
    expect(forwardedChunks).toBe(5);
  });

  it('custom host -> 404, no backend call', async () => {
    const res = await POST(makeReq({ headers: { host: 'feedback.acm.com' } }));
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('backend 400 (invalid file) passes through', async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ success: false, message: 'Invalid file type. Only images are allowed' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        })
    );
    const res = await POST(makeReq());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toContain('Invalid file type');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });
});
