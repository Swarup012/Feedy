import api from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
  current_organization_id?: string; // Which organization they're currently viewing
  organization_role?: string; // Permission role in current org (owner/admin/member) - from organization_members table
  job_role?: string; // Job function (founder/product_manager/designer/developer/marketer) - from organization_members table
  organization_id?: string; // Alias for current_organization_id (for backward compatibility)
  avatar_url?: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    access_token: string;
    refresh_token: string;
    emailConfirmationRequired?: boolean;
  };
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: Array<{ msg: string; param: string }>;
}

export const authService = {
  // Signup
  async signup(
    name: string,
    email: string,
    password: string,
    role?: string,
    organizationId?: string,
  ): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/api/auth/signup", {
      name,
      email,
      password,
      role,
      organizationId,
    });
    return response.data;
  },

  // Login
  async login(email: string, password: string, organizationId?: string, userRole?: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/api/auth/login", {
      email,
      password,
      organizationId,
      userRole,
    });
    return response.data;
  },

  // Get current user
  async getMe(): Promise<{ success: boolean; data: { user: User } }> {
    const response = await api.get("/api/auth/me");
    return response.data;
  },

  // Logout
  async logout(): Promise<void> {
    await api.post("/api/auth/logout");
  },

  // Update profile
  async updateProfile(
    updates: Partial<User>,
  ): Promise<{ success: boolean; data: { user: User } }> {
    const response = await api.put("/api/auth/profile", updates);
    return response.data;
  },

  // Forgot password
  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post("/api/auth/forgot-password", { email });
    return response.data;
  },

  // Resend verification
  async resendVerification(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post("/api/auth/resend-verification", { email });
    return response.data;
  },
};
