// src/services/apiKeyService.ts
import api from '@/lib/api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ApiKeyScope = 'read' | 'write';
export type ApiKeyEnvironment = 'live' | 'test';

export interface ApiKey {
  id: string;
  organization_id: string;
  name: string;
  key_prefix: string;
  scopes: ApiKeyScope[];
  environment: ApiKeyEnvironment;
  last_used_at: string | null;
  created_by: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface ApiKeyCreated extends ApiKey {
  raw_key: string; // Only returned on creation
}

export interface CreateApiKeyPayload {
  name: string;
  scopes?: ApiKeyScope[];
  environment?: ApiKeyEnvironment;
}

// ─────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────

export const apiKeyService = {
  /**
   * List all active API keys for current organization
   */
  async listKeys(): Promise<ApiKey[]> {
    const orgId = await this._getOrgId();
    const res = await api.get(`/api/orgs/${orgId}/api-keys`);
    return res.data.data.keys;
  },

  /**
   * Create a new API key. Returns key including raw_key (shown once).
   */
  async createKey(payload: CreateApiKeyPayload): Promise<ApiKeyCreated> {
    const orgId = await this._getOrgId();
    const res = await api.post(`/api/orgs/${orgId}/api-keys`, payload);
    return res.data.data;
  },

  /**
   * Revoke (soft-delete) an API key
   */
  async revokeKey(keyId: string): Promise<void> {
    const orgId = await this._getOrgId();
    await api.delete(`/api/orgs/${orgId}/api-keys/${keyId}`);
  },

  /**
   * Get current organization ID from context
   */
  async _getOrgId(): Promise<string> {
    // The api instance interceptors already attach org context,
    // but we need the raw ID for these endpoints.
    // Import from OrganizationContext is not possible in a service file,
    // so we fetch it from the /api/organizations/me endpoint.
    const res = await api.get('/api/organizations/me');
    return res.data.data.organization.id;
  },
};

export default apiKeyService;
