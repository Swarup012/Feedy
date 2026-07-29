import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * Extract the best available auth token from an incoming Next.js request.
 *
 * Priority:
 *  1. Authorization header (set by axios for localStorage users / Google OAuth)
 *  2. access_token HttpOnly cookie (set by the backend for email/password users)
 *
 * Returns a "Bearer <token>" string or null.
 */
export function extractAuthHeader(request: NextRequest): string | null {
  // 1. Prefer explicit Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader;
  }

  // 2. Fall back to HttpOnly cookie
  const cookieToken = request.cookies.get('access_token')?.value;
  if (cookieToken) {
    return `Bearer ${cookieToken}`;
  }

  return null;
}

/**
 * Build the standard headers to forward to the Express backend.
 * Always includes Authorization when available. Does NOT set a default
 * Content-Type — callers should include it in `extra` when needed,
 * so binary/multipart requests are not corrupted by a forced JSON header.
 */
export function buildBackendHeaders(
  authHeader: string | null,
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = { ...extra };

  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  return headers;
}

export { BACKEND_URL };
