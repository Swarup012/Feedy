import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// ── Mocks ───────────────────────────────────────────────────────────────────

const apiGet = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  default: { get: apiGet },
  isPlanUpgradeRequired: () => false,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    logout: vi.fn(),
  }),
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => null,
}));

import { default as AppLayout } from '@/app/(public)/layout';

// ── Helpers ─────────────────────────────────────────────────────────────────

function setHostname(hostname: string) {
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: { hostname, protocol: 'http:', port: '', pathname: '/', search: '' },
  });
}

function orgResponse(organization: unknown) {
  return { data: { success: true, data: { organization } } };
}

const PAID_ORG = {
  id: 'org-1',
  name: 'Acme',
  subdomain: 'acme',
  logo_url: 'https://x.supabase.co/storage/v1/object/public/user-uploads/org-1/branding/logo.png',
  branding: { primaryColor: '#ff0000' },
};

beforeEach(() => {
  apiGet.mockReset();
  setHostname('acme.localhost');
});

afterEach(() => cleanup());

// ── Brand color vars + logo ─────────────────────────────────────────────────

describe('branding present (Starter/Pro with color + logo)', () => {
  it('sets --primary / --primary-foreground / --ring inline on the wrapper', async () => {
    apiGet.mockResolvedValue(orgResponse(PAID_ORG));
    const { container } = render(<AppLayout>page</AppLayout>);

    await waitFor(() => expect(apiGet).toHaveBeenCalled());

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.getPropertyValue('--primary')).toBe('0 100% 50%'); // #ff0000
    expect(wrapper.style.getPropertyValue('--primary-foreground')).toBe('0 0% 100%');
    expect(wrapper.style.getPropertyValue('--ring')).toBe('0 100% 50%');
  });

  it('sets the same vars on document.body (for portaled dialogs/dropdowns) and cleans up on unmount', async () => {
    apiGet.mockResolvedValue(orgResponse(PAID_ORG));
    const { unmount } = render(<AppLayout>page</AppLayout>);

    await waitFor(() =>
      expect(document.body.style.getPropertyValue('--primary')).toBe('0 100% 50%'),
    );
    expect(document.body.style.getPropertyValue('--primary-foreground')).toBe('0 0% 100%');
    expect(document.body.style.getPropertyValue('--ring')).toBe('0 100% 50%');

    unmount();
    // restored (empty string = declaration removed → theme defaults apply)
    expect(document.body.style.getPropertyValue('--primary')).toBe('');
    expect(document.body.style.getPropertyValue('--primary-foreground')).toBe('');
    expect(document.body.style.getPropertyValue('--ring')).toBe('');
  });

  it('renders the logo with alt = org name; hides it on error', async () => {
    apiGet.mockResolvedValue(orgResponse(PAID_ORG));
    render(<AppLayout>page</AppLayout>);

    const img = await screen.findByAltText('Acme');
    expect(img.getAttribute('src')).toBe(PAID_ORG.logo_url);
    expect(img.getAttribute('height')).toBe('32');

    fireEvent.error(img);
    expect(screen.queryByAltText('Acme')).toBeNull();
  });

  it('renders the paid footer: org name only, no Faddy wordmark', async () => {
    apiGet.mockResolvedValue(orgResponse(PAID_ORG));
    render(<AppLayout>page</AppLayout>);

    // org name appears in header + footer
    await waitFor(() => expect(screen.getAllByText('Acme').length).toBeGreaterThan(0));
    expect(screen.queryByText(/Powered by Faddy/)).toBeNull();
    // header shows the org name, not the Faddy fallback
    expect(screen.queryByText('Faddy')).toBeNull();
  });
});

// ── Free plan ───────────────────────────────────────────────────────────────

describe('Free plan (branding null)', () => {
  it('renders the small Powered by Faddy footer linking to faddy.site', async () => {
    apiGet.mockResolvedValue(
      orgResponse({ id: 'org-1', name: 'FreeCo', subdomain: 'freeco', logo_url: null, branding: null }),
    );
    render(<AppLayout>page</AppLayout>);

    const link = await screen.findByText('Powered by Faddy');
    expect(link.getAttribute('href')).toBe('https://faddy.site');
  });

  it('no --primary inline vars → current look', async () => {
    apiGet.mockResolvedValue(
      orgResponse({ id: 'org-1', name: 'FreeCo', subdomain: 'freeco', logo_url: null, branding: null }),
    );
    const { container } = render(<AppLayout>page</AppLayout>);

    await waitFor(() => expect(apiGet).toHaveBeenCalled());
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.getPropertyValue('--primary')).toBe('');
  });
});

// ── Invalid color ───────────────────────────────────────────────────────────

describe('invalid brand color', () => {
  it('is ignored — no styles set, footer still paid (branding object present)', async () => {
    apiGet.mockResolvedValue(
      orgResponse({ id: 'org-1', name: 'Acme', subdomain: 'acme', logo_url: null, branding: { primaryColor: 'red' } }),
    );
    const { container } = render(<AppLayout>page</AppLayout>);

    await waitFor(() => expect(screen.getAllByText('Acme').length).toBeGreaterThan(0));
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.getPropertyValue('--primary')).toBe('');
    expect(wrapper.style.getPropertyValue('--primary-foreground')).toBe('');
    // body untouched too
    expect(document.body.style.getPropertyValue('--primary')).toBe('');
    // still classified as paid — org-name footer, no Faddy flash
    expect(screen.queryByText(/Powered by Faddy/)).toBeNull();
  });
});

// ── Loading flash ───────────────────────────────────────────────────────────

describe('loading (org fetch pending)', () => {
  it('renders no footer at all while the subdomain fetch is pending', () => {
    apiGet.mockReturnValue(new Promise(() => {})); // never resolves
    render(<AppLayout>page</AppLayout>);

    expect(screen.queryByText(/Powered by Faddy/)).toBeNull();
    expect(document.querySelector('footer')).toBeNull();
  });
});

// ── Main domain ─────────────────────────────────────────────────────────────

describe('main domain (no subdomain)', () => {
  it('no fetch; Powered by Faddy immediately', async () => {
    setHostname('faddy.site');
    render(<AppLayout>page</AppLayout>);

    expect(apiGet).not.toHaveBeenCalled();
    expect(screen.getByText('Powered by Faddy')).toBeTruthy();
  });
});

// ── Admin unaffected ────────────────────────────────────────────────────────

describe('admin isolation', () => {
  it('no file under src/app/admin imports the branding-color util', () => {
    const adminDir = path.join(process.cwd(), 'src', 'app', 'admin');
    const offenders: string[] = [];

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name)) {
          const source = fs.readFileSync(full, 'utf8');
          if (source.includes('branding-color')) offenders.push(full);
        }
      }
    };

    walk(adminDir);
    expect(offenders).toEqual([]);
  });
});
