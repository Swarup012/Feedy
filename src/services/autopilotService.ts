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
};
