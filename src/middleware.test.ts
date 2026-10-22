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

function makeReq(
  host: string,
  path = '/',
  extra: Record<string, string> = {},
  method = 'GET',
) {
  return new NextRequest(`http://next.test${path}`, {
    method,
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
    const res = await middleware(makeReq('feedback.acm.com', '/feedback', FORGED));
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
    const res = await middleware(makeReq('feedback.acm.com', '/images/icons/discord.svg'));
    expect(res.status).toBe(200);
    expect(forwarded(res, 'x-subdomain')).toBe('acme');
  });

  it('B: custom host "/" passes through (marketing layout 307s downstream)', async () => {
    resolveHostMock.mockResolvedValue({
      status: 'ok',
      subdomain: 'acme',
      organizationId: 'org-1',
    });
    const res = await middleware(makeReq('feedback.acm.com', '/'));
    expect(res.status).toBe(200); // NextResponse.next pass-through
    expect(res.headers.get('location')).toBeNull();
    expect(resolveHostMock).toHaveBeenCalledWith('feedback.acm.com');
    expect(forwarded(res, 'x-subdomain')).toBe('acme');
  });

  it('B: first-party "/" keeps the marketing landing (no redirect)', async () => {
    const res = await middleware(makeReq('acme.faddy.site', '/'));
    expect(res.headers.get('location')).toBeNull();
    expect(res.status).toBe(200); // NextResponse.next pass-through
    expect(forwarded(res, 'x-subdomain')).toBe('acme');
  });

  // Stage 3b-2: legacy /board/** is allowlisted on custom hosts so the
  // redirect route (app/board/[[...slug]]/route.ts) can emit a RELATIVE
  // Location — middleware itself never redirects (Next 15's middleware
  // adapter URL-parses Location headers and crashes on relative values).
  it('custom-host /board/:slug passes through to the redirect route', async () => {
    resolveHostMock.mockResolvedValue({
      status: 'ok',
      subdomain: 'acme',
      organizationId: 'org-1',
    });
    const res = await middleware(makeReq('feedback.acm.com', '/board/x'));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
    expect(forwarded(res, 'x-subdomain')).toBe('acme');
  });

  it('bare /board (no segment) is NOT allowlisted -> 404 before resolve', async () => {
    const res = await middleware(makeReq('feedback.acm.com', '/board'));
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(resolveHostMock).not.toHaveBeenCalled();
  });

  it('/board/a/b/c passes through (route 404s non-legacy depth)', async () => {
    resolveHostMock.mockResolvedValue({
      status: 'ok',
      subdomain: 'acme',
      organizationId: 'org-1',
    });
    const res = await middleware(makeReq('feedback.acm.com', '/board/a/b/c'));
    expect(res.status).toBe(200);
    expect(forwarded(res, 'x-subdomain')).toBe('acme');
  });

  it('first-party /board/** is NOT allowlist-gated (route 404s downstream)', async () => {
    const res = await middleware(makeReq('acme.faddy.site', '/board/x/y'));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
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

describe('central CSRF check (3b-2 step 6)', () => {
  const PREV_MODE = process.env.CSRF_MODE;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    delete process.env.CSRF_MODE; // default = log mode (never blocks)
  });

  afterEach(() => {
    logSpy.mockRestore();
    if (PREV_MODE === undefined) delete process.env.CSRF_MODE;
    else process.env.CSRF_MODE = PREV_MODE;
  });

  function csrfChecks(): Array<Record<string, unknown>> {
    return logSpy.mock.calls
      .map((c) => c[0])
      .filter(
        (c): c is Record<string, unknown> =>
          !!c && typeof c === 'object' && (c as { evt?: string }).evt === 'csrf_check',
      );
  }

  it('same-origin mutating /api request: 200 + verdict logged ok:true', async () => {
    const res = await middleware(
      makeReq('faddy.site', '/api/public/posts/1/upvote', {
        'sec-fetch-site': 'same-origin',
      }, 'POST'),
    );
    expect(res.status).toBe(200);
    expect(csrfChecks()).toContainEqual({
      evt: 'csrf_check',
      method: 'POST',
      path: '/api/public/posts/1/upvote',
      ok: true,
    });
  });

  it('log mode (default): cross-site POST passes through, verdict ok:false', async () => {
    const res = await middleware(
      makeReq('faddy.site', '/api/auth/login', {
        'sec-fetch-site': 'cross-site',
      }, 'POST'),
    );
    expect(res.status).toBe(200); // never blocks in log mode
    expect(csrfChecks()[0]).toMatchObject({ path: '/api/auth/login', ok: false });
  });

  it('enforce mode: cross-site POST -> 403 no-store', async () => {
    process.env.CSRF_MODE = 'enforce';
    const res = await middleware(
      makeReq('faddy.site', '/api/public/posts/1/upvote', {
        'sec-fetch-site': 'cross-site',
      }, 'POST'),
    );
    expect(res.status).toBe(403);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('enforce mode: no Sec-Fetch-Site and no Origin -> 403 (fail closed)', async () => {
    process.env.CSRF_MODE = 'enforce';
    const res = await middleware(
      makeReq('faddy.site', '/api/auth/login', {}, 'POST'),
    );
    expect(res.status).toBe(403);
  });

  it('enforce mode: same-origin POST still 200', async () => {
    process.env.CSRF_MODE = 'enforce';
    const res = await middleware(
      makeReq('faddy.site', '/api/auth/login', {
        'sec-fetch-site': 'same-origin',
      }, 'POST'),
    );
    expect(res.status).toBe(200);
  });

  it('GET requests are not evaluated', async () => {
    await middleware(
      makeReq('faddy.site', '/api/public/boards', { 'sec-fetch-site': 'cross-site' }),
    );
    expect(csrfChecks()).toEqual([]);
  });

  it('non-/api POST (OAuth authorize page action, server actions) is out of scope', async () => {
    const res = await middleware(
      makeReq('faddy.site', '/oauth/authorize', {
        'sec-fetch-site': 'cross-site',
      }, 'POST'),
    );
    expect(res.status).toBe(200);
    expect(csrfChecks()).toEqual([]);
  });

  it('INTERNAL_HOSTS machine calls are exempt (return before the check)', async () => {
    process.env.INTERNAL_HOSTS = 'host.docker.internal:5173';
    const res = await middleware(
      makeReq('host.docker.internal:5173', '/api/clusters/assign', {
        'sec-fetch-site': 'cross-site',
      }, 'POST'),
    );
    expect(res.status).toBe(200);
    expect(csrfChecks()).toEqual([]);
  });

  it('custom-host same-origin write: checked, passes, still gets tenant headers', async () => {
    resolveHostMock.mockResolvedValue({
      status: 'ok',
      subdomain: 'acme',
      organizationId: 'org-1',
    });
    const res = await middleware(
      makeReq('feedback.acm.com', '/api/public/posts/1/upvote', {
        'sec-fetch-site': 'same-origin',
      }, 'POST'),
    );
    expect(res.status).toBe(200);
    expect(csrfChecks()[0]).toMatchObject({ ok: true });
    expect(forwarded(res, 'x-subdomain')).toBe('acme');
    expect(forwarded(res, 'x-custom-host')).toBe('1');
  });
});
