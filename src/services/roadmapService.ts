// src/services/roadmapService.ts
import api from "@/lib/api";

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  target_quarter?: string;
  target_date?: string;
  progress: number;
  order_index: number;
  is_public: boolean;
  board_id: string;
  created_by: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  vote_count: number;
  comment_count: number;
  linked_feedback: Array<{
    id: string;
    title: string;
    status: string;
    upvotes: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface RoadmapComment {
  id: string;
  content: string;
  roadmap_item_id: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role: string;
  };
  parent_id?: string;
  replies?: RoadmapComment[];
  created_at: string;
  updated_at: string;
}

export interface RoadmapUpdate {
  id: string;
  title: string;
  content: string;
  type: 'progress' | 'status_change' | 'milestone' | 'general';
  author: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  created_at: string;
}

export interface RoadmapStats {
  total: number;
  planned: number;
  in_progress: number;
  in_review: number;
  completed: number;
  cancelled: number;
}

export const roadmapService = {
  // ✅ Get public roadmap items (no authentication required)
  async getPublicRoadmap(
    boardSlug: string,
    filters?: {
      status?: string[];
      category?: string;
    }
  ): Promise<{ success: boolean; data: { items: RoadmapItem[]; count: number } }> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status.length > 0) {
      params.append('status', filters.status.join(','));
    }
    if (filters?.category) {
      params.append('category', filters.category);
    }

    const response = await api.get(
      `/api/public/boards/${boardSlug}/roadmap?${params.toString()}`
    );
    return response.data;
  },

  // ✅ Get single public roadmap item (no authentication required)
  async getPublicRoadmapItem(
    itemId: string
  ): Promise<{ success: boolean; data: { item: RoadmapItem } }> {
    const response = await api.get(`/api/public/roadmap/${itemId}`);
    return response.data;
  },

  // Get ALL roadmap items across all boards (Admin/Owner)
  async getAllRoadmapItems(
    filters?: {
      status?: string[];
      category?: string;
      isPublic?: boolean;
      boardSlug?: string;
    }
  ): Promise<{ success: boolean; data: { items: RoadmapItem[]; count: number } }> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status.length > 0) {
      params.append('status', filters.status.join(','));
    }
    if (filters?.category) {
      params.append('category', filters.category);
    }
    if (filters?.isPublic !== undefined) {
      params.append('isPublic', String(filters.isPublic));
    }
    if (filters?.boardSlug) {
      params.append('boardSlug', filters.boardSlug);
    }

    const response = await api.get(
      `/api/roadmap/all?${params.toString()}`
    );
    return response.data;
  },

  // Get roadmap items for a board (authenticated)
  async getRoadmapItems(
    boardSlug: string,
    filters?: {
      status?: string[];
      category?: string;
      isPublic?: boolean;
    }
  ): Promise<{ success: boolean; data: { items: RoadmapItem[]; count: number } }> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status.length > 0) {
      params.append('status', filters.status.join(','));
    }
    if (filters?.category) {
      params.append('category', filters.category);
    }
    if (filters?.isPublic !== undefined) {
      params.append('isPublic', String(filters.isPublic));
    }

    const response = await api.get(
      `/api/boards/${boardSlug}/roadmap?${params.toString()}`
    );
    return response.data;
  },

  // Get single roadmap item
  async getRoadmapItem(
    itemId: string
  ): Promise<{ success: boolean; data: { item: RoadmapItem } }> {
    const response = await api.get(`/api/roadmap/${itemId}`);
    return response.data;
  },

  // Create roadmap item
  async createRoadmapItem(
    boardSlug: string,
    data: {
      title: string;
      description: string;
      status?: string;
      priority?: string;
      category?: string;
      target_quarter?: string;
      target_date?: string;
      progress?: number;
      is_public?: boolean;
    }
  ): Promise<{ success: boolean; data: { item: RoadmapItem } }> {
    const response = await api.post(`/api/boards/${boardSlug}/roadmap`, data);
    return response.data;
  },

  // Update roadmap item
  async updateRoadmapItem(
    itemId: string,
    data: Partial<RoadmapItem>
  ): Promise<{ success: boolean; data: { item: RoadmapItem } }> {
    const response = await api.put(`/api/roadmap/${itemId}`, data);
    return response.data;
  },

  // Delete roadmap item
  async deleteRoadmapItem(
    itemId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/api/roadmap/${itemId}`);
    return response.data;
  },

  // Vote on roadmap item
  async voteRoadmapItem(
    itemId: string
  ): Promise<{ success: boolean; data: { voted: boolean } }> {
    const response = await api.post(`/api/roadmap/${itemId}/vote`);
    return response.data;
  },

  // Remove vote
  async removeVote(
    itemId: string
  ): Promise<{ success: boolean; data: { voted: boolean } }> {
    const response = await api.delete(`/api/roadmap/${itemId}/vote`);
    return response.data;
  },

  // Check if user has voted
  async hasUserVoted(
    itemId: string
  ): Promise<{ success: boolean; data: { hasVoted: boolean } }> {
    const response = await api.get(`/api/roadmap/${itemId}/voted`);
    return response.data;
  },

  // Get comments
  async getComments(
    itemId: string
  ): Promise<{ success: boolean; data: { comments: RoadmapComment[]; count: number } }> {
    const response = await api.get(`/api/roadmap/${itemId}/comments`);
    return response.data;
  },

  // Add comment
  async addComment(
    itemId: string,
    content: string,
    parentId?: string
  ): Promise<{ success: boolean; data: { comment: RoadmapComment } }> {
    const response = await api.post(`/api/roadmap/${itemId}/comments`, {
      content,
      parentId,
    });
    return response.data;
  },

  // Update comment
  async updateComment(
    commentId: string,
    content: string
  ): Promise<{ success: boolean; data: { comment: RoadmapComment } }> {
    const response = await api.put(`/api/roadmap/comments/${commentId}`, { content });
    return response.data;
  },

  // Delete comment
  async deleteComment(
    itemId: string,
    commentId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/api/roadmap/${itemId}/comments/${commentId}`);
    return response.data;
  },

  // Add update to roadmap item
  async addUpdate(
    itemId: string,
    data: {
      title: string;
      content: string;
      type?: 'progress' | 'status_change' | 'milestone' | 'general';
    }
  ): Promise<{ success: boolean; data: { update: RoadmapUpdate } }> {
    const response = await api.post(`/api/roadmap/${itemId}/updates`, data);
    return response.data;
  },

  // Link feedback to roadmap item
  async linkFeedback(
    itemId: string,
    feedbackId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/api/roadmap/${itemId}/link-feedback`, { feedbackId });
    return response.data;
  },

  // Unlink feedback
  async unlinkFeedback(
    itemId: string,
    feedbackId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/api/roadmap/${itemId}/link-feedback/${feedbackId}`);
    return response.data;
  },

  // Reorder items
  async reorderItems(
    boardSlug: string,
    itemIds: string[]
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/api/boards/${boardSlug}/roadmap/reorder`, { itemIds });
    return response.data;
  },

  // Get roadmap statistics
  async getRoadmapStats(
    boardSlug: string
  ): Promise<{ success: boolean; data: RoadmapStats }> {
    const response = await api.get(`/api/boards/${boardSlug}/roadmap/stats`);
    return response.data;
  },
};
