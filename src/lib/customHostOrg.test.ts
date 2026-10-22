import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchCustomHostOrganization } from './customHostOrg';

// Custom hosts get branding via this server-side lookup (Step 3): the browser
// can't reach /api/organizations/** on a custom hostname (allowlist 404).

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function ok(organization: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: { organization } }),
  };
}

const ORG = {
  id: 'org-1',
  name: 'Acme',
  subdomain: 'acme',
  logo_url: 'https://x.supabase.co/logo.png',
  branding: { primaryColor: '#ff0000' },
};

describe('fetchCustomHostOrganization', () => {
  it('calls the public subdomain route and returns ONLY the whitelisted fields', async () => {
    fetchMock.mockResolvedValue(ok(ORG));

    const org = await fetchCustomHostOrganization('acme');

    expect(org).toEqual({
      name: 'Acme',
      logo_url: 'https://x.supabase.co/logo.png',
      branding: { primaryColor: '#ff0000' },
    });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/api/organizations/subdomain/acme');
  });

  it('drops non-whitelisted fields from the org record', async () => {
    fetchMock.mockResolvedValue(
      ok({
        ...ORG,
        stripe_customer_id: 'cus_secret',
        api_key: 'sk-live-secret',
        internal_notes: 'billing row',
      }),
    );

    const org = await fetchCustomHostOrganization('acme');

    expect(org).not.toHaveProperty('stripe_customer_id');
    expect(org).not.toHaveProperty('api_key');
    expect(org).not.toHaveProperty('internal_notes');
    expect(org).not.toHaveProperty('id');
    expect(org).not.toHaveProperty('subdomain');
  });

  it('non-string name -> null (malformed body)', async () => {
    fetchMock.mockResolvedValue(ok({ name: 42 }));
    expect(await fetchCustomHostOrganization('acme')).toBeNull();
  });

  it('non-string branding.primaryColor -> branding null', async () => {
    fetchMock.mockResolvedValue(ok({ name: 'Acme', branding: { primaryColor: 7 } }));
    expect(await fetchCustomHostOrganization('acme')).toEqual({
      name: 'Acme',
      logo_url: null,
      branding: null,
    });
  });

  it('primaryColor not matching ^#[0-9a-fA-F]{6}$ -> branding null (inline-CSS safety)', async () => {
    fetchMock.mockResolvedValue(
      ok({ name: 'Acme', branding: { primaryColor: 'red;background:url(//evil)' } }),
    );
    const org = await fetchCustomHostOrganization('acme');
    expect(org?.branding).toBeNull();

    fetchMock.mockResolvedValue(ok({ name: 'Acme', branding: { primaryColor: '#FFF' } }));
    expect((await fetchCustomHostOrganization('acme'))?.branding).toBeNull();
  });

  it('logo_url not starting with https:// -> null (<img src> safety)', async () => {
    fetchMock.mockResolvedValue(ok({ name: 'Acme', logo_url: 'http://evil/x.png' }));
    expect((await fetchCustomHostOrganization('acme'))?.logo_url).toBeNull();

    fetchMock.mockResolvedValue(ok({ name: 'Acme', logo_url: 'javascript:alert(1)' }));
    expect((await fetchCustomHostOrganization('acme'))?.logo_url).toBeNull();
  });

  it('encodes the subdomain', async () => {
    fetchMock.mockResolvedValue(ok(ORG));
    await fetchCustomHostOrganization('a/b');
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/api/organizations/subdomain/a%2Fb');
  });

  it('non-2xx -> null (free-tier fallback, no banner)', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    expect(await fetchCustomHostOrganization('acme')).toBeNull();
  });

  it('success:false -> null', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: false }),
    });
    expect(await fetchCustomHostOrganization('acme')).toBeNull();
  });

  it('network error -> null (never throws into the layout render)', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    expect(await fetchCustomHostOrganization('acme')).toBeNull();
  });
});
