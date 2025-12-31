// src/services/usageService.ts
import api from '@/lib/api';

export interface UsageData {
  plan: 'free' | 'pro';
  usage: {
    boards: {
      current: number;
      limit: number | 'unlimited';
      remaining: number | 'unlimited';
    };
    posts: {
      current: number;
      limit: number | 'unlimited';
      remaining: number | 'unlimited';
      resets_at: string;
    };
    team_members: {
      current: number;
      limit: number | 'unlimited';
      remaining: number | 'unlimited';
    };
  };
}

const usageService = {
  /**
   * Get current usage statistics
   */
  async getUsage(): Promise<{ success: boolean; data: UsageData }> {
    const response = await api.get('/api/users/me/usage');
    return response.data;
  },

  /**
   * Check if user can create a board
   */
  async canCreateBoard(): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const response = await this.getUsage();
      const { plan, usage } = response.data;

      if (plan === 'pro') {
        return { allowed: true };
      }

      // Check board limit
      const { current, limit } = usage.boards;
      if (typeof limit === 'number' && current >= limit) {
        return {
          allowed: false,
          reason: `Board limit reached. Free plan allows ${limit} board(s). Upgrade to Pro for unlimited boards.`,
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking board limit:', error);
      return { allowed: true }; // Allow on error to avoid blocking users
    }
  },

  /**
   * Check if user can create a post
   */
  async canCreatePost(): Promise<{ allowed: boolean; reason?: string; resetsAt?: string }> {
    try {
      const response = await this.getUsage();
      const { plan, usage } = response.data;

      if (plan === 'pro') {
        return { allowed: true };
      }

      // Check post limit
      const { current, limit, resets_at } = usage.posts;
      if (typeof limit === 'number' && current >= limit) {
        return {
          allowed: false,
          reason: `Post limit reached. Free plan allows ${limit} posts per month. Upgrade to Pro for unlimited posts.`,
          resetsAt: resets_at,
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking post limit:', error);
      return { allowed: true }; // Allow on error to avoid blocking users
    }
  },
};

export default usageService;
