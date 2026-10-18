import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware, config } from './middleware';
import { verifyTenantSig } from '@/lib/proxyHelper';
import { resolveHost } from '@/lib/hostResolver';

// Stage 3b item 3 — middleware.ts: header hygiene + custom-host resolve
//   * x-subdomain / x-tenant-sig / x-custom-host / x-middleware-subrequest
//     deleted on EVERY request before derived values are set
//   * custom host: disallowed path -> 404, unresolved -> 404,
//     unavailable -> 503 (never falls through to a tenant),
//     ok -> x-subdomain + x-custom-host + x-tenant-sig (sig only after ok)
//   * first-party: subdomain derived from Host, never the client header

vi.mock('@/lib/hostResolver', () => ({ resolveHost: vi.fn() }));
const resolveHostMock = vi.mocked(resolveHost);

const PREV_SECRET = process.env.TENANT_HEADER_SECRET;
const TEST_SECRET = 'test-secret-abc';

function makeReq(host: string, path = '/', extra: Record<string, string> = {}) {
  return new NextRequest(`http://next.test${path}`, {
    headers: { host, ...extra },
  });
}

/** Read a header as the downstream route handler would see it. */
function forwarded(res: NextResponse, name: string): string | null {
  return res.headers.get(`x-middleware-request-${name}`);
}

const FORGED = {
  'x-subdomain': 'evil',
  'x-tenant-sig': 'f'.repeat(64),
  'x-custom-host': '1',
  'x-middleware-subrequest': '1',
};

beforeEach(() => {
  process.env.TENANT_HEADER_SECRET = TEST_SECRET;
  resolveHostMock.mockReset();
});

afterEach(() => {
  if (PREV_SECRET === undefined) delete process.env.TENANT_HEADER_SECRET;
  else process.env.TENANT_HEADER_SECRET = PREV_SECRET;
});

describe('first-party host: derive from Host, strip forged headers', () => {
  it('acme.faddy.site: all four tenant headers stripped, derived x-subdomain only', async () => {
    const res = await middleware(makeReq('acme.faddy.site', '/api/boards', FORGED));
    expect(res).toBeInstanceOf(NextResponse);
    expect(forwarded(res, 'x-subdomain')).toBe('acme');
    expect(forwarded(res, 'x-tenant-sig')).toBeNull();
    expect(forwarded(res, 'x-custom-host')).toBeNull();
    expect(forwarded(res, 'x-middleware-subrequest')).toBeNull();
    expect(res.cookies.get('x-subdomain')?.value).toBe('acme');
    expect(resolveHostMock).not.toHaveBeenCalled(); // first-party never resolves
  });

  it('apex faddy.site: forged x-subdomain deleted, nothing derived', async () => {
    const res = await middleware(makeReq('faddy.site', '/api/boards', FORGED));
    expect(forwarded(res, 'x-subdomain')).toBeNull();
    expect(forwarded(res, 'x-tenant-sig')).toBeNull();
    expect(forwarded(res, 'x-custom-host')).toBeNull();
    expect(res.cookies.get('x-subdomain')).toBeUndefined();
  });

  it('www.faddy.site: no subdomain', async () => {
    const res = await middleware(makeReq('www.faddy.site', '/', FORGED));
    expect(forwarded(res, 'x-subdomain')).toBeNull();
    expect(res.cookies.get('x-subdomain')).toBeUndefined();
  });
});

describe('custom host: resolve + path allowlist', () => {
  it("ok: x-subdomain + x-custom-host + valid x-tenant-sig set (replacing forged values)", async () => {
    resolveHostMock.mockResolvedValue({
      status: 'ok',
      subdomain: 'acme',
      organizationId: 'org-1',
    });
    const res = await middleware(makeReq('feedback.acm.com', '/board/x', FORGED));
    expect(res.status).toBe(200);
    expect(forwarded(res, 'x-subdomain')).toBe('acme'); // forged 'evil' gone
    expect(forwarded(res, 'x-custom-host')).toBe('1'); // derived, not client's
    const sig = forwarded(res, 'x-tenant-sig');
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
    expect(sig).not.toBe(FORGED['x-tenant-sig']); // forged sig replaced
    expect(await verifyTenantSig('feedback.acm.com', 'acme', sig)).toBe(true);
    expect(forwarded(res, 'x-middleware-subrequest')).toBeNull();
    expect(res.cookies.get('x-subdomain')?.value).toBe('acme');
    expect(resolveHostMock).toHaveBeenCalledWith('feedback.acm.com');
  });

  it('unresolved (unknown host) -> 404, no tenant headers', async () => {
    resolveHostMock.mockResolvedValue({ status: 'unresolved' });
    const res = await middleware(makeReq('unknown.example.com', '/', FORGED));
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('unavailable (backend down) -> 503, never falls through to a tenant', async () => {
    resolveHostMock.mockResolvedValue({ status: 'unavailable' });
    const res = await middleware(makeReq('feedback.acm.com', '/', FORGED));
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('retry-after')).toBe('5');
  });

  it('disallowed path -> 404 without any backend lookup', async () => {
    const res = await middleware(makeReq('feedback.acm.com', '/admin'));
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(resolveHostMock).not.toHaveBeenCalled();
  });

  it('disallowed API path -> 404 without any backend lookup', async () => {
    const res = await middleware(makeReq('feedback.acm.com', '/api/organizations/me'));
    expect(res.status).toBe(404);
    expect(resolveHostMock).not.toHaveBeenCalled();
  });

  it('ok but TENANT_HEADER_SECRET unset -> subdomain set, NO signature (fail closed downstream)', async () => {
    delete process.env.TENANT_HEADER_SECRET;
    resolveHostMock.mockResolvedValue({
      status: 'ok',
      subdomain: 'acme',
      organizationId: 'org-1',
    });
    const res = await middleware(makeReq('feedback.acm.com', '/feedback'));
    expect(res.status).toBe(200);
    expect(forwarded(res, 'x-subdomain')).toBe('acme');
    expect(forwarded(res, 'x-tenant-sig')).toBeNull();
  });

  it('allowed static asset path resolves normally', async () => {
    resolveHostMock.mockResolvedValue({
      status: 'ok',
      subdomain: 'acme',
      organizationId: 'org-1',
    });
    const res = await middleware(makeReq('feedback.acm.com', '/videos/landing_page.mp4'));
    expect(res.status).toBe(200);
    expect(forwarded(res, 'x-subdomain')).toBe('acme');
  });

  it('B: custom host "/" (marketing landing) redirects to /feedback after resolve ok', async () => {
    resolveHostMock.mockResolvedValue({
      status: 'ok',
      subdomain: 'acme',
      organizationId: 'org-1',
    });
    const res = await middleware(makeReq('feedback.acm.com', '/'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://next.test/feedback');
    expect(resolveHostMock).toHaveBeenCalledWith('feedback.acm.com');
  });

  it('B: first-party "/" keeps the marketing landing (no redirect)', async () => {
    const res = await middleware(makeReq('acme.faddy.site', '/'));
    expect(res.headers.get('location')).toBeNull();
    expect(res.status).toBe(200); // NextResponse.next pass-through
    expect(forwarded(res, 'x-subdomain')).toBe('acme');
  });
});

describe('internal machine hosts (INTERNAL_HOSTS env)', () => {
  const PREV_INTERNAL = process.env.INTERNAL_HOSTS;

  afterEach(() => {
    if (PREV_INTERNAL === undefined) delete process.env.INTERNAL_HOSTS;
    else process.env.INTERNAL_HOSTS = PREV_INTERNAL;
  });

  it('listed host + allowed path: pass-through, no tenant headers, no cookie, no resolveHost', async () => {
    process.env.INTERNAL_HOSTS = 'host.docker.internal:5173,localhost:5173';
    const res = await middleware(
      makeReq('host.docker.internal:5173', '/api/clusters/assign', FORGED)
    );
    expect(res.status).toBe(200); // NextResponse.next
    expect(forwarded(res, 'x-subdomain')).toBeNull();
    expect(forwarded(res, 'x-tenant-sig')).toBeNull();
    expect(forwarded(res, 'x-custom-host')).toBeNull();
    expect(forwarded(res, 'x-middleware-subrequest')).toBeNull(); // stripped
    expect(res.cookies.get('x-subdomain')).toBeUndefined();
    expect(resolveHostMock).not.toHaveBeenCalled(); // never resolves a tenant
  });

  it('healthcheck path "/" on listed host passes through', async () => {
    process.env.INTERNAL_HOSTS = 'localhost:5173';
    const res = await middleware(makeReq('localhost:5173', '/'));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('listed host + disallowed path -> 404 (fail closed, no tenant)', async () => {
    process.env.INTERNAL_HOSTS = 'localhost:5173';
    const res = await middleware(makeReq('localhost:5173', '/api/organizations/me'));
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(resolveHostMock).not.toHaveBeenCalled();
  });

  it('match is case-insensitive and trims whitespace', async () => {
    process.env.INTERNAL_HOSTS = ' Host.Docker.Internal:5173 ';
    const res = await middleware(
      makeReq('host.docker.internal:5173', '/api/clusters/refresh-label')
    );
    expect(res.status).toBe(200);
    expect(resolveHostMock).not.toHaveBeenCalled();
  });

  it('host NOT listed still takes the custom-host path (env gates the bypass)', async () => {
    process.env.INTERNAL_HOSTS = 'localhost:5173';
    resolveHostMock.mockResolvedValue({
      status: 'ok',
      subdomain: 'acme',
      organizationId: 'org-1',
    });
    const res = await middleware(makeReq('host.docker.internal:5173', '/feedback'));
    expect(res.status).toBe(200);
    expect(forwarded(res, 'x-subdomain')).toBe('acme'); // resolved tenant, not bypassed
    expect(resolveHostMock).toHaveBeenCalledWith('host.docker.internal:5173');
  });

  it('INTERNAL_HOSTS unset: no bypass at all (custom host still resolves)', async () => {
    delete process.env.INTERNAL_HOSTS;
    resolveHostMock.mockResolvedValue({
      status: 'ok',
      subdomain: 'acme',
      organizationId: 'org-1',
    });
    const res = await middleware(makeReq('host.docker.internal:5173', '/feedback'));
    expect(resolveHostMock).toHaveBeenCalled(); // treated as custom host
    expect(forwarded(res, 'x-subdomain')).toBe('acme');
  });
});

describe('config', () => {
  it('matcher unchanged from Stage 2', () => {
    expect(config.matcher).toEqual([
      '/((?!_next/static|_next/image|favicon.ico).*)',
      '/api/(.*)',
    ]);
  });
});
