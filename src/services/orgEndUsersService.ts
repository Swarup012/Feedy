// services/orgEndUsersService.ts

import api from "@/lib/api";

export interface OrgEndUser {
  id: string;
  name: string | null;
  email: string | null;
  external_user_id: string | null;
  identity_type: string;
  custom_fields: Record<string, unknown>;
  created_at: string;
  last_seen_at: string | null;
  updated_at: string;
}

export interface OrgEndUserDetail extends OrgEndUser {
  user_id: string | null;
  verified_at: string | null;
}

export interface OrgEndUsersListResponse {
  users: OrgEndUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const orgEndUsersService = {
  /**
   * List org_end_users for an organization (paginated, searchable).
   */
  async getList(
    orgId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
    signal?: AbortSignal
  ): Promise<{ success: boolean; data: OrgEndUsersListResponse; error?: string }> {
    try {
      const response = await api.get(`/api/organizations/${orgId}/end-users`, { params, signal });
      return response.data;
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error fetching end users:', error);
      return {
        success: false,
        data: { users: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } },
        error: error.response?.data?.error || 'Failed to fetch end users',
      };
    }
  },

  /**
   * Get a single org_end_user by ID.
   */
  async getById(
    orgId: string,
    userId: string,
    signal?: AbortSignal
  ): Promise<{ success: boolean; data: { user: OrgEndUserDetail }; error?: string }> {
    try {
      const response = await api.get(`/api/organizations/${orgId}/end-users/${userId}`, { signal });
      return response.data;
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error fetching end user:', error);
      return {
        success: false,
        data: { user: null as any },
        error: error.response?.data?.error || 'Failed to fetch end user',
      };
    }
  },

  /**
   * Delete an org_end_user.
   */
  async delete(orgId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.delete(`/api/organizations/${orgId}/end-users/${userId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting end user:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete user',
      };
    }
  },

  /**
   * Get posts by a specific org_end_user.
   */
  async getPosts(
    orgId: string,
    userId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{
    success: boolean;
    data: { posts: any[]; pagination: { page: number; limit: number; total: number; pages: number } };
    error?: string;
  }> {
    try {
      const response = await api.get(`/api/organizations/${orgId}/end-users/${userId}/posts`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching end user posts:', error);
      return {
        success: false,
        data: { posts: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } },
        error: error.response?.data?.error || 'Failed to fetch posts',
      };
    }
  },
};

export default orgEndUsersService;
