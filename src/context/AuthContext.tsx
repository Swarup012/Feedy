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
import { initSocketWithTicket, disconnectSocket } from "@/lib/socket";
import { getPublicReturnUrl, clearReturnUrl } from "@/lib/returnUrl";

// ─── Public page list ────────────────────────────────────────────────────────
// These routes do NOT require an auth check on mount. Visiting them as a guest
// will never fire getMe() or redirect to /login.
const PUBLIC_PATHS: Array<string | { prefix: string }> = [
  // Home
  "/",
  // Auth
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  // Marketing
  "/pricing",
  "/about",
  "/contact",
  "/canny-alternative",
  "/collect-feedback",
  "/analyze-feedback",
  "/autopilot",
  "/share-updates",
  "/role-based-access",
  "/public-roadmap",
  // App public pages
  "/changelog",
  "/feedback",
  // Prefix-based
  { prefix: "/policy" },
  { prefix: "/docs" },
  { prefix: "/auth/callback" },
  { prefix: "/onboarding" },
  { prefix: "/invite" },
  { prefix: "/feedback/boards/" },
  { prefix: "/roadmap" },
  { prefix: "/blog" },
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((entry) =>
    typeof entry === "string"
      ? pathname === entry
      : pathname.startsWith(entry.prefix)
  );
}

// ─── Context types ───────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    organizationId?: string,
    userRole?: string
  ) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    role?: string,
    organizationId?: string
  ) => Promise<{ emailConfirmationRequired: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // ─── Connect Socket.io using a WS ticket ─────────────────────────────────
  // HttpOnly cookies can't be read by JS, so we ask the backend for a
  // short-lived one-time ticket specifically for the WS handshake.
  const initSocketSafe = useCallback(async () => {
    try {
      const { ticket } = await authService.getWsTicket();
      initSocketWithTicket(ticket);
    } catch {
      // WS ticket fetch failing is non-fatal — real-time features just won't work
      console.warn("⚠️ Could not obtain WS ticket; real-time disabled.");
    }
  }, []);

  // ─── Auth check on mount ─────────────────────────────────────────────────
  const checkAuth = useCallback(async () => {
    const pathname =
      typeof window !== "undefined" ? window.location.pathname : "/";

    // Fast-path: public pages don't need an auth round-trip.
    // We still show any cached user so the navbar can reflect login state,
    // but we never block the page render on a network call.
    if (isPublicPath(pathname)) {
      const cached = TokenManager.getUser();
      if (cached) setUser(cached);
      setLoading(false);
      return;
    }

    try {
      // Show cached user immediately for instant UI (optimistic render)
      const cached = TokenManager.getUser();
      if (cached) setUser(cached);

      // Verify with server — the access_token HttpOnly cookie is sent automatically
      const response = await authService.getMe();
      const freshUser = response.data.user;
      setUser(freshUser);
      TokenManager.setUser(freshUser);
    } catch {
      // getMe() failed → cookie missing or expired, treat as unauthenticated
      TokenManager.clearTokens();
      setUser(null);

      // Only redirect on protected pages
      if (typeof window !== "undefined" && !isPublicPath(pathname)) {
        console.log("🚨 Auth check failed on protected page, redirecting to /login");
        // SECURITY: Clear Supabase session too — prevents stale identity on next signup.
        import("@/lib/supabase").then(({ supabase }) =>
          supabase.auth.signOut().catch(() => {})
        );
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Handle cross-subdomain auth token transfer via URL hash
    // (OAuth callbacks sometimes pass tokens in the hash for subdomain handoff)
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const isCallbackPage = window.location.pathname.startsWith("/auth/callback");

      if (hash && hash.includes("access_token") && !isCallbackPage) {
        console.log("🔐 Auth tokens in URL hash detected — backend should set cookies instead.");
        // Clean up the hash but still run checkAuth (cookie should be set by now)
        window.history.replaceState(
          {},
          "",
          window.location.pathname + window.location.search
        );
      }
    }

    checkAuth();

    // If coming from invite acceptance, re-run auth check after a brief delay
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("from") === "invite") {
        window.history.replaceState({}, "", window.location.pathname);
        setTimeout(() => checkAuth(), 500);
      }
    }
  }, [checkAuth]);

  // Listen for auth-tokens-stored event (OAuth callback handoff)
  useEffect(() => {
    const handleTokensStored = () => {
      console.log("🔔 auth-tokens-stored event — re-checking auth");
      checkAuth();
    };
    window.addEventListener("auth-tokens-stored", handleTokensStored);
    return () =>
      window.removeEventListener("auth-tokens-stored", handleTokensStored);
  }, [checkAuth]);

  // ─── Login ───────────────────────────────────────────────────────────────
  const login = async (
    email: string,
    password: string,
    organizationId?: string,
    userRole?: string
  ) => {
    try {
      // Backend sets HttpOnly cookies (access_token + refresh_token) in the response.
      // We only read the user object from the JSON body.
      const response = await authService.login(email, password, organizationId, userRole);
      const loggedInUser = response.data.user;

      setUser(loggedInUser);
      TokenManager.setUser(loggedInUser);

      // Connect Socket.io via WS ticket
      await initSocketSafe();

      // Priority 1: pending invite
      const pendingInviteToken =
        typeof window !== "undefined"
          ? localStorage.getItem("pendingInviteToken")
          : null;
      if (pendingInviteToken) {
        router.push(`/invite/${pendingInviteToken}`);
        return;
      }

      // Priority 2: saved return URL
      const returnUrl = getPublicReturnUrl();
      if (returnUrl) {
        clearReturnUrl();
        router.push(returnUrl);
        return;
      }

      // Priority 3: stay on subdomain public page after login
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const hostname = typeof window !== "undefined" ? window.location.hostname : "";
      const parts = hostname.split(".");
      const hasSubdomain =
        (hostname.includes("localhost") &&
          parts.length > 1 &&
          parts[0] !== "localhost") ||
        (parts.length >= 3 && !["www", "api", "admin"].includes(parts[0]));
      const isOnPublicPage =
        currentPath.startsWith("/feedback") ||
        currentPath.startsWith("/roadmap") ||
        currentPath.startsWith("/changelog");

      if (hasSubdomain && isOnPublicPage) {
        window.location.reload();
        return;
      }

      // Priority 4: route by role
      const hasOrganization = !!loggedInUser.current_organization_id;
      if (!hasOrganization) {
        router.push("/onboarding");
        return;
      }

      // If user came from pricing page checkout flow, go back there
      const pendingCheckout = sessionStorage.getItem("pendingCheckout");
      if (pendingCheckout) {
        router.push("/pricing");
        return;
      }

      const orgRole = loggedInUser.organization_role;
      router.push(orgRole === "owner" || orgRole === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(axiosError.response?.data?.message || "Login failed");
    }
  };

  // ─── Signup ──────────────────────────────────────────────────────────────
  const signup = async (
    name: string,
    email: string,
    password: string,
    role?: string,
    organizationId?: string
  ) => {
    try {
      const response = await authService.signup(name, email, password, role, organizationId);
      const emailConfirmationRequired = response.data.emailConfirmationRequired ?? false;

      if (!emailConfirmationRequired) {
        // Backend set auth cookies; update UI state from the user object
        setUser(response.data.user);
        TokenManager.setUser(response.data.user);

        // Priority 0: pending invite — always wins over onboarding
        const pendingInviteToken = localStorage.getItem('pendingInviteToken');
        if (pendingInviteToken) {
          router.push(`/invite/${pendingInviteToken}`);
        }
      }

      return { emailConfirmationRequired };
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(axiosError.response?.data?.message || "Signup failed");
    }
  };

  // ─── Logout ──────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      // Backend clears both HttpOnly cookies via Set-Cookie: Max-Age=0
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      disconnectSocket();
      TokenManager.clearTokens(); // clears user cache only
      setUser(null);
      router.push("/login");
    }
  };

  // ─── Refresh user ─────────────────────────────────────────────────────────
  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data.user);
      TokenManager.setUser(response.data.user);
    } catch (error) {
      console.error("Refresh user failed:", error);
    }
  };

  const value: AuthContextType = {
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
