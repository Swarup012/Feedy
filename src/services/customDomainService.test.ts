import { describe, it, expect, beforeEach, vi } from 'vitest';

const get = vi.hoisted(() => vi.fn());
const post = vi.hoisted(() => vi.fn());
const del = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  default: { get, post, delete: del },
}));

import customDomainService from './customDomainService';

const DOMAIN = {
  id: 'dom-1',
  domain: 'feedback.acme.com',
  verification_token: 'tok-123',
  is_verified: false,
  hostname_status: 'pending',
  cert_status: 'pending',
  error_message: null,
  dns_records: [
    {
      type: 'CNAME',
      name: 'feedback',
      full_name: 'feedback.acme.com',
      value: 'customers.faddy.site',
      ttl: 3600,
      description: 'Points your subdomain to Faddy',
    },
  ],
};

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  del.mockReset();
});

describe('customDomainService', () => {
  it('getDomain returns the domain record', async () => {
    get.mockResolvedValue({ data: { data: DOMAIN } });
    expect(await customDomainService.getDomain()).toEqual(DOMAIN);
    expect(get).toHaveBeenCalledWith('/api/custom-domains');
  });

  it('getDomain 404 -> null (no domain yet)', async () => {
    get.mockRejectedValue({ response: { status: 404 } });
    expect(await customDomainService.getDomain()).toBeNull();
  });

  it('getDomain non-404 rethrows', async () => {
    get.mockRejectedValue({ response: { status: 500 } });
    await expect(customDomainService.getDomain()).rejects.toBeTruthy();
  });

  it('addDomain POSTs the domain and returns data', async () => {
    post.mockResolvedValue({ data: { data: DOMAIN } });
    const out = await customDomainService.addDomain('feedback.acme.com');
    expect(post).toHaveBeenCalledWith('/api/custom-domains', { domain: 'feedback.acme.com' });
    expect(out).toEqual(DOMAIN);
  });

  it('verifyDomain POSTs /:id/verify — the only CF-state-refreshing call', async () => {
    const verified = { ...DOMAIN, is_verified: true, hostname_status: 'active', cert_status: 'active' };
    post.mockResolvedValue({ data: { data: verified } });
    const out = await customDomainService.verifyDomain('dom-1');
    expect(post).toHaveBeenCalledWith('/api/custom-domains/dom-1/verify');
    expect(out.is_verified).toBe(true);
  });

  it('verifyDomain surfaces 400/429/403 errors untouched for the UI', async () => {
    const err = { response: { status: 400, data: { error: 'Domain verification failed' } } };
    post.mockRejectedValue(err);
    await expect(customDomainService.verifyDomain('dom-1')).rejects.toEqual(err);
  });

  it('deleteDomain DELETEs by id', async () => {
    del.mockResolvedValue({});
    await customDomainService.deleteDomain('dom-1');
    expect(del).toHaveBeenCalledWith('/api/custom-domains/dom-1');
  });
});
