import api from '@/lib/api';

export type IntercomConnectionStatus = 'active' | 'disconnected' | 'error';

export interface IntercomStatus {
  connected: boolean;
  status: IntercomConnectionStatus | null;
  provider: string;
  provider_workspace_id: string | null;
  connected_at: string | null;
  updated_at: string | null;
}

export const intercomService = {
  /**
   * Fetch Intercom connection status for an org (never includes access token).
   */
  async getStatus(orgId: string) {
    const response = await api.get(
      `/api/organizations/${orgId}/integrations/intercom`
    );
    return response.data as {
      success: boolean;
      message: string;
      data: IntercomStatus;
    };
  },

  /**
   * Soft-disconnect Intercom (status = disconnected, row kept).
   */
  async disconnect(orgId: string) {
    const response = await api.delete(
      `/api/organizations/${orgId}/integrations/intercom`
    );
    return response.data as {
      success: boolean;
      message: string;
      data: { status: string; provider: string; updated_at: string };
    };
  },

  /**
   * Start OAuth — full browser navigation so Intercom redirect works with cookies.
   */
  startConnect(orgId: string) {
    window.location.href = `/api/organizations/${orgId}/integrations/intercom/connect`;
  },
};
