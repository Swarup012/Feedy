import type { ApiKey } from './apiKeyService';

export function hasZapierConnection(keys: ApiKey[]): boolean {
  return keys.some(key => key.principal_type === 'zapier_oauth');
}
