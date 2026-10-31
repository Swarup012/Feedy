import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, DELETE } from '@/app/api/organizations/[organizationId]/end-users/[userId]/route';
import { BACKEND_URL } from '@/lib/proxyHelper';

const params = {
  params: Promise.resolve({ organizationId: 'org-1', userId: 'user-1' }),
};

let fetchMock: ReturnType<typeof vi.fn>;

function makeReq(cookie = 'access_token=tok123') {
  return new NextRequest(
    'http://localhost:3000/api/organizations/org-1/end-users/user-1',
    {
      method: 'GET',
      headers: {
        host: 'acme.faddy.site',
        cookie,
      },
    }
  );
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('end-user detail proxy', () => {
  it('exports both GET and DELETE', () => {
    expect(typeof GET).toBe('function');
    expect(typeof DELETE).toBe('function');
  });

  it('GET forwards the auth header, returns the backend status and body', async () => {
    const payload = { success: true, data: { id: 'user-1' } };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const res = await GET(makeReq(), params);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(payload);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      `${new URL(BACKEND_URL).origin}/api/organizations/org-1/end-users/user-1`
    );
    expect(init.method).toBe('GET');
    expect(init.headers['Authorization']).toBe('Bearer tok123');
  });

  it('GET without access_token cookie -> 401, no backend call', async () => {
    const res = await GET(makeReq(''), params);
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
