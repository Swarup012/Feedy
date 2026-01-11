import api from '@/lib/api';

interface TrackedUserCount {
  count: number;
  limit: number;
  usage_percent: number;
  billing_period: string;
}

interface UsageStats {
  count: number;
  limit: number;
  usage_percent: number;
  current_period: string;
  days_remaining: number;
  breakdown: {
    create_post: number;
    vote: number;
    comment: number;
  };
  status: 'good' | 'warning' | 'critical' | 'limit_reached';
}

interface TrackedUser {
  id: string;
  user_identifier: string;
  first_seen: string;
  last_activity: string;
  total_actions: number;
  posts_created: number;
  votes_cast: number;
  comments_made: number;
}

interface TrackedUsersList {
  users: TrackedUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface HistoricalData {
  months: Array<{
    period: string;
    count: number;
    new_users: number;
  }>;
}

export const trackedUsersService = {
  /**
   * Get current tracked users count
   */
  async getCount(): Promise<TrackedUserCount> {
    const response = await api.get('/api/tracked-users/count');
    return response.data.data;
  },

  /**
   * Get detailed usage statistics
   */
  async getUsage(): Promise<UsageStats> {
    const response = await api.get('/api/tracked-users/usage');
    return response.data.data;
  },

  /**
   * Get paginated list of tracked users
   */
  async getList(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
  }): Promise<TrackedUsersList> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);
    if (params?.search) queryParams.append('search', params.search);

    const response = await api.get(`/api/tracked-users/list?${queryParams.toString()}`);
    return response.data.data;
  },

  /**
   * Get historical tracking data
   */
  async getHistory(months: number = 6): Promise<HistoricalData> {
    const response = await api.get(`/api/tracked-users/history?months=${months}`);
    return response.data.data;
  },

  /**
   * Export tracked users to CSV
   */
  async exportCSV(): Promise<Blob> {
    const response = await api.get('/api/tracked-users/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Recalculate tracked users cache (admin only)
   */
  async recalculateCache(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/api/tracked-users/recalculate');
    return response.data;
  },

  /**
   * Download CSV file
   */
  downloadCSV(blob: Blob, filename: string = 'tracked-users.csv'): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
