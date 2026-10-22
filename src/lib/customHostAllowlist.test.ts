import { describe, it, expect } from 'vitest';
import { isCustomHostPathAllowed, legacyBoardPath } from './customHostAllowlist';

// Stage 3b item 2 — the design's (d) lists: custom hosts serve ONLY these.
// Stage 3b-2 step 1: /contact /profile /policy /features-request retired
// (faddy.site-only), /board/** retired in favor of canonical /feedback/**
// (middleware 307s the legacy paths — see legacyBoardPath below).

describe('customHostAllowlist — allowed paths', () => {
  it.each([
    '/',
    '/changelog',
    '/feedback',
    '/feedback/boards',
    '/feedback/boards/some-slug',
    '/feedback/some-post-id',
    '/roadmap',
    '/api/public/boards',
    '/api/public/boards/feedback/posts',
    '/api/public/posts/123/upvote',
    '/_next/static/chunks/main-abc.js',
    '/_next/image?url=%2Flogo.png',
    '/favicon.ico',
    '/icon.png',
    '/robots.txt',
    '/sitemap.xml',
    '/board/x', // redirect-only endpoint (route 307s, never content)
    '/board/x/post-42',
    '/board/', // allowlisted; bare shape — route 404s (not a legacy pattern)
    '/board/a/b/c', // allowlisted; >2 segments — route 404s
    // public/ static assets (fonts = globals.css on every page, images =
    // PostDetails provider icons only)
    '/fonts/switzer/Switzer-Variable.woff2',
    '/images/icons/discord.svg',
  ])('allows %s', (path) => {
    expect(isCustomHostPathAllowed(path)).toBe(true);
  });
});

describe('customHostAllowlist — denied paths (hard 404)', () => {
  it.each([
    '/admin',
    '/admin/analytics',
    '/dashboard',
    '/onboarding',
    '/create-organization',
    '/invite/abc123',
    '/oauth/authorize',
    '/auth/login',
    '/login',
    '/signup',
    '/widget',
    '/widget.js',
    '/test-socket',
    '/docs/api',
    '/unauthorized',
    '/api/auth/login',
    '/api/organizations/me',
    '/api/boards/feedback',
    '/api/users/me/current-organization',
    '/api/admin/settings',
    '/api/widget/config',
    '/api/clusters/assign',
    '/api/internal/host-lookup',
    '/api/custom-domains',
    '/feedbackx', // prefix boundary: /feedback/ not /feedback
    '/boards', // near-miss
    '/board', // bare — not a legacy pattern, no trailing-slash prefix match
    '/fonts', // prefix boundary
    '/imagesx/a.png', // prefix boundary
    '/images/ai%20chat%20logo/faddy.png', // narrowed prefix: /images/icons/ only
    '/images/analytics_basic.png', // non-icon asset — marketing/admin only
    '/feedback/../admin', // dot-segment escape riding the /feedback/ prefix
    '/feedback%2f..%2fadmin', // percent-encoded dot-segment escape
    '/feedback/%2e%2e/admin', // encoded dots, literal slashes
    '/videos/landing_page.mp4', // /videos/ retired — marketing-landing only
    '/videos2/x.mp4', // prefix boundary
    '/.env', // dotfile
    '/api/publicx', // prefix boundary
    // Faddy-only pages retired on custom hosts (link to faddy.site instead)
    '/contact',
    '/profile',
    '/policy',
    '/features-request',
    // bare /board denied; /board/** is allowlisted (redirect-only route)
    '/board',
  ])('denies %s', (path) => {
    expect(isCustomHostPathAllowed(path)).toBe(false);
  });
});

describe('legacyBoardPath — canonical /board/** -> /feedback/** mapping', () => {
  it.each([
    ['/board/acme-board', '/feedback/boards/acme-board'],
    ['/board/acme-board/post-42', '/feedback/post-42'],
    ['/board/acme-board/', '/feedback/boards/acme-board'], // trailing slash
    ['/board/acme-board/post-42/', '/feedback/post-42'],
    ['/board/with?query=1', '/feedback/boards/with'], // query ignored
    ['/board/with#frag', '/feedback/boards/with'], // fragment ignored
  ])('%s -> %s', (input, expected) => {
    expect(legacyBoardPath(input)).toBe(expected);
  });

  it.each([
    '/board',
    '/board/',
    '/board/a/b/c',
    '/boards/a',
    '/feedback/boards/a',
    '/boardx/a',
  ])('null for %s', (input) => {
    expect(legacyBoardPath(input)).toBeNull();
  });
});
