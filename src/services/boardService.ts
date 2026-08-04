import api from "@/lib/api";

export interface Board {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_private: boolean;
  category?: string;
  owner_id: string;
  icon: string;
  visible_to_roles?: string[]; // ✅ Job roles that can see this board
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface BoardCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
}

export const boardService = {
  // Get all boards
  async getAllBoards(): Promise<{
    success: boolean;
    data: { boards: Board[]; count: number };
  }> {
    const response = await api.get("/api/boards");
    return response.data;
  },

  // ✅ NEW: Get public boards (no authentication required)
  async getPublicBoards(): Promise<{
    success: boolean;
    data: { boards: Board[]; count: number };
  }> {
    const response = await api.get("/api/public/boards");
    return response.data;
  },

  // ✅ NEW: Get public board by slug (no authentication required)
  async getPublicBoardBySlug(
    slug: string,
  ): Promise<{ success: boolean; data: { board: Board } }> {
    const response = await api.get(`/api/public/boards/${slug}`);
    return response.data;
  },

  // Get board by slug
  async getBoardBySlug(
    slug: string,
  ): Promise<{ success: boolean; data: { board: Board } }> {
    const response = await api.get(`/api/boards/${slug}`);
    return response.data;
  },

  async getCategories(): Promise<{
    success: boolean;
    data: { categories: BoardCategory[]; count: number };
  }> {
    const response = await api.get("/api/boards/categories");
    return response.data;
  },

  // Create board
  async createBoard(data: {
    name: string;
    description?: string;
    is_private?: boolean;
    category?: string;
    icon?: string;
    visible_to_roles?: string[]; // ✅ Job role targeting
  }): Promise<{ success: boolean; data: { board: Board } }> {
    const response = await api.post("/api/boards", data);
    return response.data;
  },

  // Update board
  async updateBoard(
    id: string,
    data: Partial<Board>,
  ): Promise<{ success: boolean; data: { board: Board } }> {
    const response = await api.put(`/api/boards/${id}`, data);
    return response.data;
  },

  // Delete board
  async deleteBoard(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/api/boards/${id}`);
    return response.data;
  },

  // Check slug availability
  async checkSlug(
    slug: string,
  ): Promise<{ success: boolean; data: { available: boolean } }> {
    const response = await api.get(`/api/boards/check-slug/${slug}`);
    return response.data;
  },

  // Get board dependencies (integrations using this board)
  async getBoardDependencies(
    id: string,
  ): Promise<{
    success: boolean;
    data: { integrations: { id: string; provider: string; status: string }[]; count: number };
  }> {
    const response = await api.get(`/api/boards/${id}/dependencies`);
    return response.data;
  },
};
