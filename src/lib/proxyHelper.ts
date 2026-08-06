import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * Extract the auth token from an incoming Next.js request.
 *
 * SECURITY: Only the access_token HttpOnly cookie is trusted. The frontend
 * no longer sends an Authorization header (the localStorage fallback was
 * removed to prevent stale-token identity cross-contamination). Accepting
 * an Authorization header here would reintroduce the vulnerability.
 *
 * Returns a "Bearer <token>" string or null.
 */
export function extractAuthHeader(request: NextRequest): string | null {
  const cookieToken = request.cookies.get('access_token')?.value;
  if (cookieToken) {
    return `Bearer ${cookieToken}`;
  }

  return null;
}

/**
 * Build the standard headers to forward to the Express backend.
 * Always includes Authorization when available.
 * Defaults Content-Type to application/json — override via `extra` for
 * multipart / binary requests where a forced JSON header would corrupt the body.
 */
export function buildBackendHeaders(
  authHeader: string | null,
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };

  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  return headers;
}

export { BACKEND_URL };
