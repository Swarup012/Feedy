import api from '@/lib/api';

export type GitHubConnectionStatus = 'active' | 'disconnected' | 'error';

export interface GitHubStatus {
  connected: boolean;
  status: GitHubConnectionStatus | null;
  provider: string;
  provider_workspace_id: string | null;
  connected_at: string | null;
  updated_at: string | null;
}

export const githubService = {
  /**
   * Fetch GitHub connection status for an org (never includes tokens).
   */
  async getStatus(orgId: string) {
    const response = await api.get(
      `/api/organizations/${orgId}/integrations/github`
    );
    return response.data as {
      success: boolean;
      message: string;
      data: GitHubStatus;
    };
  },

  /**
   * Soft-disconnect GitHub (status = disconnected, row kept).
   * NOTE: This does NOT uninstall the App from GitHub — the user must do
   * that from GitHub's settings page.
   */
  async disconnect(orgId: string) {
    const response = await api.delete(
      `/api/organizations/${orgId}/integrations/github`
    );
    return response.data as {
      success: boolean;
      message: string;
      data: { status: string; provider: string; updated_at: string };
    };
  },

  /**
   * Start GitHub App installation — full browser navigation so GitHub
   * redirect works with cookies.
   */
  startConnect(orgId: string) {
    window.location.href = `/api/organizations/${orgId}/integrations/github/connect`;
  },
};
