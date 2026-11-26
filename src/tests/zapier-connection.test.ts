import { describe, expect, it } from 'vitest';
import { hasZapierConnection } from '../services/zapierConnection';
import type { ApiKey } from '../services/apiKeyService';

describe('Zapier connection state', () => {
  it('uses the principal type, not the key name', () => {
    const key = { name: 'Zapier OAuth spoof', principal_type: 'api_key' } as ApiKey;
    expect(hasZapierConnection([key])).toBe(false);
    expect(hasZapierConnection([{ ...key, name: 'renamed', principal_type: 'zapier_oauth' }])).toBe(true);
  });
});
