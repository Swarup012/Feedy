import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// Legacy /board/** -> /feedback/** (Stage 3b-2). Route handler, not
// middleware: Next 15's middleware adapter URL-parses Location headers and
// crashes on relative values; route handlers pass through untouched, so
// these redirects stay origin-free (immune to X-Forwarded-Proto/Host).

function req(path: string, opts: { customHost?: boolean } = {}) {
  const { customHost = true } = opts;
  return new NextRequest(`http://next.test${path}`, {
    headers: customHost ? { 'x-custom-host': '1' } : {},
  });
}

function expectRelativeNoStore(res: Response) {
  const loc = res.headers.get('location');
  expect(loc).not.toBeNull();
  expect(loc!.startsWith('/')).toBe(true);
  expect(loc!.startsWith('//')).toBe(false);
  expect(loc!).not.toMatch(/^[a-z][a-z0-9+.-]*:/i);
  expect(res.headers.get('cache-control')).toBe('no-store');
}

describe('GET /board/** — legacy redirect', () => {
  it('/board/:slug -> 307 /feedback/boards/:slug', async () => {
    const res = await GET(req('/board/x'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('/feedback/boards/x');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('/board/:slug/:postId -> 307 /feedback/:postId', async () => {
    const res = await GET(req('/board/x/post-42'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('/feedback/post-42');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('preserves the query string', async () => {
    const res = await GET(req('/board/x?ref=tw'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('/feedback/boards/x?ref=tw');
  });

  // Open-redirect hard cases: Location must never be protocol-relative,
  // scheme-absolute, or any absolute URL at all — path+query only.
  it('/board//evil.com/x -> 404 (empty segment), no Location', async () => {
    const res = await GET(req('/board//evil.com/x'));
    expect(res.status).toBe(404);
    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('/board/%2f%2fevil.com: Location stays relative', async () => {
    const res = await GET(req('/board/%2f%2fevil.com'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('/feedback/boards/%2f%2fevil.com');
    expectRelativeNoStore(res);
  });

  it('/board/%5cevil.com (encoded backslash): Location stays relative', async () => {
    const res = await GET(req('/board/%5cevil.com'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('/feedback/boards/%5cevil.com');
    expectRelativeNoStore(res);
  });

  it('/board/..%2f (encoded dot-dot slash): Location stays relative', async () => {
    const res = await GET(req('/board/..%2f'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('/feedback/boards/..%2f');
    expectRelativeNoStore(res);
  });

  it('first-party (no x-custom-host) -> 404, no redirect', async () => {
    const res = await GET(req('/board/x', { customHost: false }));
    expect(res.status).toBe(404);
    expect(res.headers.get('location')).toBeNull();
  });

  it('bare /board and 3+ segment depth -> 404', async () => {
    expect((await GET(req('/board'))).status).toBe(404);
    expect((await GET(req('/board/a/b/c'))).status).toBe(404);
  });
});
