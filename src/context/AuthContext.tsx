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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
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

      if (!token) {
        setLoading(false);
        return;
      }

      // Verify token and get user
      const response = await authService.getMe();
      setUser(response.data.user);
      TokenManager.setUser(response.data.user);
    } catch (error) {
      console.error("Auth check failed:", error);
      TokenManager.clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);

      // Save tokens
      TokenManager.setTokens(
        response.data.access_token,
        response.data.refresh_token,
      );

      // Save user
      setUser(response.data.user);
      TokenManager.setUser(response.data.user);

      // Redirect based on role
      if (response.data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(axiosError.response?.data?.message || "Login failed");
    }
  };

  // Signup function
  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await authService.signup(name, email, password);

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
