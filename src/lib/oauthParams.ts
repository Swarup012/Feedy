/**
 * Pure validation for the Zapier OAuth authorize query string.
 *
 * Everything here is side-effect free so it can be unit tested. `scope` is
 * deliberately never read — the provider ignores any requested scopes and
 * always grants its fixed set. No value from the query is ever echoed back in
 * an error message (state and redirect_uri must not leak into rendered text).
 */

export interface OAuthAuthorizeParams {
  responseType: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}

export type OAuthParamsResult =
  | { ok: true; params: OAuthAuthorizeParams }
  | { ok: false; error: string };

/** Anything with a `get` — URLSearchParams or Next's ReadonlyURLSearchParams. */
export type QueryLike = { get(name: string): string | null };

export function validateOAuthParams(query: QueryLike): OAuthParamsResult {
  const responseType = query.get('response_type');
  if (responseType !== 'code') {
    return {
      ok: false,
      error: 'This request does not use the authorization code flow, so Faddy cannot approve it.',
    };
  }

  const clientId = query.get('client_id');
  if (!clientId) {
    return { ok: false, error: 'This request is missing a client_id.' };
  }

  const redirectUri = query.get('redirect_uri');
  if (!redirectUri) {
    return { ok: false, error: 'This request is missing a redirect_uri.' };
  }

  const state = query.get('state');
  if (!state) {
    return { ok: false, error: 'This request is missing a state parameter.' };
  }

  const codeChallenge = query.get('code_challenge');
  if (!codeChallenge) {
    return { ok: false, error: 'This request is missing a PKCE code_challenge.' };
  }

  const codeChallengeMethod = query.get('code_challenge_method');
  if (codeChallengeMethod !== 'S256') {
    return {
      ok: false,
      error: 'This request must use PKCE with code_challenge_method=S256.',
    };
  }

  return {
    ok: true,
    params: {
      responseType,
      clientId,
      redirectUri,
      state,
      codeChallenge,
      codeChallengeMethod,
    },
  };
}
