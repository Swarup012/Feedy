// src/services/usageService.ts
import api from '@/lib/api';
import { type PlanTier, hasUnlimited } from '@/config/plans';

export interface UsageData {
  plan: PlanTier;
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
   * @param boardSlug - Optional board slug to get post count for that specific board
   */
  async getUsage(boardSlug?: string): Promise<{ success: boolean; data: UsageData }> {
    const params = boardSlug ? { boardSlug } : {};
    const response = await api.get('/api/users/me/usage', { params });
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

      if (hasUnlimited({ subscription_plan: plan })) {
        console.log('✅ User has paid plan - unlimited boards allowed');
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
   * @param boardSlug - The board slug to check post limit for
   */
  async canCreatePost(boardSlug?: string): Promise<{ allowed: boolean; reason?: string; resetsAt?: string }> {
    try {
      const response = await this.getUsage(boardSlug);
      const { plan, usage } = response.data;

      console.log('🔍 usageService.canCreatePost - Response:', {
        plan,
        boardSlug,
        postsUsage: usage.posts,
      });

      if (hasUnlimited({ subscription_plan: plan })) {
        return { allowed: true };
      }

      // Check post limit for the specific board
      const { current, limit, resets_at } = usage.posts;
      
      // If limit is 'per_board', it means no boardSlug was provided
      if (limit === 'per_board') {
        console.log('⚠️ No boardSlug provided, allowing post creation (backend will enforce limit)');
        return { allowed: true }; // Let backend middleware handle the check
      }

      if (typeof limit === 'number' && current >= limit) {
        console.log(`🚫 Post limit reached for board: ${current}/${limit}`);
        return {
          allowed: false,
          reason: `Post limit reached for this board. Free plan allows ${limit} posts per board. Upgrade to Starter for unlimited posts.`,
          resetsAt: resets_at,
        };
      }

      console.log(`✅ Post creation allowed: ${current}/${limit}`);
      return { allowed: true };
    } catch (error) {
      console.error('Error checking post limit:', error);
      return { allowed: true }; // Allow on error to avoid blocking users
    }
  },
};

export default usageService;
