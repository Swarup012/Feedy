/**
 * The Zapier OAuth authorize page must persist its own path + query string in
 * localStorage on mount, regardless of session state, so a logged-out user
 * (or a cached-user/dead-cookie user bounced to /login) can come back to the
 * exact /oauth/authorize request after authenticating.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';

const s = vi.hoisted(() => ({
  auth: {
    user: null,
    loading: false,
    isAuthenticated: false,
    refreshUser: async () => {},
  } as any,
}));

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => s.auth }));
vi.mock('@/context/OrganizationContext', () => ({
  useOrganization: () => ({ organizations: [], loading: false }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

import OAuthAuthorizePage from '@/app/oauth/authorize/page';

const RETURN_URL_KEY = 'authReturnUrl';
const SEARCH =
  '?response_type=code' +
  '&client_id=zapier-faddy' +
  '&redirect_uri=https%3A%2F%2Fzapier.example%2Foauth%2Fcallback' +
  '&state=opaque-state-1' +
  '&code_challenge=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
  '&code_challenge_method=S256';

function stubLocalStorage(): void {
  const data = new Map<string, string>();
  const store = {
    getItem: (key: string) => (data.has(key) ? (data.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      data.set(key, String(value));
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    clear: () => data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
  Object.defineProperty(window, 'localStorage', { configurable: true, writable: true, value: store });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: store });
}

function savedContext(): { path: string; search: string } | null {
  const raw = localStorage.getItem(RETURN_URL_KEY);
  return raw ? JSON.parse(raw) : null;
}

beforeEach(() => {
  stubLocalStorage();
  window.history.replaceState(null, '', `/oauth/authorize${SEARCH}`);
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: async () => ({ valid: true }) })
  ) as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
});

describe('OAuthAuthorizePage — return URL is saved on mount', () => {
  it('logged-out session (no cached user)', async () => {
    s.auth = {
      user: null,
      loading: false,
      isAuthenticated: false,
      refreshUser: async () => {},
    };

    render(<OAuthAuthorizePage />);

    await waitFor(() => {
      expect(savedContext()).toMatchObject({
        path: '/oauth/authorize',
        search: SEARCH,
      });
    });
    expect(savedContext()?.search).toBe(SEARCH);
  });

  it('cached user with a dead cookie (isAuthenticated true from cache)', async () => {
    s.auth = {
      user: {
        id: 'user-1',
        email: 'someone@faddy.site',
        current_organization_id: 'org-1',
        organization_role: 'owner',
      },
      loading: false,
      isAuthenticated: true,
      refreshUser: async () => {},
    };

    render(<OAuthAuthorizePage />);

    await waitFor(() => {
      expect(savedContext()).toMatchObject({
        path: '/oauth/authorize',
        search: SEARCH,
      });
    });
    expect(savedContext()?.search).toBe(SEARCH);
  });
});
