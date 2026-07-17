import api from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
  current_organization_id?: string;
  organization_role?: string;
  job_role?: string;
  job_role_name?: string;
  job_role_icon?: string;
  organization_id?: string; // alias for backward compat
  avatar_url?: string;
  created_at: string;
}

/**
 * Auth response from the backend.
 *
 * With HttpOnly-cookie auth the backend no longer returns tokens in the JSON
 * body — it sets them via Set-Cookie headers. The response only carries the
 * user object (and an optional emailConfirmationRequired flag).
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    // access_token / refresh_token intentionally removed —
    // they are delivered as HttpOnly cookies by the backend.
    emailConfirmationRequired?: boolean;
  };
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: Array<{ msg: string; param: string }>;
}

export const authService = {
  /** Sign up — backend sets access_token + refresh_token cookies in response */
  async signup(
    name: string,
    email: string,
    password: string,
    role?: string,
    organizationId?: string
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

  /** Login — backend sets access_token + refresh_token cookies in response */
  async login(
    email: string,
    password: string,
    organizationId?: string,
    userRole?: string
  ): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/api/auth/login", {
      email,
      password,
      organizationId,
      userRole,
    });
    return response.data;
  },

  /**
   * Fetch the current authenticated user.
   * Works because the browser sends the access_token HttpOnly cookie
   * automatically on every request (withCredentials: true).
   */
  async getMe(): Promise<{ success: boolean; data: { user: User } }> {
    const response = await api.get("/api/auth/me");
    return response.data;
  },

  /**
   * Logout — the backend clears both auth cookies via Set-Cookie: Max-Age=0.
   * No client-side token removal needed.
   */
  async logout(): Promise<void> {
    await api.post("/api/auth/logout");
  },

  async updateProfile(
    updates: Partial<User>
  ): Promise<{ success: boolean; data: { user: User } }> {
    const response = await api.put("/api/auth/profile", updates);
    return response.data;
  },

  async forgotPassword(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post("/api/auth/forgot-password", { email });
    return response.data;
  },

  async resendVerification(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post("/api/auth/resend-verification", { email });
    return response.data;
  },

  /**
   * Fetch a short-lived WebSocket ticket from the backend.
   * Socket.io cannot read HttpOnly cookies, so the backend issues a
   * one-time token (valid ~30 s) that the client passes in the WS handshake.
   */
  async getWsTicket(): Promise<{ ticket: string }> {
    const response = await api.get<{ success: boolean; data: { ticket: string } }>(
      "/api/auth/ws-ticket"
    );
    return response.data.data;
  },
};
