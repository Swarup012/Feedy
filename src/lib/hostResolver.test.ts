import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveHost, clearHostCache } from './hostResolver';

// Stage 3b item 2 — Feedy-side hostResolver: thin internal lookup with a
// ≤5s positive-only cache, no negative cache, in-flight dedup.

const PREV_INTERNAL = process.env.INTERNAL_API_SECRET;
const TEST_INTERNAL = 'test-internal-secret';

function okBody(subdomain = 'acme', organizationId = 'org-1') {
  return { success: true, host: 'feedback.acm.com', organization_id: organizationId, subdomain };
}
const NULL_BODY = { success: true, host: 'feedback.acm.com', organization_id: null, subdomain: null };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  clearHostCache();
  process.env.INTERNAL_API_SECRET = TEST_INTERNAL;
  fetchMock = vi.fn(async () => new Response(JSON.stringify(okBody()), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (PREV_INTERNAL === undefined) delete process.env.INTERNAL_API_SECRET;
  else process.env.INTERNAL_API_SECRET = PREV_INTERNAL;
});

describe('resolveHost — happy path', () => {
  it('returns ok with subdomain + organizationId and calls the internal endpoint', async () => {
    const result = await resolveHost('feedback.acm.com');
    expect(result).toEqual({ status: 'ok', subdomain: 'acme', organizationId: 'org-1' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${process.env.BACKEND_URL || 'http://localhost:3000'}/api/internal/host-lookup?host=feedback.acm.com`);
    expect((init as RequestInit).headers).toMatchObject({
      'x-internal-secret': TEST_INTERNAL,
    });
    expect((init as RequestInit).cache).toBe('no-store');
  });

  it('normalizes case/port/trailing-dot to one cache key', async () => {
    await resolveHost('Feedback.ACM.com:443');
    await resolveHost('feedback.acm.com.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('host=feedback.acm.com');
  });
});

describe('resolveHost — caching rules', () => {
  it('caches a positive result for ≤5s (second call, no fetch)', async () => {
    await resolveHost('feedback.acm.com');
    const again = await resolveHost('feedback.acm.com');
    expect(again.status).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT cache unresolved (200 + null org) — every call re-checks the backend', async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(NULL_BODY), { status: 200 }));
    expect(await resolveHost('unknown.example.com')).toEqual({ status: 'unresolved' });
    expect(await resolveHost('unknown.example.com')).toEqual({ status: 'unresolved' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does NOT cache 503 unavailable', async () => {
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ success: false }), { status: 503 })
    );
    expect(await resolveHost('feedback.acm.com')).toEqual({ status: 'unavailable' });
    expect(await resolveHost('feedback.acm.com')).toEqual({ status: 'unavailable' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does NOT cache network errors', async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error('ECONNREFUSED');
    });
    expect(await resolveHost('feedback.acm.com')).toEqual({ status: 'unavailable' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT cache non-JSON 200 bodies', async () => {
    fetchMock.mockImplementation(async () => new Response('<html>', { status: 200 }));
    expect(await resolveHost('feedback.acm.com')).toEqual({ status: 'unavailable' });
  });

  it('does NOT cache 401 (secret misconfig)', async () => {
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ success: false }), { status: 401 })
    );
    expect(await resolveHost('feedback.acm.com')).toEqual({ status: 'unavailable' });
    expect(await resolveHost('feedback.acm.com')).toEqual({ status: 'unavailable' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('expires the positive entry after 5s', async () => {
    vi.useFakeTimers();
    try {
      await resolveHost('feedback.acm.com');
      vi.advanceTimersByTime(5001);
      await resolveHost('feedback.acm.com');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('distinct hosts cache independently', async () => {
    await resolveHost('a.example.com');
    await resolveHost('b.example.com');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await resolveHost('a.example.com');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('resolveHost — in-flight dedup + guards', () => {
  it('coalesces concurrent lookups of the same host into one fetch', async () => {
    let release!: (r: Response) => void;
    fetchMock.mockImplementation(
      () => new Promise<Response>((resolve) => { release = resolve; })
    );
    const p1 = resolveHost('feedback.acm.com');
    const p2 = resolveHost('feedback.acm.com');
    release(new Response(JSON.stringify(okBody()), { status: 200 }));
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual({ status: 'ok', subdomain: 'acme', organizationId: 'org-1' });
    expect(r2).toEqual(r1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('empty host short-circuits without a fetch', async () => {
    expect(await resolveHost('   ')).toEqual({ status: 'unresolved' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
