import api from '@/lib/api';

export type SlackConnectionStatus = 'active' | 'disconnected' | 'error';

export interface SlackStatus {
  connected: boolean;
  status: SlackConnectionStatus | null;
  provider: string;
  provider_workspace_id: string | null; // Slack team ID
  provider_channel_id: string | null;   // Monitored channel ID
  connected_at: string | null;
  updated_at: string | null;
}

export interface SlackChannel {
  id: string;
  name: string;
}

export const slackService = {
  /**
   * Fetch Slack connection status for an org (never includes access token).
   */
  async getStatus(orgId: string) {
    const response = await api.get(
      `/api/organizations/${orgId}/integrations/slack`
    );
    return response.data as {
      success: boolean;
      message: string;
      data: SlackStatus;
    };
  },

  /**
   * List public channels in the connected workspace (for the channel-picker).
   */
  async listChannels(orgId: string) {
    const response = await api.get(
      `/api/organizations/${orgId}/integrations/slack/channels`
    );
    return response.data as {
      success: boolean;
      message: string;
      data: { channels: SlackChannel[] };
    };
  },

  /**
   * Set which channel to monitor for new messages.
   */
  async setChannel(orgId: string, channelId: string) {
    const response = await api.patch(
      `/api/organizations/${orgId}/integrations/slack/channel`,
      { channel_id: channelId }
    );
    return response.data as {
      success: boolean;
      message: string;
      data: { provider_channel_id: string; updated_at: string };
    };
  },

  /**
   * Soft-disconnect Slack (status = disconnected, row kept).
   */
  async disconnect(orgId: string) {
    const response = await api.delete(
      `/api/organizations/${orgId}/integrations/slack`
    );
    return response.data as {
      success: boolean;
      message: string;
      data: { status: string; provider: string; updated_at: string };
    };
  },

  /**
   * Start OAuth — full browser navigation so Slack redirect works with cookies.
   */
  startConnect(orgId: string) {
    window.location.href = `/api/organizations/${orgId}/integrations/slack/connect`;
  },
};
