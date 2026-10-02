import { describe, it, expect } from 'vitest';
import { validateOAuthParams } from '@/lib/oauthParams';

const BASE: Record<string, string> = {
  response_type: 'code',
  client_id: 'zapier-faddy',
  redirect_uri: 'https://zapier.example/oauth/callback',
  state: 'opaque-state-1',
  code_challenge: 'a'.repeat(43),
  code_challenge_method: 'S256',
};

function qs(overrides: Record<string, string | null> = {}): URLSearchParams {
  const merged: Record<string, string> = { ...BASE };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) delete merged[key];
    else merged[key] = value;
  }
  return new URLSearchParams(merged);
}

describe('validateOAuthParams', () => {
  it('accepts a well-formed S256 authorization request', () => {
    const result = validateOAuthParams(qs());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.params).toEqual({
      responseType: 'code',
      clientId: 'zapier-faddy',
      redirectUri: 'https://zapier.example/oauth/callback',
      state: 'opaque-state-1',
      codeChallenge: 'a'.repeat(43),
      codeChallengeMethod: 'S256',
    });
  });

  it('ignores an incoming scope parameter entirely', () => {
    const result = validateOAuthParams(qs({ scope: 'users:read admin:write' }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.params).not.toHaveProperty('scope');
    expect(JSON.stringify(result.params)).not.toContain('users:read');
  });

  it('rejects response_type other than code', () => {
    const result = validateOAuthParams(qs({ response_type: 'token' }));
    expect(result).toEqual({ ok: false, error: expect.stringContaining('authorization code flow') });
  });

  it.each(['client_id', 'redirect_uri', 'state', 'code_challenge'])(
    'rejects a missing %s',
    (field) => {
      expect(validateOAuthParams(qs({ [field]: null })).ok).toBe(false);
    }
  );

  it('treats an empty required value as missing', () => {
    expect(validateOAuthParams(qs({ state: '' })).ok).toBe(false);
  });

  it('rejects a non-S256 code_challenge_method', () => {
    const plain = validateOAuthParams(qs({ code_challenge_method: 'plain' }));
    expect(plain.ok).toBe(false);
    expect(validateOAuthParams(qs({ code_challenge_method: null })).ok).toBe(false);
  });

  it('never echoes the request values back in an error message', () => {
    const secret = 'SUPER-SECRET-STATE-VALUE';
    const missing = validateOAuthParams(qs({ code_challenge: null, state: secret }));
    expect(missing.ok).toBe(false);
    if (missing.ok) return;
    expect(missing.error).not.toContain(secret);
    expect(missing.error).not.toContain(BASE.redirect_uri);
    expect(missing.error).not.toContain(BASE.client_id);
  });
});
