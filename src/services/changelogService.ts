import api from "@/lib/api";

export interface Changelog {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  content: string;
  type: "new" | "improved" | "fixed";
  status: "draft" | "published";
  published_at?: string;
  author_id: string;
  author?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  slug: string;
  featured_image?: string;
  labels?: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
  changelog_links?: ChangelogLink[];
}

export interface ChangelogLink {
  id: string;
  changelog_id: string;
  post_id?: string;
  roadmap_item_id?: string;
  post?: {
    id: string;
    title: string;
    slug: string;
  };
  roadmap_item?: {
    id: string;
    title: string;
  };
}

export const changelogService = {
  // Get all changelogs
  async getAllChangelogs(filters?: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    data: { changelogs: Changelog[]; count: number };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    const response = await api.get(`/api/changelogs?${params.toString()}`);
    return response.data;
  },

  // Get public changelogs (no auth required)
  async getPublicChangelogs(filters?: {
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    data: { changelogs: Changelog[]; count: number };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    const response = await api.get(`/api/public/changelogs?${params.toString()}`);
    return response.data;
  },

  // Get recent changelogs (for navbar)
  async getRecentChangelogs(limit: number = 5): Promise<{
    success: boolean;
    data: { changelogs: Changelog[] };
  }> {
    const response = await api.get(`/api/changelogs/recent?limit=${limit}`);
    return response.data;
  },

  // Get public recent changelogs
  async getPublicRecentChangelogs(limit: number = 5): Promise<{
    success: boolean;
    data: { changelogs: Changelog[] };
  }> {
    const response = await api.get(`/api/public/changelogs/recent?limit=${limit}`);
    return response.data;
  },

  // Get single changelog by slug
  async getChangelogBySlug(slug: string): Promise<{
    success: boolean;
    data: { changelog: Changelog };
  }> {
    const response = await api.get(`/api/changelogs/${slug}`);
    return response.data;
  },

  // Get public changelog by slug
  async getPublicChangelogBySlug(slug: string): Promise<{
    success: boolean;
    data: { changelog: Changelog };
  }> {
    const response = await api.get(`/api/public/changelogs/${slug}`);
    return response.data;
  },

  // Create changelog
  async createChangelog(data: {
    title: string;
    description?: string;
    content: string;
    type?: "new" | "improved" | "fixed";
    status?: "draft" | "published";
    labels?: string[];
    featured_image?: string;
    linked_posts?: string[];
  }): Promise<{ success: boolean; data: { changelog: Changelog } }> {
    const response = await api.post("/api/changelogs", data);
    return response.data;
  },

  // Update changelog
  async updateChangelog(
    id: string,
    data: Partial<Changelog>
  ): Promise<{ success: boolean; data: { changelog: Changelog } }> {
    const response = await api.put(`/api/changelogs/${id}`, data);
    return response.data;
  },

  // Delete changelog
  async deleteChangelog(id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/api/changelogs/${id}`);
    return response.data;
  },

  // Publish changelog
  async publishChangelog(id: string): Promise<{
    success: boolean;
    data: { changelog: Changelog };
  }> {
    const response = await api.post(`/api/changelogs/${id}/publish`);
    return response.data;
  },
};
