/**
 * TokenManager — Cookie-based auth edition
 *
 * Tokens (access_token, refresh_token) are now stored as HttpOnly cookies
 * set by the backend. This module no longer reads or writes tokens.
 *
 * The only thing stored client-side is a lightweight user-profile cache in
 * localStorage, purely as a UX optimisation (instant first-paint without an
 * extra network round-trip). It is NOT used for authorisation decisions.
 */

const USER_CACHE_KEY = "faddy_user_cache";

export const TokenManager = {
  // ─── Token methods (no-ops — tokens live in HttpOnly cookies) ───────────────

  /** @deprecated Tokens are now HttpOnly cookies set by the backend. */
  getAccessToken(): null {
    return null;
  },

  /** @deprecated Tokens are now HttpOnly cookies set by the backend. */
  getRefreshToken(): null {
    return null;
  },

  /** @deprecated Tokens are now HttpOnly cookies set by the backend. */
  setTokens(_accessToken: string, _refreshToken: string): void {
    // Intentionally empty — the backend sets HttpOnly cookies via Set-Cookie.
  },

  /** Clears the user cache only. The backend clears auth cookies on logout. */
  clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(USER_CACHE_KEY);
  },

  // ─── User-profile cache (localStorage, NOT used for auth) ───────────────────

  setUser(user: any): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } catch {
      // Ignore storage errors (private browsing quota, etc.)
    }
  },

  getUser(): any | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(USER_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};
