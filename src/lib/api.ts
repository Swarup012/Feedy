import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { TokenManager } from "./tokenManager";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // Increased to 30 seconds
});

// Request interceptor - Add auth token and subdomain
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = TokenManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add subdomain header for multi-tenancy
    if (config.headers && typeof window !== 'undefined') {
      // Extract subdomain from current hostname
      const hostname = window.location.hostname;
      const parts = hostname.split(".");
      let subdomain: string | null = null;
      
      // Handle production domains (e.g., acme.fady.com)
      if (parts.length >= 3 && !hostname.includes("localhost")) {
        subdomain = parts[0];
        // Ignore www and common subdomains
        if (subdomain === "www" || subdomain === "api" || subdomain === "admin") {
          subdomain = null;
        }
      }
      
      // Handle development (localhost with subdomain simulation)
      // e.g., acme.localhost:5173
      if (hostname.includes("localhost") && parts.length > 1 && parts[0] !== "localhost") {
        subdomain = parts[0];
      }
      
      if (subdomain) {
        config.headers['x-subdomain'] = subdomain;
      }
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = TokenManager.getRefreshToken();

        if (!refreshToken) {
          // No refresh token - check if we're on a public/auth page
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const isAuthPage = currentPath.includes('/login') || 
                             currentPath.includes('/signup') || 
                             currentPath.includes('/forgot-password');
            
            // Only redirect if NOT on an auth page
            if (!isAuthPage) {
              TokenManager.clearTokens();
              window.location.href = "/login";
            }
          }
          return Promise.reject(error);
        }

        // Try to refresh token
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data.data;

        // Save new tokens
        TokenManager.setTokens(access_token, refresh_token);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - check if we're on a public/auth page
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const isAuthPage = currentPath.includes('/login') || 
                           currentPath.includes('/signup') || 
                           currentPath.includes('/forgot-password');
          
          // Only redirect if NOT on an auth page
          if (!isAuthPage) {
            TokenManager.clearTokens();
            window.location.href = "/login";
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
