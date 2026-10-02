import { describe, it, expect, beforeEach } from 'vitest';
import { getPublicReturnUrl, saveReturnUrl, isSafeReturnUrl } from '@/lib/returnUrl';

const RETURN_URL_KEY = 'authReturnUrl';

// The jsdom environment exposes a localStorage without Storage methods, so stub one.
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

function setHost(url: string): void {
  Object.defineProperty(window, 'location', { configurable: true, value: new URL(url) });
}

function seed(path: string, search: string, subdomain: string | null = null): void {
  localStorage.setItem(
    RETURN_URL_KEY,
    JSON.stringify({ path, search, subdomain, timestamp: Date.now() })
  );
}

beforeEach(() => {
  stubLocalStorage();
  setHost('https://abc123.ngrok-free.app/oauth/authorize?response_type=code&state=abc');
});

describe('getPublicReturnUrl', () => {
  it('returns a same-origin relative path for /oauth/authorize on an ngrok host', () => {
    // saveReturnUrl stores subdomain 'abc123' for this host, which used to become
    // https://abc123.ngrok-free.app/...
    saveReturnUrl();
    expect(getPublicReturnUrl()).toBe('/oauth/authorize?response_type=code&state=abc');
  });

  it('keeps the previous subdomain behavior for /feedback', () => {
    seed('/feedback', '?tab=all', 'abc123');
    expect(getPublicReturnUrl()).toBe('https://abc123.ngrok-free.app/feedback?tab=all');
  });

  it('never returns a protocol-relative path', () => {
    seed('//evil.example/x', '?a=1');
    expect(getPublicReturnUrl()).toBeNull();
  });
});

describe('isSafeReturnUrl', () => {
  it('accepts a same-origin relative path', () => {
    expect(isSafeReturnUrl('/oauth/authorize?response_type=code')).toBe(true);
    expect(isSafeReturnUrl('/feedback?tab=all')).toBe(true);
  });

  it('rejects a protocol-relative path', () => {
    expect(isSafeReturnUrl('//evil.example/x')).toBe(false);
  });

  it('accepts an absolute URL on a subdomain of the current base host', () => {
    expect(isSafeReturnUrl('https://tenant.ngrok-free.app/feedback')).toBe(true);
    expect(isSafeReturnUrl('https://ngrok-free.app/feedback')).toBe(true);
  });

  it('rejects an absolute URL on another host', () => {
    expect(isSafeReturnUrl('https://evil.example/feedback')).toBe(false);
    expect(isSafeReturnUrl('http://evil.example/feedback')).toBe(false);
  });

  it('rejects non-http protocols', () => {
    expect(isSafeReturnUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeReturnUrl('data:text/html,<script>')).toBe(false);
  });
});
