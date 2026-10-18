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
    ['POST', POST],
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

describe('reject-list (design) — 400, NO backend call', () => {
  // '..' and '%2e%2e' as whole path segments are normalized away by the URL
  // parser before a request can reach this route; surviving substrings and
  // the encoded forms below DO reach it and are refused here. The full
  // design list is also unit-tested via findUnsafePublicPath.
  it.each([
    ['/api/public/x..y', 'literal ".." substring'],
    ['/api/public/a%2fb', '%2f'],
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
    ['/api/public//evil.com', 'double slash'],
    ['/api/public/https://evil.com/x', 'absolute URL'],
    ['/api/public/a%2fb', '%2f'],
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
