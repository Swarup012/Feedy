import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ============================================================
// Auth proxy (app/api/auth/[...path]/route.ts)
//
// Regression: the proxy built backend headers from the access_token cookie
// only and never forwarded the browser's Cookie header, so backend endpoints
// that read req.cookies — refreshSession (auth.controller.js ~:348) reading
// refresh_token — always saw no cookie and returned 401 after the access
// token expired.
//
// Verifies:
//   1. the incoming cookie header is forwarded to the backend verbatim
//   2. Authorization is still built from the access_token cookie
//   3. EVERY backend Set-Cookie header is passed back unchanged
//      (multiple values, HttpOnly/Domain/Path/SameSite/Secure/Max-Age intact)
//   4. no cookie → no cookie header forwarded (and no crash)
//   5. cookie values are never logged
// ============================================================

import { POST } from '@/app/api/auth/[...path]/route';

const SET_COOKIE_A =
  'access_token=new-access; Max-Age=604800; Path=/; Domain=.faddy.site; HttpOnly; Secure; SameSite=Lax';
const SET_COOKIE_B =
  'refresh_token=new-refresh; Max-Age=604800; Path=/; Domain=.faddy.site; HttpOnly; Secure; SameSite=Lax';

const BACKEND_BODY = {
  success: true,
  message: 'Session refreshed successfully',
};

function makeRequest(headers: Record<string, string>) {
  return new NextRequest('http://localhost:3000/api/auth/refresh', {
    method: 'POST',
    headers,
    body: '{}',
  });
}

function handlerArgs() {
  return { params: Promise.resolve({ path: ['refresh'] }) };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => {
    const headers = new Headers();
    headers.append('set-cookie', SET_COOKIE_A);
    headers.append('set-cookie', SET_COOKIE_B);
    return new Response(JSON.stringify(BACKEND_BODY), { status: 200, headers });
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('auth proxy — cookie forwarding', () => {
  it('forwards the browser cookie header verbatim to the backend', async () => {
    const request = makeRequest({
      cookie: 'access_token=abc; refresh_token=xyz',
      'content-type': 'application/json',
    });

    await POST(request, handlerArgs());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['cookie']).toBe('access_token=abc; refresh_token=xyz');
  });

  it('still builds Authorization from the access_token cookie', async () => {
    const request = makeRequest({
      cookie: 'access_token=abc; refresh_token=xyz',
      'content-type': 'application/json',
    });

    await POST(request, handlerArgs());

    const [, init] = fetchMock.mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer abc');
  });

  it('omits the cookie header when the browser sent no cookies', async () => {
    const request = makeRequest({ 'content-type': 'application/json' });

    await POST(request, handlerArgs());

    const [, init] = fetchMock.mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['cookie']).toBeUndefined();
    expect(headers['Authorization']).toBeUndefined();
  });
});

describe('auth proxy — Set-Cookie pass-back', () => {
  it('passes every backend Set-Cookie back unchanged (attributes intact)', async () => {
    const request = makeRequest({ 'content-type': 'application/json' });

    const response = await POST(request, handlerArgs());

    expect(response.status).toBe(200);
    const setCookies = response.headers.getSetCookie();
    expect(setCookies).toHaveLength(2);
    expect(setCookies).toContain(SET_COOKIE_A);
    expect(setCookies).toContain(SET_COOKIE_B);
    // Attributes ride in the raw string — spot-check the critical ones.
    for (const value of [SET_COOKIE_A, SET_COOKIE_B]) {
      expect(value).toContain('HttpOnly');
      expect(value).toContain('Domain=.faddy.site');
      expect(value).toContain('SameSite=Lax');
      expect(value).toContain('Secure');
      expect(value).toContain('Max-Age=604800');
      expect(value).toContain('Path=/');
    }
    // JSON body passes through untouched.
    expect(await response.json()).toEqual(BACKEND_BODY);
  });
});

describe('auth proxy — no cookie logging', () => {
  it('never writes cookie values to the console', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const request = makeRequest({
      cookie: 'access_token=abc; refresh_token=xyz',
      'content-type': 'application/json',
    });
    await POST(request, handlerArgs());

    const logged = [logSpy, infoSpy, warnSpy, errorSpy].flatMap((spy) =>
      spy.mock.calls.flat().map((arg) => String(arg))
    );
    expect(logged.join(' ')).not.toContain('refresh_token=xyz');
    expect(logged.join(' ')).not.toContain('access_token=abc');
  });
});
