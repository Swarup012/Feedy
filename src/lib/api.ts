import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ─── Axios instance ──────────────────────────────────────────────────────────
// baseURL points directly at the Express backend.
// withCredentials: true is REQUIRED so the browser automatically includes
// the HttpOnly access_token cookie on every request to the backend origin.
// CORS on the backend already allows the Next.js origin (localhost:5173)
// with credentials, so cross-origin cookie transmission works correctly.
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  withCredentials: true, // ← sends HttpOnly cookies on every request
});


// ─── Request interceptor — subdomain header only ─────────────────────────────
// We no longer attach an Authorization header. The HttpOnly cookie is sent
// automatically by the browser. We still need the x-subdomain header for
// multi-tenancy routing on the backend.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.headers && typeof window !== "undefined") {
      // Fallback: for Google OAuth users whose token is stored in localStorage
      // by the auth callback page (legacy approach, still in use).
      // Cookies are the primary auth mechanism; this is a bridge fallback.
      const localToken =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      if (localToken) {
        config.headers.Authorization = `Bearer ${localToken}`;
      }

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
        // Ask the backend to rotate the access token using the refresh cookie.
        // The backend will respond with Set-Cookie: access_token=<new>; HttpOnly
        await axios.post(
          `${API_URL}/api/auth/refresh`,
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
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
