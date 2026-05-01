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
import { getPublicReturnUrl, clearReturnUrl } from "@/lib/returnUrl";

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
      // Skip auth check for public pages that don't need authentication
      const isPublicPage = typeof window !== 'undefined' && (
        window.location.pathname.startsWith('/policy') ||
        window.location.pathname.startsWith('/docs') ||
        window.location.pathname === '/login' ||
        window.location.pathname === '/signup' ||
        window.location.pathname === '/forgot-password' ||
        window.location.pathname === '/reset-password' ||
        window.location.pathname === '/pricing' ||
        window.location.pathname === '/contact' ||
        window.location.pathname === '/changelog' ||
        window.location.pathname === '/feedback' ||
        window.location.pathname === '/collect-feedback' ||
        window.location.pathname === '/analyze-feedback' ||
        window.location.pathname === '/share-updates' ||
        window.location.pathname === '/role-based-access' ||
        window.location.pathname === '/public-roadmap'
      );
      
      if (isPublicPage) {
        console.log('📄 Public page detected:', window.location.pathname);
        
        // Still check for cached user/token on public pages
        const token = TokenManager.getAccessToken();
        const cachedUser = TokenManager.getUser();
        
        if (token && cachedUser) {
          console.log('✅ Using cached user data on public page:', cachedUser.email);
          setUser(cachedUser);
          initSocket(token);
        } else {
          console.log('📄 No cached auth on public page, continuing as guest');
        }
        
        setLoading(false);
        return;
      }

      const token = TokenManager.getAccessToken();
      const cachedUser = TokenManager.getUser();

      console.log('🔍 checkAuth started:', {
        hasToken: !!token,
        hasCachedUser: !!cachedUser,
        cachedUserEmail: cachedUser?.email,
        cachedUserOrg: cachedUser?.current_organization_id,
        cachedUserOrgRole: cachedUser?.organization_role
      });

      // If we have cached user data, use it immediately
      if (cachedUser) {
        console.log('✅ Using cached user data immediately:', cachedUser.email);
        setUser(cachedUser);

        // Try to verify with server in background, but don't fail if it fails
        // This handles the race condition where backend hasn't processed the user yet
        try {
          const response = await authService.getMe();
          console.log('✅ Background verification succeeded, updating user data');
          setUser(response.data.user);
          TokenManager.setUser(response.data.user);
        } catch (error) {
          // Don't clear tokens - trust the cache
          console.warn('⚠️ getMe() failed, using cached user data:', error);
          // Still initialize socket if we have a token
          if (token) {
            initSocket(token);
          }
        }

        setLoading(false);
        return; // Exit early - don't continue to getMe() below
      }

      // Even if no token in localStorage, try to verify with server
      // (cookies might be present for cross-subdomain auth)
      const response = await authService.getMe();
      
      console.log('✅ Fresh user data from server:', {
        email: response.data.user.email,
        current_organization_id: response.data.user.current_organization_id,
        organization_role: response.data.user.organization_role,
        organization_id: response.data.user.organization_id
      });
      
      setUser(response.data.user);
      TokenManager.setUser(response.data.user);

      // 🔌 Initialize Socket.io connection (only if we have token)
      if (token) {
        initSocket(token);
      }
    } catch (error) {
      // Check if we have cached data to fall back on
      const cachedUser = TokenManager.getUser();
      const cachedToken = TokenManager.getAccessToken();

      // If we have cached data, trust it instead of clearing tokens
      // This handles race conditions where backend hasn't processed the user yet
      if (cachedUser && cachedToken) {
        console.warn('⚠️ getMe() failed, using cached auth data:', error);
        setUser(cachedUser);
        initSocket(cachedToken);
        setLoading(false);
        return; // Don't clear tokens - trust the cache
      }

      // Only log error if we're not on a public page (guests are expected to fail auth check)
      const isPublicPage = typeof window !== 'undefined' && (
        window.location.pathname === '/' ||
        window.location.pathname.startsWith('/feedback/boards/') ||
        window.location.pathname.startsWith('/roadmap') ||
        window.location.pathname.startsWith('/docs') ||
        window.location.pathname === '/pricing' ||
        window.location.pathname === '/contact' ||
        window.location.pathname === '/changelog' ||
        window.location.pathname === '/feedback' ||
        window.location.pathname.startsWith('/auth/callback') ||
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/signup') ||
        window.location.pathname.startsWith('/onboarding')
      );

      if (!isPublicPage) {
        console.error("Auth check failed with no cache:", error);
        console.log('🚨 Auth failed on non-public page, clearing tokens:', window.location.pathname);
        TokenManager.clearTokens();
        setUser(null);
        disconnectSocket();
      } else {
        console.log('ℹ️ Auth check failed on public/auth page (expected, not clearing tokens):', window.location.pathname);
        // Don't clear tokens on public/auth pages - user might be mid-authentication
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 🔧 FIX: Handle cross-subdomain auth transfer via URL hash
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const isCallbackPage = window.location.pathname.startsWith('/auth/callback');
      
      // Skip auto-storing tokens on callback page - let callback page handle it
      if (hash && hash.includes('access_token') && !isCallbackPage) {
        console.log('🔐 Detected auth tokens in URL hash - transferring to localStorage');
        
        // Parse tokens from hash
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken && refreshToken) {
          // Save to localStorage on this subdomain
          TokenManager.setTokens(accessToken, refreshToken);
          console.log('✅ Auth tokens transferred to new subdomain');
          
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname + window.location.search);
          
          // Force immediate auth check to refresh user data with new organization context
          checkAuth();
          return; // Don't run checkAuth again below
        }
      } else if (isCallbackPage) {
        console.log('⏭️ Skipping auto-token storage on callback page');
        // Still need to run checkAuth, but don't store hash tokens
        checkAuth();
        return;
      }
    }
    
    checkAuth();
    
    // If coming from invite acceptance, force a fresh auth check
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('from') === 'invite') {
        console.log('🎫 Coming from invite - forcing fresh auth check');
        // Remove the parameter to avoid infinite loops
        window.history.replaceState({}, '', window.location.pathname);
        // Force another check after a brief delay to ensure tokens are saved
        setTimeout(() => {
          checkAuth();
        }, 500);
      }
    }
  }, [checkAuth]);

  // 🔑 Listen for auth-tokens-stored event to re-check authentication
  // This fixes the race condition where AuthContext doesn't re-run checkAuth() after OAuth callback
  useEffect(() => {
    const handleTokensStored = (event: CustomEvent) => {
      console.log('🔔 auth-tokens-stored event received, re-checking auth');
      checkAuth();
    };

    window.addEventListener('auth-tokens-stored', handleTokensStored as EventListener);

    return () => {
      window.removeEventListener('auth-tokens-stored', handleTokensStored as EventListener);
    };
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

      // 🎫 PRIORITY CHECK: If user has pending invite, redirect to invite acceptance
      const pendingInviteToken = typeof window !== 'undefined' ? localStorage.getItem('pendingInviteToken') : null;
      if (pendingInviteToken) {
        console.log('🎫 Pending invite detected, redirecting to invite page:', pendingInviteToken);
        router.push(`/invite/${pendingInviteToken}`);
        return;
      }

      // 🔙 PRIORITY 2: Check for return URL (user clicked login from a specific page)
      const returnUrl = getPublicReturnUrl();
      if (returnUrl) {
        console.log('🔙 Returning to saved URL:', returnUrl);
        clearReturnUrl();
        router.push(returnUrl);
        return;
      }

      // Check if user is on a public subdomain page (feedback/roadmap/changelog)
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const isOnPublicPage = currentPath.startsWith('/feedback') || 
                             currentPath.startsWith('/roadmap') || 
                             currentPath.startsWith('/changelog');
      
      // Get subdomain context
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const parts = hostname.split('.');
      let hasSubdomain = false;
      
      if (hostname.includes('localhost') && parts.length > 1 && parts[0] !== 'localhost') {
        hasSubdomain = true;
      } else if (parts.length >= 3 && !['www', 'api', 'admin'].includes(parts[0])) {
        hasSubdomain = true;
      }

      // If user logged in from subdomain public page, stay on that page
      if (hasSubdomain && isOnPublicPage) {
        console.log('🔄 Staying on current public page after login (subdomain context)');
        // Refresh the page to update auth state
        window.location.reload();
        return;
      }

      // Check if user has an organization
      const hasOrganization = !!response.data.user.current_organization_id;
      
      if (!hasOrganization) {
        // External user with no organization - send to onboarding to create one
        console.log('🆕 New user without organization - redirecting to onboarding');
        router.push("/onboarding");
        return;
      }

      // User has organization - redirect based on role
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
