import { describe, it, expect } from 'vitest';
import { isCustomHostPathAllowed } from './customHostAllowlist';

// Stage 3b item 2 — the design's (d) lists: custom hosts serve ONLY these.

describe('customHostAllowlist — allowed paths', () => {
  it.each([
    '/',
    '/board/some-slug',
    '/board/slug/nested',
    '/changelog',
    '/contact',
    '/feedback',
    '/feedback/boards',
    '/feedback/some-post-id',
    '/profile',
    '/roadmap',
    '/policy',
    '/features-request',
    '/api/public/boards',
    '/api/public/boards/feedback/posts',
    '/api/public/posts/123/upvote',
    '/_next/static/chunks/main-abc.js',
    '/_next/image?url=%2Flogo.png',
    '/favicon.ico',
    '/icon.png',
    '/robots.txt',
    '/sitemap.xml',
    // public/ static assets (fonts = globals.css on every page, videos =
    // landing, images = feedback/marketing pages)
    '/fonts/switzer/Switzer-Variable.woff2',
    '/images/icons/discord.svg',
    '/images/ai%20chat%20logo/faddy.png',
    '/videos/landing_page.mp4',
    '/videos/SaaS_ai_landing.mp4',
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
    '/board', // bare index is not a route (design allows /board/** only)
    '/boards', // near-miss
    '/fonts', // prefix boundary
    '/imagesx/a.png', // prefix boundary
    '/videos2/x.mp4', // prefix boundary
    '/.env', // dotfile
    '/api/publicx', // prefix boundary
  ])('denies %s', (path) => {
    expect(isCustomHostPathAllowed(path)).toBe(false);
  });
});
