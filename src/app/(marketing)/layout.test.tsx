import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mocks ───────────────────────────────────────────────────────────────────

const headerStore = new Map<string, string>();
const redirectMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => headerStore.get(name.toLowerCase()) ?? null,
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('./marketing-chrome', () => ({
  default: ({ children }: { children: React.ReactNode }) => null,
}));

import MarketingLayout from './layout';

// Server layout for the marketing segment: custom hostnames have no landing —
// "/" 307s to /feedback here (relative Location via next/navigation redirect)
// because middleware cannot emit relative Locations (adapter URL-parses them).

beforeEach(() => {
  headerStore.clear();
  redirectMock.mockReset();
});

describe('(marketing) server layout — custom-host landing redirect', () => {
  it('x-custom-host=1 -> redirect("/feedback")', async () => {
    headerStore.set('x-custom-host', '1');

    await MarketingLayout({ children: 'kid' });

    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith('/feedback');
  });

  it('first-party: no redirect, chrome renders', async () => {
    const el = (await MarketingLayout({ children: 'kid' })) as React.ReactElement;

    expect(redirectMock).not.toHaveBeenCalled();
    expect(el).not.toBeNull();
  });
});
