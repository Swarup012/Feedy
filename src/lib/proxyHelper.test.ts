import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  buildBackendHeaders,
  isCustomHost,
  extractSubdomainFromHost,
  computeTenantSig,
  verifyTenantSig,
  toBackendUrl,
  PublicOnlyProxyError,
  BACKEND_URL,
} from '@/lib/proxyHelper';

// Stage 3b-1 (review): the incoming x-subdomain header is NEVER trusted.
//   1. first-party hosts derive the subdomain from Host itself
//   2. custom hosts accept x-subdomain only with a valid x-tenant-sig
//      (HMAC-SHA256 host|subdomain, keyed by TENANT_HEADER_SECRET)
//   3. forged tenant/secret never reaches the backend (middleware or not)
//   4. toBackendUrl: origin assertion + optional required-prefix check

const PREV_SECRET = process.env.TENANT_HEADER_SECRET;
const TEST_SECRET = 'test-secret-abc';

function makeReq(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: { host: 'acme.faddy.site', ...headers },
  });
}

beforeEach(() => {
  process.env.TENANT_HEADER_SECRET = TEST_SECRET;
});

afterEach(() => {
  if (PREV_SECRET === undefined) delete process.env.TENANT_HEADER_SECRET;
  else process.env.TENANT_HEADER_SECRET = PREV_SECRET;
});

describe('isCustomHost (fail closed)', () => {
  it.each([
    // absent host → restricted
    [null, true],
    ['', true],
    // valid first-party (suffix match)
    ['api.faddy.site', false],
    ['faddy.site', false],
    ['acme.faddy.site', false],
    ['FADDY.SITE', false],
    ['www.faddy.site:443', false],
    ['faddy.site.', false],
    ['localhost', false],
    ['localhost:5173', false],
    ['acme.localhost:5173', false],
    // malformed → custom/restricted (fail closed, even with a first-party suffix)
    ['host with space.faddy.site', true],
    ['a_b.faddy.site', true],
    ['evil.com:abc', true], // non-numeric port
    ['feedback.acm.com:443.', true], // normalizes cleanly, still not a suffix match
    ['faddy.site:443.', false], // port+trailing-dot both strip → apex first-party
    // custom hosts
    ['feedback.acm.com', true],
    ['feedback.temcia.com:443', true],
    ['feedback.acm.com.', true],
    ['evilfaddy.site', true],
    ['faddy.site.evil.com', true],
  ])('%s -> custom=%s', (host, expected) => {
    expect(isCustomHost(host as string | null)).toBe(expected);
  });

  it('IP literals: first-party in dev, custom/restricted in production', () => {
    expect(isCustomHost('[::1]')).toBe(false); // NODE_ENV=test in vitest
    expect(isCustomHost('127.0.0.1:5173')).toBe(false);
    vi.stubEnv('NODE_ENV', 'production');
    try {
      expect(isCustomHost('[::1]')).toBe(true);
      expect(isCustomHost('127.0.0.1')).toBe(true);
      expect(isCustomHost('[::1]:443')).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe('extractSubdomainFromHost (shared with middleware)', () => {
  it.each([
    ['acme.faddy.site', 'acme'],
    ['ACME.Faddy.Site:443', 'acme'],
    ['acme.faddy.site.', 'acme'],
    ['acme.localhost:5173', 'acme'],
    ['faddy.site', null], // apex
    ['localhost', null],
    ['www.faddy.site', null],
    ['api.faddy.site', null],
    ['admin.faddy.site', null],
    ['a.b.faddy.site', null], // exactly one label before the suffix
    ['a_b.faddy.site', null], // label must match ^[a-z0-9-]{1,63}$
    ['host with space.faddy.site', null],
    ['.faddy.site', null], // empty label
    ['feedback.acm.com', null], // custom — never host-derived
    ['127.0.0.1:5173', null],
    [null, null],
  ])('%s -> %s', (host, expected) => {
    expect(extractSubdomainFromHost(host as string | null)).toBe(expected);
  });
});

describe('tenant signature', () => {
  it('compute returns 64-char hex and is normalization-insensitive', async () => {
    const sig = await computeTenantSig('Feedback.ACM.com:443', 'acme');
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
    expect(await computeTenantSig('feedback.acm.com', 'acme')).toBe(sig);
  });

  it('verify accepts a freshly computed signature, rejects tampering', async () => {
    const sig = await computeTenantSig('feedback.acm.com', 'acme');
    expect(await verifyTenantSig('feedback.acm.com', 'acme', sig)).toBe(true);
    expect(await verifyTenantSig('feedback.acm.com', 'victim', sig)).toBe(false); // subdomain tampered
    expect(await verifyTenantSig('other.acm.com', 'acme', sig)).toBe(false); // host tampered
    expect(await verifyTenantSig('feedback.acm.com', 'acme', null)).toBe(false);
    expect(await verifyTenantSig('feedback.acm.com', 'acme', 'not-hex-but-64-chars-long-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBe(false);
    expect(await verifyTenantSig('feedback.acm.com', 'acme', 'zz'.padEnd(64, 'a'))).toBe(false);
  });

  it('fails closed when TENANT_HEADER_SECRET is unset', async () => {
    delete process.env.TENANT_HEADER_SECRET;
    expect(await computeTenantSig('feedback.acm.com', 'acme')).toBe('');
    expect(await verifyTenantSig('feedback.acm.com', 'acme', 'a'.repeat(64))).toBe(false);
  });
});

describe('first-party host: subdomain derived from Host, incoming header ignored', () => {
  it('middleware did NOT run + forged x-subdomain: backend gets the Host-derived tenant, never the forged one', async () => {
    const request = makeReq('/api/boards', {
      host: 'acme.faddy.site',
      'x-subdomain': 'evil', // forged (middleware never set it)
    });
    const headers = await buildBackendHeaders(request, null);
    expect(headers['x-subdomain']).toBe('acme'); // from Host
    expect(headers['x-subdomain']).not.toBe('evil');
    expect(headers['x-tenant-secret']).toBe(TEST_SECRET); // for the derived tenant
  });

  it('apex host + forged x-subdomain: no tenant, no secret at all', async () => {
    const request = makeReq('/api/boards', {
      host: 'faddy.site',
      'x-subdomain': 'evil',
    });
    const headers = await buildBackendHeaders(request, null);
    expect(headers['x-subdomain']).toBeUndefined();
    expect(headers['x-tenant-secret']).toBeUndefined();
  });

  it('forged tenant headers inside `extra` are stripped, derived value wins', async () => {
    const request = makeReq('/api/boards', { host: 'acme.faddy.site' });
    const headers = await buildBackendHeaders(request, null, {
      'x-subdomain': 'evil',
      'x-tenant-secret': 'forged-secret',
      'x-custom-host': '1',
      'x-tenant-sig': 'forged-sig',
      'x-middleware-subrequest': '1',
      'x-request-id': 'keep-me',
    });
    expect(headers['x-subdomain']).toBe('acme');
    expect(headers['x-tenant-secret']).toBe(TEST_SECRET); // env, not forged
    expect(headers['x-custom-host']).toBeUndefined();
    expect(headers['x-tenant-sig']).toBeUndefined();
    expect(headers['x-middleware-subrequest']).toBeUndefined();
    expect(headers['x-request-id']).toBe('keep-me');
  });
});

describe('custom host: x-subdomain accepted only with a valid x-tenant-sig', () => {
  it('middleware did NOT run + forged x-subdomain (no sig): no tenant, no secret', async () => {
    const request = makeReq('/api/public/boards', {
      host: 'feedback.acm.com',
      'x-subdomain': 'victim',
    });
    const headers = await buildBackendHeaders(request, null);
    expect(headers['x-subdomain']).toBeUndefined();
    expect(headers['x-tenant-secret']).toBeUndefined();
  });

  it('forged x-subdomain with a signature over a DIFFERENT subdomain: no tenant, no secret', async () => {
    const request = makeReq('/api/public/boards', {
      host: 'feedback.acm.com',
      'x-subdomain': 'victim',
      'x-tenant-sig': await computeTenantSig('feedback.acm.com', 'legit'),
    });
    const headers = await buildBackendHeaders(request, null);
    expect(headers['x-subdomain']).toBeUndefined();
    expect(headers['x-tenant-secret']).toBeUndefined();
  });

  it('signature over a DIFFERENT host: no tenant, no secret', async () => {
    const request = makeReq('/api/public/boards', {
      host: 'feedback.acm.com',
      'x-subdomain': 'acme',
      'x-tenant-sig': await computeTenantSig('evil.example.com', 'acme'),
    });
    const headers = await buildBackendHeaders(request, null);
    expect(headers['x-subdomain']).toBeUndefined();
    expect(headers['x-tenant-secret']).toBeUndefined();
  });

  it('valid middleware signature: subdomain + secret attached', async () => {
    const request = makeReq('/api/public/boards', {
      host: 'feedback.acm.com',
      'x-subdomain': 'acme',
      'x-tenant-sig': await computeTenantSig('feedback.acm.com', 'acme'),
    });
    const headers = await buildBackendHeaders(request, null);
    expect(headers['x-subdomain']).toBe('acme');
    expect(headers['x-tenant-secret']).toBe(TEST_SECRET);
    expect(headers['x-tenant-sig']).toBeUndefined(); // internal header never forwarded
  });
});

describe('buildBackendHeaders — base behavior', () => {
  it('attaches no secret when TENANT_HEADER_SECRET is unset (backend fail-closes)', async () => {
    delete process.env.TENANT_HEADER_SECRET;
    const headers = await buildBackendHeaders(
      makeReq('/api/boards', { host: 'acme.faddy.site' }),
      null
    );
    expect(headers['x-subdomain']).toBe('acme');
    expect(headers['x-tenant-secret']).toBeUndefined();
  });

  it('keeps Authorization and Content-Type defaults/overrides', async () => {
    const request = makeReq('/api/boards', { host: 'acme.faddy.site' });
    const withAuth = await buildBackendHeaders(request, 'Bearer tok');
    expect(withAuth['Authorization']).toBe('Bearer tok');
    expect(withAuth['Content-Type']).toBe('application/json');
    const noAuth = await buildBackendHeaders(request, null);
    expect(noAuth['Authorization']).toBeUndefined();
    const override = await buildBackendHeaders(request, null, {
      'Content-Type': 'multipart/form-data',
    });
    expect(override['Content-Type']).toBe('multipart/form-data');
  });
});

describe('custom-host guard (design test 16)', () => {
  async function expectPublicOnly(promise: Promise<unknown>) {
    let caught: unknown;
    try {
      await promise;
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(PublicOnlyProxyError);
    expect((caught as PublicOnlyProxyError).status).toBe(404);
  }

  it('16a — middleware ran: x-custom-host flag + custom Host refuses non-public path', async () => {
    const request = makeReq('/api/organizations/me', {
      host: 'feedback.acm.com',
      'x-custom-host': '1',
    });
    await expectPublicOnly(buildBackendHeaders(request, null));
  });

  it('16b — middleware did NOT run: Host alone refuses /api/organizations/me', async () => {
    const request = makeReq('/api/organizations/me', { host: 'feedback.acm.com' });
    await expectPublicOnly(buildBackendHeaders(request, null));
  });

  it('16b — custom Host allows /api/public/boards', async () => {
    const request = makeReq('/api/public/boards', { host: 'feedback.acm.com' });
    const headers = await buildBackendHeaders(request, null);
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('16c — first-party Host (api.faddy.site) never trips the guard', async () => {
    const request = makeReq('/api/organizations/me', { host: 'api.faddy.site' });
    await expect(buildBackendHeaders(request, null)).resolves.toBeDefined();
  });

  it('dev localhost subdomains never trip the guard', async () => {
    const request = makeReq('/api/organizations/me', { host: 'acme.localhost:5173' });
    await expect(buildBackendHeaders(request, null)).resolves.toBeDefined();
  });
});

describe('toBackendUrl — URL-origin assertion + required prefix', () => {
  it('builds relative paths on the BACKEND_URL origin', () => {
    const url = toBackendUrl('/api/public/boards?limit=10', '/api/public/');
    expect(url.origin).toBe(new URL(BACKEND_URL).origin);
    expect(url.pathname).toBe('/api/public/boards');
    expect(url.search).toBe('?limit=10');
  });

  it('refuses absolute URLs to another origin', () => {
    expect(() => toBackendUrl('https://evil.com/x')).toThrow(/refusing cross-origin/);
  });

  it('refuses protocol-relative URLs', () => {
    expect(() => toBackendUrl('//evil.com/x')).toThrow(/refusing cross-origin/);
  });

  it('without requiredPrefix keeps origin check only', () => {
    expect(() => toBackendUrl('/api/anything')).not.toThrow();
    expect(() => toBackendUrl('https://evil.com/x', '/api/public/')).toThrow(
      /refusing cross-origin/
    );
  });

  it('rejects literal ../ traversal normalized outside the prefix', () => {
    expect(() => toBackendUrl('/api/public/../../organizations', '/api/public/')).toThrow(
      /required prefix/
    );
  });

  it('rejects %2e%2e double-dot variants (URL-normalized outside the prefix)', () => {
    expect(() => toBackendUrl('/api/public/%2e%2e/%2e%2e/secret', '/api/public/')).toThrow(
      /required prefix/
    );
    expect(() => toBackendUrl('/api/public/%2E%2E/secret', '/api/public/')).toThrow(
      /required prefix/
    );
  });

  it('rejects encoded-slash traversal kept inside the raw pathname', () => {
    expect(() => toBackendUrl('/api/public/..%2f..%2forganizations', '/api/public/')).toThrow(
      /traversal/
    );
    expect(() => toBackendUrl('/api/public/%2e%2e%2fsecret', '/api/public/')).toThrow(
      /traversal/
    );
  });

  it('rejects malformed percent-encoding', () => {
    expect(() => toBackendUrl('/api/public/%', '/api/public/')).toThrow(/malformed/);
  });

  it('rejects paths outside the prefix entirely', () => {
    expect(() => toBackendUrl('/api/organizations/me', '/api/public/')).toThrow(
      /required prefix/
    );
  });
});

describe('NON_CUSTOM_HOST_SUFFIXES env override', () => {
  it('reclassifies hosts from the configured suffix list', async () => {
    vi.resetModules();
    vi.stubEnv('NON_CUSTOM_HOST_SUFFIXES', 'example.com');
    const mod = await import('@/lib/proxyHelper');
    expect(mod.isCustomHost('shop.example.com')).toBe(false);
    expect(mod.extractSubdomainFromHost('shop.example.com')).toBe('shop');
    expect(mod.isCustomHost('acme.faddy.site')).toBe(true); // no longer default-listed
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});

describe('NON_CUSTOM suffix default by NODE_ENV (D)', () => {
  const PREV = process.env.NON_CUSTOM_HOST_SUFFIXES;

  afterEach(() => {
    if (PREV === undefined) delete process.env.NON_CUSTOM_HOST_SUFFIXES;
    else process.env.NON_CUSTOM_HOST_SUFFIXES = PREV;
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('production default: faddy.site only — localhost hosts become custom/restricted', async () => {
    delete process.env.NON_CUSTOM_HOST_SUFFIXES;
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    const m = await import('@/lib/proxyHelper');
    expect(m.isCustomHost('acme.faddy.site')).toBe(false);
    expect(m.extractSubdomainFromHost('acme.faddy.site')).toBe('acme');
    expect(m.isCustomHost('faddy.site')).toBe(false);
    expect(m.isCustomHost('acme.localhost:5173')).toBe(true);
    expect(m.isCustomHost('localhost')).toBe(true);
  });

  it('non-production default: localhost only — faddy.site hosts become custom/restricted', async () => {
    delete process.env.NON_CUSTOM_HOST_SUFFIXES;
    vi.stubEnv('NODE_ENV', 'test');
    vi.resetModules();
    const m = await import('@/lib/proxyHelper');
    expect(m.isCustomHost('acme.localhost:5173')).toBe(false);
    expect(m.extractSubdomainFromHost('acme.localhost:5173')).toBe('acme');
    expect(m.isCustomHost('localhost')).toBe(false);
    expect(m.isCustomHost('acme.faddy.site')).toBe(true);
    expect(m.isCustomHost('faddy.site')).toBe(true);
  });

  it('explicit NON_CUSTOM_HOST_SUFFIXES wins over the NODE_ENV default in production', async () => {
    vi.stubEnv('NON_CUSTOM_HOST_SUFFIXES', 'faddy.site,localhost');
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    const m = await import('@/lib/proxyHelper');
    expect(m.isCustomHost('acme.localhost:5173')).toBe(false);
    expect(m.isCustomHost('acme.faddy.site')).toBe(false);
  });
});
