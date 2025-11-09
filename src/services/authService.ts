import api from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string; // User's role (product_manager/founder/designer/etc) - for permissions AND content filtering
  organization_role?: string; // Organization-specific role (owner/admin/member) - for organization permissions
  organization_id?: string; // User's organization
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
