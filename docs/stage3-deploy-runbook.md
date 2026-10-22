# Stage 3 — Custom Hostname Deploy Runbook

Operational steps for rolling out Cloudflare-for-SaaS custom hostnames.
No git commands here — deploy from CI/your normal release path.

## 1. CSRF_MODE rollout

`CSRF_MODE` controls the central middleware CSRF check on every mutating
`/api/**` request (POST/PUT/PATCH/DELETE). The check verifies same-origin
(`Sec-Fetch-Site: same-origin`, else exact `Origin == Host` — see
`src/lib/csrf.ts`). Internal machine hosts (INTERNAL_HOSTS) return before
the check and are exempt; non-`/api` POSTs (server actions, OAuth pages)
are out of scope.

| Value | Behavior |
|---|---|
| unset / `log` (default) | Log `{evt:'csrf_check', method, path, ok}` — never blocks. |
| `enforce` | Failed check → bare `403` with `Cache-Control: no-store`. |

### Rollout order

1. Deploy with `CSRF_MODE=log` (or unset) on staging.
2. Watch logs for `csrf_check` with `ok:false` — investigate anything real.
3. Run the browser checklist below against staging (log mode: all flows
   must still work; any failure here is a bug in the check, not user error).
4. Flip `CSRF_MODE=enforce` on staging, re-run the checklist.
5. Promote the same env change to production; keep watching `ok:false`.

### Browser checklist (each in a real browser, signed in)

- [ ] Login (first-party `*.faddy.site`)
- [ ] OAuth authorize consent flow (`/oauth/authorize` — non-`/api`, must be unaffected)
- [ ] Onboarding
- [ ] Create organization
- [ ] File upload
- [ ] ai-chat (admin)

## 2. Custom-host redirect behavior

On custom (customer) hostnames only — first-party `*.faddy.site` is
unchanged:

| Path | Result |
|---|---|
| `/board/:slug` | `307` → `/feedback/boards/:slug` (query preserved) |
| `/board/:slug/:postId` | `307` → `/feedback/:postId` |
| `/` | `307` → `/feedback` |
| anything else not allowlisted | `404` (`Cache-Control: no-store`) |

Mechanism: `/board/**` is served by the redirect route handler
(`src/app/board/[[...slug]]/route.ts`, allowlisted so it is reachable);
`/` is redirected by the `(marketing)` server layout via
`next/navigation` `redirect()`. Middleware itself NEVER emits a Location —
Next 15's middleware adapter URL-parses every Location header and crashes
on relative values (`Invalid URL`). Both redirects send a **relative**
Location (path + query only, no origin, built without `request.url`) —
immune to `X-Forwarded-Proto`/`X-Forwarded-Host`. `/board/**` responses
carry `Cache-Control: no-store`; `/` carries the framework redirect's own
no-store policy.

Safety posture (tested in `src/app/board/[[...slug]]/route.test.ts`):

- Redirect targets are pure path rewrites — no tenant involvement beyond
  the middleware-derived `x-custom-host` gate.
- Crafted inputs (`/board//evil.com/x`, `/board/%2f%2fevil.com`,
  `/board/%5cevil.com`, `/board/..%2f`) never produce a Location that is
  protocol-relative (`//...`), scheme-absolute, or any absolute URL.
  Encoded segments stay encoded and relative; `/board//evil.com/x` 404s
  (Next's own `//`-collapse 308 fires first in production and is also
  relative).
- Unresolved custom hosts are 404'd by middleware before the route runs
  (no redirect, no existence leak, no tenant headers).

## 3. Custom-host path allowlist (trimmed)

Stage 3b-2 retired Faddy-only pages on custom hosts — they now 404 and
all links to them are absolute to `faddy.site`:

- Removed: `/contact`, `/profile`, `/policy/**`, `/features-request`,
  `/board/**` (legacy redirect instead).
- Still allowed: `/`, `/changelog`, `/feedback`, `/feedback/**`,
  `/roadmap`, favicon/icon/robots/sitemap, `/_next/static/**`,
  `/_next/image`, `/api/public/**`, `/fonts/**`, `/images/**`,
  `/videos/**`.

Source of truth: `src/lib/customHostAllowlist.ts`. When adding a public
page intended for customers, add it there AND keep the API prefix in sync
with `PUBLIC_API_PREFIX` in `proxyHelper.ts`.

## 4. Staging smoke checks (run against the deployed app + backend)

Host header examples use a hostname registered in staging's
custom_hostname table.

```sh
# Custom host resolves
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: tenant.staging.example' https://<staging>/feedback        # 200

# Unknown custom host
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: unknown.staging.example' https://<staging>/feedback      # 404

# Legacy redirects (relative Location, no origin — verified identical
# with and without X-Forwarded-Proto/X-Forwarded-Host headers)
curl -sI -H 'Host: tenant.staging.example' https://<staging>/board/foo          # 307 Location: /feedback/boards/foo
curl -sI -H 'Host: tenant.staging.example' https://<staging>/board/foo/p1       # 307 Location: /feedback/p1
curl -sI -H 'Host: tenant.staging.example' https://<staging>/                    # 307 Location: /feedback

# Trimmed allowlist
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: tenant.staging.example' https://<staging>/contact        # 404
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: tenant.staging.example' https://<staging>/admin         # 404

# Open-redirect hard cases (Location must be relative / absent — never //, never absolute)
curl -s -o /dev/null -D - -H 'Host: tenant.staging.example' https://<staging>/board//evil.com/x            # 404, no Location
curl -s -o /dev/null -D - -H 'Host: tenant.staging.example' 'https://<staging>/board/%2f%2fevil.com'       # 307, relative Location
curl -s -o /dev/null -D - -H 'Host: tenant.staging.example' 'https://<staging>/board/%5cevil.com'          # 307, relative Location
curl -s -o /dev/null -D - -H 'Host: tenant.staging.example' 'https://<staging>/board/..%2f'                # 307, relative Location

# First-party unchanged
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: faddy.site' https://<staging>/          # 200 (no redirect)
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: faddy.site' https://<staging>/board/x   # 404 (page retired; no redirect)

# CSRF — log mode: cross-site POST logs ok:false but is not blocked by middleware
# (the public POST route has its own same-origin gate and 403s it).
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Host: faddy.site' \
  -H 'Sec-Fetch-Site: cross-site' -H 'Origin: https://evil.example' \
  https://<staging>/api/public/posts/1/upvote                                            # 403 (route JSON) + log ok:false

# CSRF — enforce mode: same request is a bare 403 from middleware (no body, no-store)
curl -s -o /dev/null -D - -X POST -H 'Host: faddy.site' \
  -H 'Sec-Fetch-Site: same-origin' \
  https://<staging>/api/public/posts/1/upvote                                            # 200 (same-origin passes)

# Branding: custom host page HTML contains the organization name from
# host-lookup (server-side fetch), not client JS.
curl -s -H 'Host: tenant.staging.example' https://<staging>/feedback | grep -o '<Org Name>'
```

Server-side checks:

- App logs show `csrf_check` entries only for mutating `/api/**` requests;
  none from INTERNAL_HOSTS.
- Backend `POST /api/custom-domains/:id/verify` 429s on a second call
  within the cooldown window (frontend must surface it, not retry-hammer).
