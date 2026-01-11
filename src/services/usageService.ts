// src/services/usageService.ts
import api from '@/lib/api';

export interface UsageData {
  plan: 'free' | 'starter';
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

      console.log('🔍 usageService.canCreateBoard - Full response:', {
        plan,
        boardsUsage: usage.boards,
      });

      if (plan === 'starter') {
        console.log('✅ User has starter plan - unlimited boards allowed');
        return { allowed: true };
      }

      // Check board limit
      const { current, limit } = usage.boards;
      console.log('🔍 usageService.canCreateBoard - Board check:', {
        current,
        limit,
        allowed: !(typeof limit === 'number' && current >= limit),
      });

      if (typeof limit === 'number' && current >= limit) {
        console.log(`🚫 Board limit reached: ${current}/${limit}`);
        return {
          allowed: false,
          reason: `Board limit reached. Free plan allows ${limit} board(s). Upgrade to Starter for unlimited boards.`,
        };
      }

      console.log('✅ Board creation allowed');
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

      if (plan === 'starter') {
        return { allowed: true };
      }

      // Check post limit
      const { current, limit, resets_at } = usage.posts;
      if (typeof limit === 'number' && current >= limit) {
        return {
          allowed: false,
          reason: `Post limit reached. Free plan allows ${limit} posts per month. Upgrade to Starter for unlimited posts.`,
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
