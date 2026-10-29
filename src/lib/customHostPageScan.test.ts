import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';

// ============================================================
// Stage 3b-2 step 5 — custom-host page → API surface scan.
//
// For every page middleware serves on a custom hostname (the allowlist), walk
// its import graph and fail if any reachable file contains:
//   (a) a browser API path literal outside /api/public/**, or
//   (b) a *Service.<method> call to a non-public method,
// unless the file is listed in EXCEPTIONS below with a reason (the gated
// call site is proven by other tests — see each entry).
//
// Why: middleware already 404s non-public calls from custom hosts, so the
// danger is not a data leak — it's a broken feature (a write fired from a
// customer origin). This scan freezes the current set of gated call sites so
// a NEW unguarded call fails the build until someone reviews it here.
//
// Scope: src/services/** are API client libraries — their call SITES live in
// pages/components, which are scanned. The scan strips // and /* */ comments
// first (docstrings reference endpoint paths without calling them).
// ============================================================

const SRC = path.resolve(__dirname, '..');

/** Route entries + the group layout every custom-host page renders under. */
const ALLOWED_PAGE_ENTRIES: readonly string[] = [
  'app/(public)/layout.tsx',
  'app/(public)/changelog/page.tsx',
  'app/(public)/feedback/page.tsx',
  'app/(public)/feedback/boards/[slug]/page.tsx',
  'app/(public)/feedback/[postId]/page.tsx',
  'app/(public)/roadmap/page.tsx',
  'app/(public)/roadmap/[boardSlug]/page.tsx',
];

/**
 * Reachable files with non-public calls that ARE gated — each entry names the
 * gate (and the test that proves it, where one exists). Removing a gate
 * without removing the entry is caught by those tests; a stale entry fails
 * "every exception is still reachable AND still an offender" below.
 */
const EXCEPTIONS: Readonly<Record<string, string>> = {
  'app/(public)/layout-client.tsx':
    'org subdomain lookup runs only when !isCustomHost; custom hosts get branding from the server layout instead (step 3, layout-client.test)',
  'app/(public)/feedback/components/submit-feedback.tsx':
    'createPost runs only after the isAuthenticated check; custom hosts never render this component (feedback-client renders a login link instead, step 2)',
  'app/(public)/roadmap/page.tsx':
    'voted/vote calls sit behind if (!user); custom hosts redirect the guest to faddy.site/login (step 2)',
  'app/(public)/roadmap/[boardSlug]/page.tsx':
    'hasUserVoted/voteRoadmapItem behind if (!user); same guest → faddy.site/login redirect (step 2)',
  'components/feedback/PostDetails.tsx':
    'write handlers redirect to faddy.site/login when isCustomHost; reads are session-aware (user ? public fallback) and folded history requires a user (step 2)',
  'components/feedback/PostRevenueLine.tsx':
    'revenue fetch gated on admin/owner role + mrr_insights plan inside the effect; user is always null on custom hosts so the request never fires (post-revenue-line.test)',
  'components/feedback/CreatePostDialog.tsx':
    'mounted only as {user && <CreatePostDialog>} — impossible on custom hosts (user always null there)',
  'components/feedback/CreateBoardDialog.tsx':
    'opened only from role-gated (admin/owner) sidebar buttons — guests and custom-host visitors never see them',
  'components/UpgradeDialog.tsx':
    'paddle checkout opens only from role-gated/limit flows: canCreateBoard stays true for guests (prefetch is user-gated) and the create dialogs are unmounted without a user',
  'hooks/useJobRoles.ts':
    'listRoles runs only when organizationId is truthy; OrganizationContext stays null on custom hosts (no session → no org fetch)',
  'components/feedback/LeftSidebar.tsx':
    'usage prefetch gated on user (step 5 fix); update/delete/dependencies run from role-gated click handlers',
  'components/feedback/CompletionChangelogDialog.tsx':
    'rendered by PostDetails only in the admin/owner status flow (role-gated, user null on custom hosts)',
  'components/roadmap/AddToRoadmapModal.tsx':
    'opened only from PostDetails admin/owner actions (role-gated, user null on custom hosts)',
  'context/AuthContext.tsx':
    'all custom-host paths are PUBLIC_PATHS → no getMe; login/signup/ws-ticket unreachable (/login is allowlist-404)',
  'context/OrganizationContext.tsx':
    'fetches only when isAuthenticated — impossible on a custom host (cookie domain .faddy.site, per-origin storage)',
  'hooks/useFeedbackData.ts':
    'mixed module: allowed pages import only the usePublic* hooks; the non-public hooks it also exports are never imported by these entries',
  'lib/api.ts':
    'the axios instance itself (auth/interceptor endpoint constants) — not a call site',
};

const SKIP = (rel: string): boolean => rel.startsWith('services/');

const API_LITERAL = /['"`](\/api\/[^'"`?#\s]*)/g;
const SERVICE_CALL = /\b([A-Za-z]+Service)\.([A-Za-z_]+)\b/g;

/**
 * Strip comments without eating code. Both patterns anchor to line starts on
 * purpose: a mid-line block-comment opener occurs inside string literals
 * (e.g. an accept="slash-star" pattern, slash-star prose in comments) and in
 * JSX comments — pairing those with regex would swallow real call sites.
 * Line-start comments are exactly where docstrings live (e.g. socket.ts's
 * getWsTicket usage example, which must NOT count as a call).
 */
function stripComments(src: string): string {
  return src
    .replace(/^[ \t]*\/\*[\s\S]*?\*\//gm, '')
    .replace(/^[ \t]*\/\/[^\n]*/gm, '');
}

function resolveImport(spec: string, fromFile: string): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // npm package
  for (const cand of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ]) {
    if (existsSync(cand) && statSync(cand).isFile()) return cand;
  }
  return null;
}

/** Import-graph closure over the allowed entries, as src-relative paths. */
function reachableFiles(): Set<string> {
  const seen = new Set<string>();
  const queue = ALLOWED_PAGE_ENTRIES.map((e) => path.join(SRC, e));
  while (queue.length) {
    const file = queue.pop()!;
    if (!file.startsWith(SRC)) continue;
    const rel = path.relative(SRC, file).split(path.sep).join('/');
    if (seen.has(rel)) continue;
    seen.add(rel);
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)) {
      const resolved = resolveImport(m[1], file);
      if (resolved) queue.push(resolved);
    }
  }
  return seen;
}

/** Non-public offenders in one file: [kind, detail] pairs. */
function offendersIn(rel: string): string[] {
  if (SKIP(rel)) return [];
  const src = stripComments(readFileSync(path.join(SRC, rel), 'utf8'));
  const out: string[] = [];
  for (const m of src.matchAll(API_LITERAL)) {
    if (!m[1].startsWith('/api/public/')) out.push(`literal ${m[1]}`);
  }
  for (const m of src.matchAll(SERVICE_CALL)) {
    if (m[2].startsWith('getPublic')) continue;
    out.push(`call ${m[1]}.${m[2]}`);
  }
  return out;
}

describe('custom-host pages → API surface scan (3b-2 step 5)', () => {
  const reachable = reachableFiles();

  it('all allowlisted entry files exist', () => {
    for (const entry of ALLOWED_PAGE_ENTRIES) {
      expect(existsSync(path.join(SRC, entry)), entry).toBe(true);
    }
  });

  it('no unguarded non-public API call in the reachable graph', () => {
    const failures: string[] = [];
    for (const rel of [...reachable].sort()) {
      if (EXCEPTIONS[rel]) continue;
      for (const hit of offendersIn(rel)) failures.push(`${rel}: ${hit}`);
    }
    expect(failures).toEqual([]);
  });

  it('every exception is reachable AND still an offender (no stale entries)', () => {
    const problems: string[] = [];
    for (const [rel, reason] of Object.entries(EXCEPTIONS)) {
      expect(reason.length, rel).toBeGreaterThan(20); // reasons are mandatory
      if (!reachable.has(rel)) {
        problems.push(`${rel}: no longer reachable from an allowed page`);
      } else if (offendersIn(rel).length === 0) {
        problems.push(`${rel}: has no offender anymore — delete the entry`);
      }
    }
    expect(problems).toEqual([]);
  });
});
