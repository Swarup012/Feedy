/**
 * CSRF Protection Utilities for OAuth
 *
 * This module handles state parameter generation and validation
 * to prevent Cross-Site Request Forgery attacks during OAuth flows.
 */

import type { NextRequest } from 'next/server';

const STATE_KEY = 'oauth_state';
const STATE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

interface OAuthState {
  value: string;
  expiresAt: number;
}

/**
 * Generate a cryptographically secure random state string
 */
export function generateState(): string {
  // Create a random string using crypto API
  const array = new Uint32Array(4);
  crypto.getRandomValues(array);
  const randomString = Array.from(array, (dec) => dec.toString(16)).join('');

  // Add timestamp to make it time-sensitive
  const timestamp = Date.now().toString(36);

  return `${randomString}-${timestamp}`;
}

/**
 * Store OAuth state with expiry
 */
export function storeState(state: string): void {
  if (typeof window === 'undefined') return;

  const stateData: OAuthState = {
    value: state,
    expiresAt: Date.now() + STATE_EXPIRY,
  };

  localStorage.setItem(STATE_KEY, JSON.stringify(stateData));
}

/**
 * Retrieve and remove OAuth state (one-time use)
 */
export function consumeState(): string | null {
  if (typeof window === 'undefined') return null;

  const stateStr = localStorage.getItem(STATE_KEY);
  if (!stateStr) return null;

  try {
    const stateData: OAuthState = JSON.parse(stateStr);

    // Remove from storage immediately (one-time use)
    localStorage.removeItem(STATE_KEY);

    // Check if expired
    if (Date.now() > stateData.expiresAt) {
      console.warn('⚠️ OAuth state expired');
      return null;
    }

    return stateData.value;
  } catch (error) {
    console.error('❌ Failed to parse OAuth state:', error);
    localStorage.removeItem(STATE_KEY);
    return null;
  }
}

/**
 * Verify state matches (for callback validation)
 */
export function verifyState(providedState: string): boolean {
  const storedState = consumeState();
  if (!storedState) return false;

  // Use constant-time comparison to prevent timing attacks
  if (storedState.length !== providedState.length) return false;

  let result = 0;
  for (let i = 0; i < storedState.length; i++) {
    result |= storedState.charCodeAt(i) ^ providedState.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Clear any existing state (for cleanup)
 */
export function clearState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STATE_KEY);
}

/**
 * Verify that a mutating request came from the same origin (Stage 3).
 *
 * Requires positive evidence: the Fetch Metadata `Sec-Fetch-Site` header
 * must be exactly `same-origin`. All other values fail — including `none`
 * (address-bar navigations and non-browser clients send it; a POST from an
 * address bar has no place on this API), `same-site` (acme.faddy.site →
 * faddy.site is exactly the CSRF shape SameSite=Lax does NOT stop), and
 * `cross-site`. When the header is absent entirely, the `Origin` header
 * must equal the request Host exactly (host:port, case-insensitive).
 * Missing Origin, Origin "null", and mismatches are all refused (fail
 * closed): browsers send one of the two headers on every POST, so absence
 * means a non-conforming client, which this proxy does not need to serve.
 *
 * Args:
 *   request: The incoming Next.js request.
 *
 * Returns:
 *   true only when the request is provably same-origin; false otherwise.
 */
export function verifySameOriginRequest(request: NextRequest): boolean {
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite !== null) {
    return secFetchSite === 'same-origin';
  }

  const origin = request.headers.get('origin');
  if (!origin) return false; // fail closed — no evidence of same origin
  // Exact string comparison (after lowercasing): the Origin's authority
  // (host[:port], scheme stripped) must equal the Host header verbatim —
  // no URL-parser normalization that would erase a port difference.
  const authority = origin.toLowerCase().match(/^[a-z][a-z0-9+.-]*:\/\/(.+)$/)?.[1];
  if (!authority) return false; // "null", unparseable, or missing scheme — fail closed
  const requestHost = (request.headers.get('host') ?? '').toLowerCase();
  return authority === requestHost;
}