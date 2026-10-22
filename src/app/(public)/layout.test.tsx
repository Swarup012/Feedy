import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { computeTenantSig } from '@/lib/proxyHelper';

// ── Mocks ───────────────────────────────────────────────────────────────────

const headerStore = new Map<string, string>();
const fetchOrg = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => headerStore.get(name.toLowerCase()) ?? null,
  }),
}));

vi.mock('@/lib/customHostOrg', () => ({
  fetchCustomHostOrganization: fetchOrg,
}));

vi.mock('./layout-client', () => ({
  default: (props: {
    isCustomHost: boolean;
    initialOrganization: { name: string } | null;
  }) => null,
}));

import PublicLayout from './layout';

// Server layout (Stage 3b-2 step 3): org branding is fetched server-side,
// keyed ONLY on middleware-derived headers — and ONLY after verifying the
// tenant signature (HMAC over normalizeHost(host)|subdomain) that middleware
// stamped post-resolution. Forged or missing sig = no fetch, no branding.

const ORG = { name: 'Acme' };
const SECRET = 'layout-test-secret';

beforeEach(() => {
  headerStore.clear();
  fetchOrg.mockReset();
  fetchOrg.mockResolvedValue(ORG);
  process.env.TENANT_HEADER_SECRET = SECRET;
});

afterEach(() => {
  delete process.env.TENANT_HEADER_SECRET;
});

async function setCustomHostHeaders(sub: string, host: string, sig?: string) {
  headerStore.set('x-custom-host', '1');
  headerStore.set('x-subdomain', sub);
  headerStore.set('host', host);
  if (sig !== undefined) headerStore.set('x-tenant-sig', sig);
}

describe('(public) server layout — custom-host branding', () => {
  it('valid tenant sig: fetches branding once with the derived x-subdomain', async () => {
    const sig = await computeTenantSig('feedback.acm.com', 'acme');
    await setCustomHostHeaders('acme', 'feedback.acm.com', sig);

    const el = (await PublicLayout({ children: 'kid' })) as React.ReactElement;

    expect(fetchOrg).toHaveBeenCalledTimes(1);
    expect(fetchOrg).toHaveBeenCalledWith('acme');
    expect(el.props.isCustomHost).toBe(true);
    expect(el.props.initialOrganization).toEqual(ORG);
  });

  it('forged tenant sig: no fetch, no branding', async () => {
    await setCustomHostHeaders(
      'acme',
      'feedback.acm.com',
      'a'.repeat(63) + 'b', // 64 hex chars, wrong digest
    );

    const el = (await PublicLayout({ children: 'kid' })) as React.ReactElement;

    expect(fetchOrg).not.toHaveBeenCalled();
    expect(el.props.isCustomHost).toBe(true);
    expect(el.props.initialOrganization).toBeNull();
  });

  it('missing tenant sig: no fetch, no branding', async () => {
    await setCustomHostHeaders('acme', 'feedback.acm.com');

    const el = (await PublicLayout({ children: 'kid' })) as React.ReactElement;

    expect(fetchOrg).not.toHaveBeenCalled();
    expect(el.props.initialOrganization).toBeNull();
  });

  it('sig for a DIFFERENT host/subdomain pair does not validate', async () => {
    const sig = await computeTenantSig('other.acm.com', 'other');

    await setCustomHostHeaders('acme', 'feedback.acm.com', sig);

    const el = (await PublicLayout({ children: 'kid' })) as React.ReactElement;

    expect(fetchOrg).not.toHaveBeenCalled();
    expect(el.props.initialOrganization).toBeNull();
  });

  it('forged x-subdomain WITHOUT the middleware verdict fetches nothing', async () => {
    headerStore.set('x-subdomain', 'forged');

    const el = (await PublicLayout({ children: 'kid' })) as React.ReactElement;

    expect(fetchOrg).not.toHaveBeenCalled();
    expect(el.props.isCustomHost).toBe(false);
    expect(el.props.initialOrganization).toBeNull();
  });

  it('first-party host: no server-side branding fetch at all', async () => {
    const el = (await PublicLayout({ children: 'kid' })) as React.ReactElement;

    expect(fetchOrg).not.toHaveBeenCalled();
    expect(el.props.isCustomHost).toBe(false);
    expect(el.props.initialOrganization).toBeNull();
  });

  it('x-custom-host without x-subdomain fetches nothing (no tenant key)', async () => {
    headerStore.set('x-custom-host', '1');

    const el = (await PublicLayout({ children: 'kid' })) as React.ReactElement;

    expect(fetchOrg).not.toHaveBeenCalled();
    expect(el.props.isCustomHost).toBe(true);
    expect(el.props.initialOrganization).toBeNull();
  });

  it('mixed-case host with port validates against a normalized-host sig', async () => {
    // sig computed for the canonical form; incoming Host arrives as
    // "Feedback.Acm.com:443" — verifyTenantSig must normalize before HMAC.
    const sig = await computeTenantSig('feedback.acm.com', 'acme');
    await setCustomHostHeaders('acme', 'Feedback.Acm.com:443', sig);

    const el = (await PublicLayout({ children: 'kid' })) as React.ReactElement;

    expect(fetchOrg).toHaveBeenCalledTimes(1);
    expect(el.props.initialOrganization).toEqual(ORG);
  });

  it('malformed sig "abc": no fetch, no branding, no throw', async () => {
    await setCustomHostHeaders('acme', 'feedback.acm.com', 'abc');

    const el = (await PublicLayout({ children: 'kid' })) as React.ReactElement;

    expect(fetchOrg).not.toHaveBeenCalled();
    expect(el.props.initialOrganization).toBeNull();
  });

  it('TENANT_HEADER_SECRET unset: fails closed, no fetch even with a well-formed sig', async () => {
    delete process.env.TENANT_HEADER_SECRET;
    await setCustomHostHeaders('acme', 'feedback.acm.com', 'a'.repeat(64));

    const el = (await PublicLayout({ children: 'kid' })) as React.ReactElement;

    expect(fetchOrg).not.toHaveBeenCalled();
    expect(el.props.initialOrganization).toBeNull();
  });
});
