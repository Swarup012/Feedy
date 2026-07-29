import api from '@/lib/api';

export type DiscordConnectionStatus = 'active' | 'disconnected' | 'error';

export interface DiscordStatus {
  connected: boolean;
  status: DiscordConnectionStatus | null;
  provider: string;
  provider_workspace_id: string | null; // Discord guild ID (snowflake)
  provider_channel_id: string | null;   // Monitored channel ID (snowflake)
  connected_at: string | null;
  updated_at: string | null;
}

export interface DiscordChannel {
  id: string;
  name: string;
}

export const discordService = {
  /**
   * Fetch Discord connection status for an org (never includes bot token).
   */
  async getStatus(orgId: string) {
    const response = await api.get(
      `/api/organizations/${orgId}/integrations/discord`
    );
    return response.data as {
      success: boolean;
      message: string;
      data: DiscordStatus;
    };
  },

  /**
   * List text channels in the connected guild (for the channel-picker).
   */
  async listChannels(orgId: string) {
    const response = await api.get(
      `/api/organizations/${orgId}/integrations/discord/channels`
    );
    return response.data as {
      success: boolean;
      message: string;
      data: { channels: DiscordChannel[] };
    };
  },

  /**
   * Set which channel to monitor for new messages.
   */
  async setChannel(orgId: string, channelId: string) {
    const response = await api.patch(
      `/api/organizations/${orgId}/integrations/discord/channel`,
      { channel_id: channelId }
    );
    return response.data as {
      success: boolean;
      message: string;
      data: { provider_channel_id: string; updated_at: string };
    };
  },

  /**
   * Soft-disconnect Discord (status = disconnected, row kept).
   */
  async disconnect(orgId: string) {
    const response = await api.delete(
      `/api/organizations/${orgId}/integrations/discord`
    );
    return response.data as {
      success: boolean;
      message: string;
      data: { status: string; provider: string; updated_at: string };
    };
  },

  /**
   * Start bot-invite flow — full browser navigation so Discord redirect
   * works correctly (same pattern as Intercom).
   */
  startConnect(orgId: string) {
    window.location.href = `/api/organizations/${orgId}/integrations/discord/connect`;
  },
};
