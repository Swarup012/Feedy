import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  GET,
  HEAD,
  POST,
  PUT,
  PATCH,
  DELETE,
  OPTIONS,
} from '@/app/api/public/[...path]/route';
import {
  BACKEND_URL,
  computeTenantSig,
  findUnsafePublicPath,
} from '@/lib/proxyHelper';

// Item 4 — custom-host public API catch-all:
//   * GET/HEAD only (405 + Allow otherwise)
//   * custom hosts: NO Authorization, NO Cookie forwarded; first-party:
//     cookie extract (access_token -> Authorization) + Cookie forwarded
//   * response: Set-Cookie + hop-by-hop + content-encoding/content-length
//     always stripped
//   * reject-list (design): .., %2e%2e, //, absolute URLs, %2f %5c %00 %3f
//     %23, malformed encoding -> 400, NO backend call
//   * 10s timeout wiring -> 504 on TimeoutError, 502 on network error

const PREV_SECRET = process.env.TENANT_HEADER_SECRET;
const TEST_SECRET = 'test-secret-abc';

function makeReq(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: { host: 'acme.faddy.site', ...headers },
  });
}

function makePostReq(
  path: string,
  opts: { headers?: Record<string, string>; body?: string } = {}
) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: {
      host: 'acme.faddy.site',
      'content-type': 'application/json',
      'sec-fetch-site': 'same-origin',
      ...opts.headers,
    },
    body: opts.body,
    duplex: 'half',
  } as unknown as ConstructorParameters<typeof NextRequest>[1]);
}

let fetchMock: ReturnType<typeof vi.fn>;

function okBackend(body = '{"success":true}') {
  fetchMock.mockImplementation(
    async () =>
      new Response(body, {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'set-cookie': 'a=1; Path=/; HttpOnly',
          connection: 'keep-alive',
          'transfer-encoding': 'chunked',
        },
      })
  );
}

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

describe('GET — happy paths', () => {
  it('first-party: proxies with derived tenant + Authorization from access_token; Cookie never forwarded; strips set-cookie/hop-by-hop', async () => {
    okBackend();
    const res = await GET(
      makeReq('/api/public/boards?limit=10', {
        cookie: 'access_token=tok123; other=1',
      })
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('{"success":true}');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${new URL(BACKEND_URL).origin}/api/public/boards?limit=10`);
    expect(init.method).toBe('GET');
    expect(init.headers['x-subdomain']).toBe('acme'); // Host-derived
    expect(init.headers['Authorization']).toBe('Bearer tok123'); // from access_token cookie
    expect(init.headers['cookie']).toBeUndefined(); // raw Cookie never forwarded
    expect(init.signal).toBeInstanceOf(AbortSignal); // 10s timeout wired

    // response hygiene
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(res.headers.get('connection')).toBeNull();
    expect(res.headers.get('transfer-encoding')).toBeNull();
  });

  it('custom host with valid middleware signature: derived tenant forwarded, NO auth, NO cookie', async () => {
    okBackend();
    const res = await GET(
      makeReq('/api/public/boards', {
        host: 'feedback.acm.com',
        'x-subdomain': 'acme',
        'x-tenant-sig': await computeTenantSig('feedback.acm.com', 'acme'),
        cookie: 'access_token=tok123', // must NOT be forwarded on custom hosts
      })
    );
    expect(res.status).toBe(200);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['x-subdomain']).toBe('acme');
    expect(init.headers['x-tenant-secret']).toBe(TEST_SECRET);
    expect(init.headers['Authorization']).toBeUndefined();
    expect(init.headers['cookie']).toBeUndefined();
    expect(init.headers['x-tenant-sig']).toBeUndefined(); // never forwarded to backend
  });

  it('custom host without a signature: NO tenant, NO auth, NO cookie (fail closed)', async () => {
    okBackend();
    await GET(
      makeReq('/api/public/boards', {
        host: 'feedback.acm.com',
        'x-subdomain': 'evil', // unsigned
        cookie: 'access_token=tok123',
      })
    );
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['x-subdomain']).toBeUndefined();
    expect(init.headers['x-tenant-secret']).toBeUndefined();
    expect(init.headers['Authorization']).toBeUndefined();
    expect(init.headers['cookie']).toBeUndefined();
  });

  it('HEAD: status + headers pass through, no body, set-cookie stripped', async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(null, {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'content-length': '42',
            'set-cookie': 'a=1; Path=/',
          },
        })
    );
    const res = await HEAD(makeReq('/api/public/boards'));
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(res.headers.get('content-length')).toBeNull(); // always stripped
  });
});

describe('method gating', () => {
  it.each([
    ['PUT', PUT],
    ['PATCH', PATCH],
    ['DELETE', DELETE],
    ['OPTIONS', OPTIONS],
  ] as const)('%s -> 405 with Allow: GET, HEAD', async (_name, handler) => {
    const res = await handler();
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, HEAD');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('POST (3b-2 Step 1) — first-party allowlisted writes only', () => {
  it.each([
    '/api/public/posts/p1/upvote',
    '/api/public/posts/p1/comments',
    '/api/public/posts/p1/comments/c1/like',
  ])('happy path: %s proxied with auth, tenant, body', async (path) => {
    okBackend('{"success":true,"data":{"ok":1}}');
    const res = await POST(
      makePostReq(path, {
        headers: { cookie: 'access_token=tok123' },
        body: JSON.stringify({ content: 'hi', parent_id: null }),
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, data: { ok: 1 } });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      `${new URL(BACKEND_URL).origin}${path}`
    );
    expect(init.method).toBe('POST');
    expect(init.headers['x-subdomain']).toBe('acme'); // Host-derived
    expect(init.headers['Authorization']).toBe('Bearer tok123');
    expect(init.headers['content-type'] ?? init.headers['Content-Type']).toBe(
      'application/json'
    );
    expect(init.body).toBe('{"content":"hi","parent_id":null}');
    expect(init.redirect).toBe('manual');

    // response hygiene still applies on POST
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });

  it('upvote with no body is proxied (empty body forwarded as undefined)', async () => {
    okBackend();
    const res = await POST(
      makePostReq('/api/public/posts/p1/upvote', {
        headers: { cookie: 'access_token=tok123' },
      })
    );
    expect(res.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBeUndefined();
  });

  it('custom host POST (even allowlisted path) -> 405 Allow: GET, HEAD, no backend call', async () => {
    const res = await POST(
      makePostReq('/api/public/posts/p1/upvote', {
        headers: {
          host: 'feedback.acm.com',
          'x-subdomain': 'acme',
          'x-tenant-sig': await computeTenantSig('feedback.acm.com', 'acme'),
        },
        body: '{}',
      })
    );
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, HEAD');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    '/api/public/boards', // GET-only route
    '/api/public/posts/p1/upvote/extra', // near-miss nested path
    '/api/public/posts', // collection root
    '/api/public/posts/p1/comments/c1/like/x', // over-nested
    '/api/public/x/y/upvote', // wrong collection segment entirely
  ])('first-party POST to non-allowlisted path %s -> 405, no backend call', async (path) => {
    const res = await POST(makePostReq(path, { body: '{}' }));
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, HEAD, POST');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('POST /api/public/posts//upvote (empty id segment) -> 400 from the reject-list (double slash, runs BEFORE the allowlist), no backend call', async () => {
    const res = await POST(makePostReq('/api/public/posts//upvote', { body: '{}' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('double slash');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('POST /api/public/posts/p.1/upvote (id contains a dot) -> 405 (strict id pattern [A-Za-z0-9_-]+ refuses "."), no backend call', async () => {
    const res = await POST(makePostReq('/api/public/posts/p.1/upvote', { body: '{}' }));
    expect(res.status).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('POST /api/public/posts/p%201/upvote (id contains percent-encoded space) -> 405 (strict id pattern refuses %), no backend call', async () => {
    const res = await POST(makePostReq('/api/public/posts/p%201/upvote', { body: '{}' }));
    expect(res.status).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cross-site Sec-Fetch-Site -> 403, no backend call', async () => {
    const res = await POST(
      makePostReq('/api/public/posts/p1/upvote', {
        headers: {
          'sec-fetch-site': 'cross-site',
          origin: 'https://evil.example',
          cookie: 'access_token=tok123',
        },
      })
    );
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('same-site (subdomain) Sec-Fetch-Site -> 403, no backend call', async () => {
    const res = await POST(
      makePostReq('/api/public/posts/p1/upvote', {
        headers: { 'sec-fetch-site': 'same-site' },
        body: '{}',
      })
    );
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('empty Sec-Fetch-Site header value -> 403 (present but not same-origin)', async () => {
    const res = await POST(
      makePostReq('/api/public/posts/p1/upvote', {
        headers: {
          'sec-fetch-site': '',
          origin: 'http://acme.faddy.site',
          cookie: 'access_token=tok123',
        },
      })
    );
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Sec-Fetch-Site: none -> 403 (address-bar navigation is not same-origin evidence)', async () => {
    const res = await POST(
      makePostReq('/api/public/posts/p1/upvote', {
        headers: { 'sec-fetch-site': 'none' },
        body: '{}',
      })
    );
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Origin-only same-origin (no Sec-Fetch-Site header at all) -> allowed', async () => {
    okBackend();
    const req = new NextRequest('http://localhost:3000/api/public/posts/p1/upvote', {
      method: 'POST',
      headers: {
        host: 'acme.faddy.site',
        'content-type': 'application/json',
        origin: 'http://acme.faddy.site',
        cookie: 'access_token=tok123',
      },
      body: '{}',
      duplex: 'half',
    } as unknown as ConstructorParameters<typeof NextRequest>[1]);
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('Origin mismatch (no Sec-Fetch-Site) -> 403, no backend call', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/public/posts/p1/upvote', {
        method: 'POST',
        headers: {
          host: 'acme.faddy.site',
          'content-type': 'application/json',
          origin: 'https://evil.example',
        },
        body: '{}',
        duplex: 'half',
      } as unknown as ConstructorParameters<typeof NextRequest>[1])
    );
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('body over 8KB -> 413, no backend call', async () => {
    const res = await POST(
      makePostReq('/api/public/posts/p1/comments', {
        body: JSON.stringify({ content: 'x'.repeat(9000) }),
      })
    );
    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('non-JSON content-type on a non-empty body -> 415, no backend call', async () => {
    const res = await POST(
      makePostReq('/api/public/posts/p1/comments', {
        headers: { 'content-type': 'text/plain' },
        body: 'hello',
      })
    );
    expect(res.status).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('path traversal in an allowlisted-looking POST -> 400, no backend call', async () => {
    const res = await POST(
      makePostReq('/api/public/posts/p1%2f..%2f..%2fupvote', { body: '{}' })
    );
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('reject-list (design) — 400, NO backend call', () => {
  // '..' and '%2e%2e' as whole path segments are normalized away by the URL
  // parser before a request can reach this route; surviving substrings and
  // the encoded forms below DO reach it and are refused here. The full
  // design list is also unit-tested via findUnsafePublicPath.
  it.each([
    ['/api/public/x..y', 'literal ".." substring'],
    ['/api/public/a%2fb', '%2f'],
    ['/api/public/a%2FB', '%2F uppercase'],
    ['/api/public/%252e%252e/secret', 'double-encoded %252e%252e'],
    ['/api/public/a%5cb', '%5c'],
    ['/api/public/a%00b', '%00'],
    ['/api/public/a%3fb', '%3f'],
    ['/api/public/a%23b', '%23'],
    ['/api/public//evil.com/x', 'double slash'],
    ['/api/public/https://evil.com/x', 'absolute URL attempt (contains //)'],
    ['/api/public/bad%zz', 'malformed encoding'],
  ])('%s -> 400', async (path) => {
    const res = await GET(makeReq(path));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('findUnsafePublicPath (unit — full design list)', () => {
  it.each([
    ['/api/public/../secret', '".." traversal'],
    ['/api/public/%2e%2e/secret', 'encoded traversal'],
    ['/api/public/%2E%2E/secret', 'encoded traversal (uppercase)'],
    ['/api/public/%252e%252e/secret', 'double-encoded traversal'],
    ['/api/public/%252E%252E/secret', 'double-encoded traversal (uppercase)'],
    ['/api/public//evil.com', 'double slash'],
    ['/api/public/https://evil.com/x', 'absolute URL'],
    ['/api/public/a%2fb', '%2f'],
    ['/api/public/a%2FB', '%2F uppercase'],
    ['/api/public/a%5c', '%5c'],
    ['/api/public/a%00b', '%00'],
    ['/api/public/a%3fb', '%3f'],
    ['/api/public/a%23b', '%23'],
  ])('flags %s', (path) => {
    expect(findUnsafePublicPath(path)).not.toBeNull();
  });

  it.each([
    '/api/public/boards',
    '/api/public/boards/acme-123/posts',
    '/api/public/posts/p1/upvote',
  ])('allows %s', (path) => {
    expect(findUnsafePublicPath(path)).toBeNull();
  });
});

describe('backend failures', () => {
  it('TimeoutError -> 504', async () => {
    fetchMock.mockImplementation(async () => {
      throw Object.assign(new Error('The operation timed out'), {
        name: 'TimeoutError',
      });
    });
    const res = await GET(makeReq('/api/public/boards'));
    expect(res.status).toBe(504);
    const body = await res.json();
    expect(body.error).toBe('backend timeout');
  });

  it('network error -> 502', async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error('ECONNREFUSED');
    });
    const res = await GET(makeReq('/api/public/boards'));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('backend unavailable');
  });
});

describe('response hardening (3b-2 Step 0)', () => {
  it('fetch is called with redirect: "manual" — 3xx is never followed server-side', async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: 'https://evil.example/steal' },
        })
    );
    const res = await GET(makeReq('/api/public/boards'));
    expect(fetchMock.mock.calls[0][1].redirect).toBe('manual');
    expect(res.status).toBe(302); // passed through, not followed
  });

  it('strips every access-control-* response header', async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response('{"success":true}', {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': 'https://evil.example',
            'access-control-allow-credentials': 'true',
            'access-control-expose-headers': 'x-subdomain',
          },
        })
    );
    const res = await GET(makeReq('/api/public/boards'));
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
    expect(res.headers.get('access-control-allow-credentials')).toBeNull();
    expect(res.headers.get('access-control-expose-headers')).toBeNull();
    expect(res.headers.get('content-type')).toBe('application/json');
  });

  it('first-party response that carried Authorization is forced private, no-store', async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response('{"success":true}', {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'cache-control': 'public, max-age=600', // backend default must not survive
          },
        })
    );
    const res = await GET(
      makeReq('/api/public/boards', { cookie: 'access_token=tok123' })
    );
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });

  it('unauthenticated first-party response keeps the backend cache policy', async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response('{"success":true}', {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'cache-control': 'public, max-age=600',
          },
        })
    );
    const res = await GET(makeReq('/api/public/boards'));
    expect(res.headers.get('cache-control')).toBe('public, max-age=600');
  });

  it('custom-host response (no Authorization) gets no forced no-store', async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response('{"success":true}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
    );
    const res = await GET(
      makeReq('/api/public/boards', { host: 'feedback.acm.com' })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBeNull();
  });
});
