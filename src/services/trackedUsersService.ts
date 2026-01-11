// src/services/trackedUsersService.ts

import api from '@/lib/api';

export interface TrackedUsersCount {
  count: number;
  limit: number;
  usage_percent: number;
  billing_period: string;
}

export interface TrackedUsersUsage {
  count: number;
  limit: number;
  usage_percent: number;
  current_period: string;
  days_remaining: number;
  breakdown: {
    posts: number;
    votes: number;
    comments: number;
  };
  status: 'good' | 'warning' | 'critical' | 'exceeded';
}

export interface TrackedUser {
  id: string;
  organization_id: string;
  user_identifier: string;
  billing_period: string;
  posts_created: number;
  votes_cast: number;
  comments_made: number;
  total_actions: number;
  first_tracked_at: string;
  last_activity_at: string;
  display_name?: string;
  email?: string;
  identification_method?: string;
  metadata?: any;
}

export interface TrackedUsersListResponse {
  users: TrackedUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HistoricalData {
  billing_period: string;
  total_users: number;
  total_actions: number;
  breakdown: {
    create_post: number;
    vote: number;
    comment: number;
  };
}

const trackedUsersService = {
  /**
   * Get current tracked users count and limit
   */
  async getCount(): Promise<{ success: boolean; data: TrackedUsersCount; error?: string }> {
    try {
      const response = await api.get('/api/tracked-users/count');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching tracked users count:', error);
      return {
        success: false,
        data: { count: 0, limit: 0, usage_percent: 0, billing_period: '' },
        error: error.response?.data?.error || 'Failed to fetch count',
      };
    }
  },

  /**
   * Get detailed usage statistics with breakdown
   */
  async getUsage(): Promise<{ success: boolean; data: TrackedUsersUsage; error?: string }> {
    try {
      const response = await api.get('/api/tracked-users/usage');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching tracked users usage:', error);
      return {
        success: false,
        data: {
          count: 0,
          limit: 0,
          usage_percent: 0,
          current_period: '',
          days_remaining: 0,
          breakdown: { posts: 0, votes: 0, comments: 0 },
          status: 'good',
        },
        error: error.response?.data?.error || 'Failed to fetch usage',
      };
    }
  },

  /**
   * Get paginated list of tracked users
   */
  async getList(params?: {
    page?: number;
    limit?: number;
    sort?: 'created_at' | 'last_activity_at' | 'total_actions';
    order?: 'asc' | 'desc';
  }): Promise<{ success: boolean; data: TrackedUsersListResponse; error?: string }> {
    try {
      const response = await api.get('/api/tracked-users/list', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching tracked users list:', error);
      return {
        success: false,
        data: {
          users: [],
          pagination: { page: 1, limit: 50, total: 0, pages: 0 },
        },
        error: error.response?.data?.error || 'Failed to fetch list',
      };
    }
  },

  /**
   * Get historical tracking data
   */
  async getHistory(months: number = 6): Promise<{
    success: boolean;
    data: { history: HistoricalData[] };
    error?: string;
  }> {
    try {
      const response = await api.get('/api/tracked-users/history', {
        params: { months },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching tracked users history:', error);
      return {
        success: false,
        data: { history: [] },
        error: error.response?.data?.error || 'Failed to fetch history',
      };
    }
  },

  /**
   * Export tracked users data as CSV
   */
  async exportCSV(): Promise<void> {
    try {
      const response = await api.get('/api/tracked-users/export', {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tracked-users-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error exporting tracked users:', error);
      throw new Error(error.response?.data?.error || 'Failed to export CSV');
    }
  },

  /**
   * Recalculate cached count (admin only)
   */
  async recalculateCache(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await api.post('/api/tracked-users/recalculate');
      return response.data;
    } catch (error: any) {
      console.error('Error recalculating cache:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to recalculate',
      };
    }
  },
};

export default trackedUsersService;
