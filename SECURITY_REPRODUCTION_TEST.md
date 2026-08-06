# Session/Identity Bug — Manual Reproduction Test

## Prerequisites
- Two distinct email addresses (userA@test.com, userB@test.com)
- A clean browser (or use Incognito/Private window)
- Access to the app's Supabase dashboard to inspect data

---

## Pre-Test: Confirm the Bug is Fixed

### Step 1 — Set up User A (the "victim")
1. Open a **regular Chrome window** (not Incognito)
2. Go to `/signup` and create an account with **userA@test.com**
3. Complete onboarding — create an organization called "User A Org"
4. Confirm you're on the admin dashboard and can see "User A Org" in the org switcher

### Step 2 — Force a session expiry (the re-login trigger)
1. Open DevTools → Application → Cookies
2. **Delete** the `refresh_token` cookie manually (leave `access_token` intact)
3. Refresh the page — you should see a brief loading spinner, then get redirected to `/login`
4. **DO NOT LOG IN AGAIN.** Stay on the `/login` page.

> **What happened:** The 401 interceptor fired, called `/api/auth/refresh` (which failed because you deleted the refresh token), and redirected to `/login`. The fixes should have:
> - Cleared `access_token`, `token`, and `faddy_user_cache` from localStorage
> - Called `supabase.auth.signOut()` to end the Supabase session
> - The HttpOnly cookies should be gone (or about to be overwritten)

### Step 3 — Verify cleanup happened
1. In DevTools → Application → Local Storage, confirm **all three keys are gone**:
   - `access_token` — should NOT exist
   - `token` — should NOT exist
   - `faddy_user_cache` — should NOT exist
2. In DevTools → Console, run: `await (await import('/lib/supabase')).supabase.auth.getSession()`
   - Should return `data.session === null` (Supabase session is cleared)

### Step 4 — Sign up as User B (different email)
1. Navigate to `/signup`
2. Create an account with **userB@test.com**
3. Complete onboarding — create an organization called "User B Org"

### Step 5 — Verify isolation (THE CRITICAL CHECK)
1. You should land on the admin dashboard showing **ONLY "User B Org"**
2. Open the organization switcher — it should list **ONLY "User B Org"**
3. Go to your profile/account settings — the email should show **userB@test.com**, NOT userA@test.com
4. In DevTools → Console, run:
   ```js
   const resp = await fetch('/api/organizations/me/all');
   const data = await resp.json();
   console.log('Orgs:', data.data.map(o => o.organizations.name));
   ```
   - Should print ONLY `["User B Org"]`
   - Should NOT contain "User A Org"

### Step 6 — Verify User A's data is completely inaccessible
1. In DevTools → Console, try to access User A's org directly:
   ```js
   // Replace with User A's actual org ID from the database
   const resp = await fetch('/api/organizations/YOUR_USER_A_ORG_ID');
   const data = await resp.json();
   console.log(data);
   ```
   - Should return 403 or 404 (not the org data)

---

## Expected Results (After Fix)

| Check | Before Fix | After Fix |
|---|---|---|
| localStorage after 401 redirect | `access_token` and `token` still present (User A's) | All cleared |
| Supabase session after 401 redirect | Still active for User A | Terminated |
| Org switcher after User B signup | Shows BOTH "User A Org" AND "User B Org" | Shows ONLY "User B Org" |
| Profile email after User B signup | Shows User A's email | Shows userB@test.com |
| `/api/organizations/me/all` after User B signup | Returns both orgs | Returns only User B's org |

---

## Regression Checks

After confirming the fix works, also verify these still work:

1. **Normal login/logout cycle** — Login as User B, see their org, logout, login again → should work
2. **Google OAuth** — If you have Google OAuth configured, sign in with Google → should set HttpOnly cookie and work
3. **Organization switching** — If a user legitimately belongs to multiple orgs, the switcher should still show all of them
4. **Token refresh** — Stay logged in for >30 min, make an API call → should silently refresh and not redirect to login


# State
this is test by manually right now.
