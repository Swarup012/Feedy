-- ============================================================
-- SECURITY FIX: Session/Identity Bug — Corrupted Data Check
-- ============================================================
-- Run these queries against your Supabase database (via SQL Editor
-- or psql) to find any organization_members rows that were corrupted
-- by the session/identity bug while it was live.
--
-- DO NOT DELETE OR MODIFY ANY ROWS YET — just report the results.
-- ============================================================

-- ─── CHECK 1: Users who are members of orgs they likely shouldn't be ─────
-- Find users who belong to multiple organizations where at least one org
-- was created AFTER their account creation date (suspicious — suggests
-- they were added to an org via stale session token during signup).
SELECT
  om.user_id,
  u.email AS user_email,
  u.name AS user_name,
  u.created_at AS user_created_at,
  om.organization_id,
  o.name AS org_name,
  o.created_at AS org_created_at,
  om.role AS membership_role,
  om.joined_at,
  -- Flag: did this user sign up around the same time this org was created?
  -- (within 60 seconds = likely the bug)
  ABS(EXTRACT(EPOCH FROM (om.joined_at - o.created_at))) AS seconds_between_join_and_org_creation
FROM organization_members om
JOIN users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.organization_id
WHERE
  -- User belongs to more than one organization
  om.user_id IN (
    SELECT user_id
    FROM organization_members
    GROUP BY user_id
    HAVING COUNT(DISTINCT organization_id) > 1
  )
  -- AND the membership was created very close to the org creation
  -- (within 60 seconds — suspicious for the bug pattern)
  AND ABS(EXTRACT(EPOCH FROM (om.joined_at - o.created_at))) < 60
ORDER BY om.user_id, om.joined_at;


-- ─── CHECK 2: Organizations with multiple "owner" roles ──────────────────
-- Every org should have exactly ONE owner (set during onboarding).
-- Multiple owners suggests the bug added a second user as owner.
SELECT
  om.organization_id,
  o.name AS org_name,
  COUNT(DISTINCT om.user_id) AS owner_count,
  ARRAY_AGG(DISTINCT u.email) AS owner_emails
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN users u ON u.id = om.user_id
WHERE om.role = 'owner'
GROUP BY om.organization_id, o.name
HAVING COUNT(DISTINCT om.user_id) > 1;


-- ─── CHECK 3: Users whose current_organization_id doesn't match ──────────
-- their membership. This means they're "viewing" an org they aren't a member of.
SELECT
  u.id AS user_id,
  u.email,
  u.current_organization_id,
  o.name AS current_org_name,
  om2.role AS current_org_role
FROM users u
LEFT JOIN organizations o ON o.id = u.current_organization_id
LEFT JOIN organization_members om2
  ON om2.user_id = u.id AND om2.organization_id = u.current_organization_id
WHERE u.current_organization_id IS NOT NULL
  AND om2.id IS NULL;


-- ─── CHECK 4: Suspicious signup patterns ─────────────────────────────────
-- Find users who signed up (created_at) within 60 seconds of another user's
-- signup in the same org. This is the exact bug pattern.
SELECT
  u1.id AS user_a_id,
  u1.email AS user_a_email,
  u1.created_at AS user_a_created,
  u2.id AS user_b_id,
  u2.email AS user_b_email,
  u2.created_at AS user_b_created,
  ABS(EXTRACT(EPOCH FROM (u1.created_at - u2.created_at))) AS seconds_between_signups
FROM users u1
JOIN users u2
  ON u1.id != u2.id
  AND ABS(EXTRACT(EPOCH FROM (u1.created_at - u2.created_at))) < 60
  AND (
    -- Both users are members of at least one common org
    EXISTS (
      SELECT 1 FROM organization_members om1
      JOIN organization_members om2
        ON om1.organization_id = om2.organization_id
        AND om1.user_id = u1.id
        AND om2.user_id = u2.id
    )
    -- OR one user's current org belongs to the other user
    OR u1.current_organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = u2.id
    )
    OR u2.current_organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = u1.id
    )
  )
ORDER BY seconds_between_signups;


-- ─── CHECK 5: Row count summary ─────────────────────────────────────────
-- Quick overview of the data shape
SELECT
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM organizations) AS total_orgs,
  (SELECT COUNT(*) FROM organization_members) AS total_memberships,
  (SELECT COUNT(DISTINCT user_id) FROM organization_members) AS users_with_memberships,
  (SELECT COUNT(*) FROM organization_members WHERE role = 'owner') AS total_owners;
