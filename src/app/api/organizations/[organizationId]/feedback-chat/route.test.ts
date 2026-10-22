import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/organizations/[organizationId]/feedback-chat/route';
import { computeTenantSig } from '@/lib/proxyHelper';

// Step 3 — admin feedback-chat proxy: pipes the backend SSE stream through;
// auth via access_token cookie; 401 without it; 404 on a custom host
// (PublicOnlyProxyError from buildBackendHeaders); no set-cookie forwarded.

const PREV_SECRET = process.env.TENANT_HEADER_SECRET;
const TEST_SECRET = 'test-secret-abc';

type Params = { params: Promise<{ organizationId: string }> };

function makeReq(opts: { headers?: Record<string, string>; body?: string } = {}) {
  return new NextRequest('http://localhost:3000/api/organizations/org-1/feedback-chat', {
    method: 'POST',
    headers: {
      host: 'acme.faddy.site',
      'content-type': 'application/json',
      ...opts.headers,
    },
    body: opts.body ?? JSON.stringify({ messages: [{ role: 'user', text: 'hi' }] }),
    duplex: 'half',
  } as unknown as ConstructorParameters<typeof NextRequest>[1]);
}

const params: Params = { params: Promise.resolve({ organizationId: 'org-1' }) };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.TENANT_HEADER_SECRET = TEST_SECRET;
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (PREV_SECRET === undefined) delete process.env.TENANT_HEADER_SECRET;
  else process.env.TENANT_HEADER_SECRET = PREV_SECRET;
});

describe('feedback-chat proxy', () => {
  it('pipes the SSE stream through with no-store, tenant + auth headers, no set-cookie', async () => {
    const sse = 'data: {"event":"chunk","data":"Hello"}\n\ndata: {"event":"done"}\n\n';
    fetchMock.mockImplementation(
      async () =>
        new Response(sse, {
          status: 200,
          headers: {
            'content-type': 'text/event-stream',
            'cache-control': 'no-cache',
            'set-cookie': 'a=1; Path=/',
          },
        })
    );

    const res = await POST(
      makeReq({ headers: { cookie: 'access_token=tok123' } }),
      params
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/event-stream');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(await res.text()).toBe(sse); // body piped byte-for-byte

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      `${new URL(process.env.BACKEND_URL || 'http://localhost:3000').origin}/api/organizations/org-1/feedback-chat`
    );
    expect(init.method).toBe('POST');
    expect(init.headers['x-subdomain']).toBe('acme');
    expect(init.headers['Authorization']).toBe('Bearer tok123');
    expect(init.headers['Accept']).toBe('text/event-stream');
    expect(init.body).toBe(JSON.stringify({ messages: [{ role: 'user', text: 'hi' }] }));
  });

  it('no access_token cookie -> 401, no backend call', async () => {
    const res = await POST(makeReq(), params);
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('custom host -> 404 (admin is first-party only), no backend call', async () => {
    const res = await POST(
      makeReq({
        headers: {
          host: 'feedback.acm.com',
          cookie: 'access_token=tok123',
          'x-subdomain': 'acme',
          'x-tenant-sig': await computeTenantSig('feedback.acm.com', 'acme'),
        },
      }),
      params
    );
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('backend 429 (rate limit JSON) passes through with status and body', async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ success: false, resetIn: 120 }), {
          status: 429,
          headers: { 'content-type': 'application/json' },
        })
    );
    const res = await POST(
      makeReq({ headers: { cookie: 'access_token=tok123' } }),
      params
    );
    expect(res.status).toBe(429);
    expect((await res.json()).resetIn).toBe(120);
  });

  it('network error -> 502', async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error('ECONNREFUSED');
    });
    const res = await POST(
      makeReq({ headers: { cookie: 'access_token=tok123' } }),
      params
    );
    expect(res.status).toBe(502);
  });
});
