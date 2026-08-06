import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { supabase } from "@/lib/supabase";
import { TokenManager } from "@/lib/tokenManager";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ─── Axios instance ──────────────────────────────────────────────────────────
// IMPORTANT: In the browser we use baseURL: "" (relative/same-origin).
//
// Why: After signup/login, the backend sets an HttpOnly cookie. The browser
// scopes that cookie to the origin that SET it — which is `faddy.site`
// (because signup goes through our Next.js auth proxy at /api/auth/[...path]).
//
// If we call the backend directly (api.faddy.site), the cookie is NOT sent
// because the browser treats faddy.site and api.faddy.site as different origins
// for host-only cookies. This causes every protected request to return 401.
//
// Solution: Keep all browser calls on the same origin (faddy.site / localhost:5173).
// Next.js Route Handlers extract the cookie and forward it to the backend.
// On the server (SSR / Route Handlers themselves) we use the absolute API_URL.
const isServer = typeof window === "undefined";

const api: AxiosInstance = axios.create({
  baseURL: isServer ? API_URL : "",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  withCredentials: true,
});


// ─── Request interceptor — subdomain header only ─────────────────────────────
// We no longer attach an Authorization header. The HttpOnly cookie is sent
// automatically by the browser. We still need the x-subdomain header for
// multi-tenancy routing on the backend.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.headers && typeof window !== "undefined") {
      // Auth is via HttpOnly cookies only — no Authorization header attached.
      // The browser sends the cookie automatically; the proxy extracts it.

      const hostname = window.location.hostname;
      const parts = hostname.split(".");
      let subdomain: string | null = null;

      // Production: acme.faddy.site
      if (parts.length >= 3 && !hostname.includes("localhost")) {
        subdomain = parts[0];
        if (["www", "api", "admin"].includes(subdomain)) subdomain = null;
      }

      // Development: acme.localhost:5173
      if (
        hostname.includes("localhost") &&
        parts.length > 1 &&
        parts[0] !== "localhost"
      ) {
        subdomain = parts[0];
      }

      if (subdomain) {
        config.headers["x-subdomain"] = subdomain;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response interceptor — cookie-based token refresh ───────────────────────
// When the server returns 401, we attempt a silent token refresh.
// The refresh endpoint reads the refresh_token HttpOnly cookie and responds
// with a new Set-Cookie: access_token=... header. No token handling in JS.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Endpoints whose 401 is expected and should NOT trigger a refresh attempt
    const expected401Endpoints = [
      "/api/auth/me",
      "/api/auth/login",
      "/api/auth/signup",
      "/api/auth/google",
    ];

    const requestUrl = originalRequest?.url || "";
    const isExpected401 = expected401Endpoints.some((ep) =>
      requestUrl.includes(ep)
    );

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isExpected401
    ) {
      originalRequest._retry = true;

      try {
        // Refresh the access token. MUST use a relative URL so the call goes
        // through the Next.js proxy — same reason as the main api baseURL.
        // Calling API_URL directly here would bypass the proxy and lose the cookie.
        const refreshUrl = isServer ? `${API_URL}/api/auth/refresh` : "/api/auth/refresh";
        await axios.post(
          refreshUrl,
          {},
          { withCredentials: true }
        );

        // Retry the original request — the new cookie is now in the jar
        return api(originalRequest);
      } catch {
        // Refresh failed — redirect to login unless on a public/auth page
        if (typeof window !== "undefined") {
          const path = window.location.pathname;

          const isPublicOrAuth =
            path === "/" ||
            path.startsWith("/login") ||
            path.startsWith("/signup") ||
            path.startsWith("/forgot-password") ||
            path.startsWith("/reset-password") ||
            path.startsWith("/auth/callback") ||
            path.startsWith("/onboarding") ||
            path.startsWith("/policy") ||
            path.startsWith("/docs") ||
            path.startsWith("/feedback/boards/") ||
            path.startsWith("/roadmap") ||
            path === "/pricing" ||
            path === "/about" ||
            path === "/contact" ||
            path === "/changelog" ||
            path === "/feedback" ||
            requestUrl.includes("/api/public/") ||
            requestUrl.includes("/api/organizations/subdomain/") ||
            requestUrl.includes("/api/invitations/");

          if (!isPublicOrAuth) {
            // SECURITY: Fully invalidate the session before redirecting.
            // Without this, stale tokens in localStorage and Supabase session
            // persist — allowing a subsequent signup to merge identities.
            TokenManager.clearTokens();
            supabase.auth.signOut().catch(() => {});
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ─── Helper: check if error is a plan-gate 403 ──────────────────────────────
// The backend requirePlan() middleware returns { code: 'PLAN_UPGRADE_REQUIRED' }.
// PaidFeatureGate/ProFeatureGate already shows the upgrade banner, so callers
// should suppress toasts for these errors to avoid the redundant notification.
export function isPlanUpgradeRequired(error: any): boolean {
  return (
    error?.response?.status === 403 &&
    error?.response?.data?.code === 'PLAN_UPGRADE_REQUIRED'
  );
}

export default api;
