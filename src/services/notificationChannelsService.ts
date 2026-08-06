import api from '@/lib/api';

export interface NotificationChannel {
  id?: string;
  provider: 'slack' | 'discord';
  channel_id: string;
  channel_name?: string;
  event_type: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WriteScopeStatus {
  connected: boolean;
  has_write_scope: boolean;
}

export const notificationChannelsService = {
  /**
   * Get all notification channels for the organization.
   */
  async getChannels(orgId: string) {
    const response = await api.get(`/api/organizations/${orgId}/notification-channels`);
    return response.data;
  },

  /**
   * Replace all notification channels for the organization.
   */
  async replaceChannels(orgId: string, channels: NotificationChannel[], masterEnabled?: boolean) {
    const response = await api.put(`/api/organizations/${orgId}/notification-channels`, {
      channels,
      master_enabled: masterEnabled,
    });
    return response.data;
  },

  /**
   * Get write scope status for each connected provider.
   */
  async getWriteScopeStatus(orgId: string) {
    const response = await api.get(`/api/organizations/${orgId}/notification-channels/write-scope-status`);
    return response.data;
  },
};
