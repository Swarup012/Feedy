import api from '@/lib/api';

export type AutopilotSuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface AutopilotSuggestion {
  id: string;
  organization_id: string;
  source_text: string;
  suggested_title: string | null;
  suggested_body: string | null;
  possible_duplicate_post_id: string | null;
  status: AutopilotSuggestionStatus;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface AutopilotSettings {
  autopilot_mode: 'manual' | 'automatic';
  default_board_id: string | null;
}

export interface ChannelBoardMapping {
  id: string;
  integration_connection_id: string;
  channel_id: string;
  channel_name: string | null;
  board_id: string;
  autopilot_mode: 'manual' | 'automatic';
  last_message_id: string | null;
  status: 'active' | 'disconnected' | 'error';
  created_at: string;
  updated_at: string;
  // Joined fields from integration_connections
  integration_connections?: {
    organization_id: string;
    provider: string;
    provider_workspace_id: string;
  };
}

export const autopilotService = {
  async ingest(orgId: string, text: string) {
    const response = await api.post(`/api/organizations/${orgId}/autopilot/ingest`, { text });
    return response.data as {
      success: boolean;
      message: string;
      data: {
        discarded: boolean;
        reason?: string;
        suggestion?: AutopilotSuggestion;
        post?: any;
        automatic?: boolean;
      };
    };
  },

  async listSuggestions(orgId: string, status: AutopilotSuggestionStatus | 'all' = 'pending') {
    const response = await api.get(`/api/organizations/${orgId}/autopilot/suggestions`, {
      params: { status },
    });
    return response.data as {
      success: boolean;
      data: { suggestions: AutopilotSuggestion[] };
    };
  },

  async approve(orgId: string, suggestionId: string, boardId: string) {
    const response = await api.post(
      `/api/organizations/${orgId}/autopilot/suggestions/${suggestionId}/approve`,
      { board_id: boardId }
    );
    return response.data;
  },

  async reject(orgId: string, suggestionId: string) {
    const response = await api.post(
      `/api/organizations/${orgId}/autopilot/suggestions/${suggestionId}/reject`
    );
    return response.data;
  },

  async getSettings(orgId: string, provider: string) {
    const response = await api.get(`/api/organizations/${orgId}/integrations/${provider}/settings`);
    return response.data as {
      success: boolean;
      data: { settings: AutopilotSettings };
    };
  },

  async updateSettings(orgId: string, provider: string, settings: Partial<AutopilotSettings>) {
    const response = await api.patch(`/api/organizations/${orgId}/integrations/${provider}/settings`, settings);
    return response.data as {
      success: boolean;
      data: { settings: AutopilotSettings };
    };
  },

  // ─── Channel Mapping CRUD (Slack/Discord) ────────────────────────────

  async listChannelMappings(orgId: string, provider: string) {
    const response = await api.get(
      `/api/organizations/${orgId}/integrations/${provider}/mappings`
    );
    return response.data as {
      success: boolean;
      data: { mappings: ChannelBoardMapping[] };
    };
  },

  async createChannelMapping(
    orgId: string,
    provider: string,
    mapping: {
      channel_id: string;
      channel_name?: string;
      board_id: string;
      autopilot_mode?: 'manual' | 'automatic';
    }
  ) {
    const response = await api.post(
      `/api/organizations/${orgId}/integrations/${provider}/mappings`,
      mapping
    );
    return response.data as {
      success: boolean;
      data: { mapping: ChannelBoardMapping };
    };
  },

  async updateChannelMapping(
    orgId: string,
    provider: string,
    mappingId: string,
    updates: {
      board_id?: string;
      autopilot_mode?: 'manual' | 'automatic';
      channel_name?: string;
      status?: 'active' | 'disconnected' | 'error';
    }
  ) {
    const response = await api.patch(
      `/api/organizations/${orgId}/integrations/${provider}/mappings/${mappingId}`,
      updates
    );
    return response.data as {
      success: boolean;
      data: { mapping: ChannelBoardMapping };
    };
  },

  async deleteChannelMapping(orgId: string, provider: string, mappingId: string) {
    const response = await api.delete(
      `/api/organizations/${orgId}/integrations/${provider}/mappings/${mappingId}`
    );
    return response.data as {
      success: boolean;
    };
  },
};
