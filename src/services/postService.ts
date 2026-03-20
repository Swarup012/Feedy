// services/postService.ts
import api from "@/lib/api";

export interface Post {
  id: string;
  board_id: string;
  title: string;
  description?: string;
  author_id: string;
  status:
    | "open"
    | "under-review"
    | "planned"
    | "in-progress"
    | "completed"
    | "closed";
  upvotes: number;
  comment_count: number;
  is_pinned: boolean;
  is_archived: boolean;
  images?: string[]; // ✅ Add images array
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  board?: {
    id: string;
    name: string;
    slug: string;
    color: string;
    icon: string;
  };
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  parent_id?: string | null;
  like_count?: number;
  user_has_liked?: boolean;
  author?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role: string;
  };
  replies?: Comment[];
}

export const postService = {
  // ✅ NEW: Get posts from public board (no authentication required)
  async getPublicBoardPosts(
    boardSlug: string,
  ): Promise<{ success: boolean; data: { posts: Post[]; count: number } }> {
    const response = await api.get(`/api/public/boards/${boardSlug}/posts`);
    return response.data;
  },

  // ✅ NEW: Get single public post (no authentication required)
  async getPublicPost(
    postId: string,
  ): Promise<{ success: boolean; data: { post: Post } }> {
    const response = await api.get(`/api/public/posts/${postId}`);
    return response.data;
  },
  // Get posts by board
  async getPostsByBoard(
    boardSlug: string,
    filters?: {
      status?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: string;
    },
  ): Promise<{ success: boolean; data: { posts: Post[]; count: number } }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const response = await api.get(
      `/api/boards/${boardSlug}/posts?${params.toString()}`,
    );
    return response.data;
  },

  // Get single post
  async getPost(
    postId: string,
  ): Promise<{ success: boolean; data: { post: Post } }> {
    const response = await api.get(`/api/posts/${postId}`);
    return response.data;
  },

  // Alias for getPost (for consistency)
  async getPostById(
    postId: string,
  ): Promise<{ success: boolean; data: { post: Post } }> {
    return this.getPost(postId);
  },

  // Create post
  async createPost(
    boardSlug: string,
    data: { title: string; description?: string; images?: string[] },
  ): Promise<{ success: boolean; data: { post: Post } }> {
    const response = await api.post(`/api/boards/${boardSlug}/posts`, data);
    return response.data;
  },

  // Update post
  async updatePost(
    postId: string,
    data: Partial<Post>,
  ): Promise<{ success: boolean; data: { post: Post } }> {
    const response = await api.put(`/api/posts/${postId}`, data);
    return response.data;
  },

  // Update post status
  async updatePostStatus(
    postId: string,
    status: string,
    note?: string,
  ): Promise<{ success: boolean; data: { post: Post } }> {
    const response = await api.patch(`/api/posts/${postId}/status`, {
      status,
      note,
    });
    return response.data;
  },

  // Delete post
  async deletePost(
    postId: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/api/posts/${postId}`);
    return response.data;
  },

  // Toggle upvote
  async toggleUpvote(
    postId: string,
  ): Promise<{ success: boolean; data: { upvoted: boolean } }> {
    const response = await api.post(`/api/posts/${postId}/upvote`);
    return response.data;
  },

  // ✅ NEW: Get comments from public post (no authentication required)
  async getPublicPostComments(postId: string): Promise<{
    success: boolean;
    data: { comments: Comment[]; count: number };
  }> {
    const response = await api.get(`/api/public/posts/${postId}/comments`);
    return response.data;
  },

  // Get comments
  async getComments(postId: string): Promise<{
    success: boolean;
    data: { comments: Comment[]; count: number };
  }> {
    const response = await api.get(`/api/posts/${postId}/comments`);
    return response.data;
  },

  // Add comment (supports replies via parent_id)
  async addComment(
    postId: string,
    content: string,
    parentId?: string | null,
  ): Promise<{ success: boolean; data: { comment: Comment } }> {
    const response = await api.post(`/api/posts/${postId}/comments`, {
      content,
      parent_id: parentId,
    });
    return response.data;
  },

  // Toggle like on comment
  async toggleCommentLike(
    postId: string,
    commentId: string,
  ): Promise<{ success: boolean; data: { liked: boolean } }> {
    const response = await api.post(
      `/api/posts/${postId}/comments/${commentId}/like`,
    );
    return response.data;
  },

  // Delete comment
  async deleteComment(
    postId: string,
    commentId: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(
      `/api/posts/${postId}/comments/${commentId}`,
    );
    return response.data;
  },
};
