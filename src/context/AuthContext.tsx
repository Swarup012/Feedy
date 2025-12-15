"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { authService, User, ApiError } from "@/services/authService";
import { TokenManager } from "@/lib/tokenManager";
import { AxiosError } from "axios";
import { initSocket, disconnectSocket } from "@/lib/socket";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, organizationId?: string, userRole?: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    role?: string,
    organizationId?: string,
  ) => Promise<{ emailConfirmationRequired: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Check if user is logged in on mount
  const checkAuth = useCallback(async () => {
    try {
      const token = TokenManager.getAccessToken();
      const cachedUser = TokenManager.getUser();

      // If we have cached user data, use it immediately
      if (cachedUser) {
        setUser(cachedUser);
      }

      // Even if no token in localStorage, try to verify with server
      // (cookies might be present for cross-subdomain auth)
      const response = await authService.getMe();
      
      // 🐛 DEBUG: Log auth check info
      if (token) {
        const tokenHash = token.substring(0, 32);
        console.log('🔍 DEBUG - Auth Check Response:', {
          email: response.data.user.email,
          tokenHash: tokenHash,
          cachedUser: cachedUser?.email,
          fetchedUser: response.data.user.email,
          tokensMatch: cachedUser?.email === response.data.user.email,
        });
      } else {
        console.log('🍪 Auth via cookies (no localStorage token on this subdomain)');
      }
      
      setUser(response.data.user);
      TokenManager.setUser(response.data.user);

      // 🔌 Initialize Socket.io connection (only if we have token)
      if (token) {
        initSocket(token);
      }
    } catch (error) {
      // Only log error if we're not on a public page (guests are expected to fail auth check)
      const isPublicPage = typeof window !== 'undefined' && (
        window.location.pathname === '/' ||
        window.location.pathname.startsWith('/feedback/boards/') ||
        window.location.pathname.startsWith('/roadmap')
      );
      
      if (!isPublicPage) {
        console.error("Auth check failed:", error);
      }
      
      TokenManager.clearTokens();
      setUser(null);
      disconnectSocket();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = async (email: string, password: string, organizationId?: string, userRole?: string) => {
    try {
      console.log('🔐 Login called with organizationId:', organizationId);
      const response = await authService.login(email, password, organizationId, userRole);

      // Save tokens
      TokenManager.setTokens(
        response.data.access_token,
        response.data.refresh_token,
      );

      // 🐛 DEBUG: Log token info
      const tokenHash = response.data.access_token.substring(0, 32);
      console.log('🔑 DEBUG - Login Token Info:', {
        email: response.data.user.email,
        tokenHash: tokenHash,
        fullToken: response.data.access_token.substring(0, 50) + '...',
      });

      // Save user to state AND localStorage
      setUser(response.data.user);
      TokenManager.setUser(response.data.user);

      // 🔌 Initialize Socket.io connection after successful login
      initSocket(response.data.access_token);
      console.log('🔌 Socket.io connection initialized after login');

      console.log('✅ User logged in:', {
        email: response.data.user.email,
        current_org: response.data.user.current_organization_id,
        org_role: response.data.user.organization_role
      });

      // Small delay to ensure state is updated before redirect
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect based on organization_role (NOT user.role which is job role)
      const orgRole = response.data.user.organization_role;
      if (orgRole === "owner" || orgRole === "admin") {
        console.log('🔄 Redirecting to /admin');
        router.push("/admin");
      } else {
        console.log('🔄 Redirecting to /dashboard');
        router.push("/dashboard");
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(axiosError.response?.data?.message || "Login failed");
    }
  };

  // Signup function
  const signup = async (name: string, email: string, password: string, role?: string, organizationId?: string) => {
    try {
      const response = await authService.signup(name, email, password, role, organizationId);

      const emailConfirmationRequired =
        response.data.emailConfirmationRequired ?? false;

      if (!emailConfirmationRequired) {
        // Save tokens and user
        TokenManager.setTokens(
          response.data.access_token,
          response.data.refresh_token,
        );
        setUser(response.data.user);
        TokenManager.setUser(response.data.user);
      }

      return { emailConfirmationRequired };
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(axiosError.response?.data?.message || "Signup failed");
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // 🔌 Disconnect Socket.io before clearing tokens
      disconnectSocket();
      console.log('🔌 Socket.io disconnected after logout');

      TokenManager.clearTokens();
      setUser(null);
      router.push("/login");
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data.user);
      TokenManager.setUser(response.data.user);
    } catch (error) {
      console.error("Refresh user failed:", error);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
