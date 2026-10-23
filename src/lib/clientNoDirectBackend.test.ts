import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';

// Stage 3b-2 final gate (design rule of thumb): no fetch/axios in any
// "use client" file may mention NEXT_PUBLIC_API_URL or set x-subdomain.
// Documented exceptions (by exact relative path):
//   app/widget/page.tsx       — embeddable widget, apiKey-scoped, served to
//                               third-party sites, by design talks to the
//                               backend directly (design table row #8)
//   app/admin/widgets/page.tsx — only BUILDS the embed snippet string for
//                               display — not a tenant call (design row #7)

const SRC = path.resolve(__dirname, '..');
const EXCEPTED = new Set(['app/widget/page.tsx', 'app/admin/widgets/page.tsx']);

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* walk(full);
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      yield full;
    }
  }
}

function clientFilesWith(pattern: RegExp): string[] {
  const hits: string[] = [];
  for (const file of walk(SRC)) {
    const rel = path.relative(SRC, file).split(path.sep).join('/');
    if (EXCEPTED.has(rel)) continue;
    const source = readFileSync(file, 'utf8');
    if (!/^["']use client["'];?/m.test(source)) continue;
    if (pattern.test(source)) hits.push(rel);
  }
  return hits;
}

describe('no client-side direct backend calls (3b-2 Step 5)', () => {
  it('no "use client" file mentions NEXT_PUBLIC_API_URL (widget excepted)', () => {
    expect(clientFilesWith(/NEXT_PUBLIC_API_URL/)).toEqual([]);
  });

  it('no "use client" file sets an x-subdomain header (widget excepted)', () => {
    // Catches `x-subdomain` as a header key; proxyHelper/middleware/server
    // code is not "use client" and is unaffected.
    expect(clientFilesWith(/["']x-subdomain["']/)).toEqual([]);

    // Documented exception — lib/api.ts: the axios request interceptor sets
    // x-subdomain for first-party *.faddy.site hosts only (production routes
    // first-party /api/* straight to Express, bypassing the Next middleware
    // that would derive it server-side). The carve-out must keep BOTH guards:
    // the first-party hostname gate and the browser-only check.
    const api = readFileSync(path.join(SRC, 'lib', 'api.ts'), 'utf8');
    expect(api, 'lib/api.ts must keep the first-party .faddy.site gate').toContain(
      '".faddy.site"',
    );
    expect(api, 'lib/api.ts interceptor must stay browser-only').toContain(
      'typeof window !== "undefined"',
    );
  });
});
