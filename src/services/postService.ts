// services/postService.ts
import api from "@/lib/api";

export interface Post {
  id: string;
  board_id: string;
  title: string;
  description?: string;
  author_id: string | null;
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
  category?: string; // ✅ Add category
  images?: string[]; // ✅ Add images array
  source?: string; // ✅ Add source
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  external_author?: {
    id: string;
    external_user_id: string;
    name: string;
    email: string;
    context?: Record<string, unknown>;
  };
  org_end_user?: {
    id: string;
    external_user_id: string;
    name: string;
    email: string;
    identity_type: string;
    custom_fields: Record<string, unknown>;
  };
  board?: {
    id: string;
    name: string;
    slug: string;
    color: string;
    icon: string;
  };
}

/** Display name for internal (author) or widget (external_author) submitters.
 *  Falls back to "Autopilot" only for auto-published AI posts. */
export function getPostAuthorDisplayName(post: Post): string {
  if (post.author?.name) return post.author.name;
  if (post.org_end_user?.name) return post.org_end_user.name;
  if (post.external_author?.name) return post.external_author.name;
  if (post.org_end_user?.email) return post.org_end_user.email;
  if (post.external_author?.email) return post.external_author.email;
  
  if (post.source === 'autopilot') return "Autopilot";
  return "Anonymous";
}

export function isWidgetPost(post: Post): boolean {
  return Boolean(post.org_end_user || post.external_author);
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
    data: { title: string; description?: string; images?: string[]; category?: string },
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
