// src/config/plans.ts
// =====================================================
// SHARED PLAN CONFIGURATION (single source of truth for frontend)
// Mirrors backend plans.config.js — keep values in sync.
// =====================================================

export type PlanTier = 'free' | 'starter' | 'pro';
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due' | 'free';

export interface PlanFeatures {
  organizations: number;
  boards: number;
  posts_per_board: number;
  posts_per_month: number;
  team_members: number;
  admin_members: number;
  tracked_users: number;
  roadmap_items: number;
  custom_branding: boolean;
  custom_domain: number;
  advanced_analytics: boolean;
  overage_allowed: boolean;
  // Feature access (tier gating)
  widget: boolean;
  webhooks_api: boolean;
  integrations: boolean;
  autopilot_manual: boolean;
  ai_chat: boolean;
  autopilot_auto: boolean;
  severity_rules: boolean;
  severity_ai: boolean;
  notifications: boolean;
}

export interface PlanOverage {
  grace_buffer: number;
  effective_limit: number;
  price_per_block: number;
  block_size: number;
}

export interface PlanConfig {
  name: string;
  monthlyPrice: number;   // display price in dollars
  yearlyPrice: number;    // display price in dollars per month when billed yearly
  yearlyTotal: number;    // total yearly cost in dollars
  features: PlanFeatures;
  overage?: PlanOverage;
}

// ── Plan definitions (mirrors backend plans.config.js) ──────────────────────
export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyTotal: 0,
    features: {
      organizations: 1,
      boards: 3,
      posts_per_board: 5,
      posts_per_month: 50,
      team_members: 3,
      admin_members: -1,
      tracked_users: 20,
      roadmap_items: 1,
      custom_branding: false,
      custom_domain: 0,
      advanced_analytics: false,
      overage_allowed: false,
      // Feature access (tier gating)
      widget: true,
      webhooks_api: false,
      integrations: false,
      autopilot_manual: false,
      ai_chat: false,
      autopilot_auto: false,
      severity_rules: true,
      severity_ai: false,
      notifications: false,
    },
  },
  starter: {
    name: 'Starter',
    monthlyPrice: 25,
    yearlyPrice: 19,
    yearlyTotal: 228,
    features: {
      organizations: 1,
      boards: -1,
      posts_per_board: -1,
      posts_per_month: -1,
      team_members: -1,
      admin_members: 5,
      tracked_users: 125,
      roadmap_items: -1,
      custom_branding: true,
      custom_domain: 0,
      advanced_analytics: true,
      overage_allowed: true,
      // Feature access (tier gating)
      widget: true,
      webhooks_api: true,
      integrations: true,
      autopilot_manual: true,
      ai_chat: true,
      autopilot_auto: false,
      severity_rules: true,
      severity_ai: false,
      notifications: false,
    },
    overage: {
      grace_buffer: 25,
      effective_limit: 150,
      price_per_block: 6.0,
      block_size: 50,
    },
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 59,
    yearlyPrice: 49,
    yearlyTotal: 588,
    features: {
      organizations: 1,
      boards: -1,
      posts_per_board: -1,
      posts_per_month: -1,
      team_members: -1,
      admin_members: 10,
      tracked_users: 125,
      roadmap_items: -1,
      custom_branding: true,
      custom_domain: 1,
      advanced_analytics: true,
      overage_allowed: true,
      // Feature access (tier gating)
      widget: true,
      webhooks_api: true,
      integrations: true,
      autopilot_manual: true,
      ai_chat: true,
      autopilot_auto: true,
      severity_rules: true,
      severity_ai: true,
      notifications: true,
    },
    overage: {
      grace_buffer: 25,
      effective_limit: 150,
      price_per_block: 6.0,
      block_size: 50,
    },
  },
};

// ── Plan resolution ─────────────────────────────────────────────────────────

/**
 * Resolve the canonical plan from organization data.
 * subscription_plan is the authoritative field (updated by payment webhooks).
 * Falls back to the legacy `plan` column, then to 'free'.
 */
export function resolvePlan(organization: { subscription_plan?: string; plan?: string } | null | undefined): PlanTier {
  const plan = organization?.subscription_plan || organization?.plan || 'free';
  if (plan === 'starter' || plan === 'pro') return plan;
  return 'free';
}

/**
 * Check if the plan is paid (starter or pro) with an active subscription.
 */
export function isPaidPlan(
  organization: { subscription_plan?: string; plan?: string; subscription_status?: string } | null | undefined,
): boolean {
  if (!organization) return false;
  const plan = resolvePlan(organization);
  const status = organization.subscription_status;
  return plan !== 'free' && (status === 'active' || status === 'trialing');
}

// ── Plan check helpers ──────────────────────────────────────────────────────

export function isFree(organization: { subscription_plan?: string; plan?: string } | null | undefined): boolean {
  return resolvePlan(organization) === 'free';
}

export function isStarter(organization: { subscription_plan?: string; plan?: string } | null | undefined): boolean {
  return resolvePlan(organization) === 'starter';
}

export function isPro(organization: { subscription_plan?: string; plan?: string } | null | undefined): boolean {
  return resolvePlan(organization) === 'pro';
}

/**
 * Returns true if the plan has unlimited boards/posts/etc.
 * (starter and pro are both "paid" with unlimited limits).
 */
export function hasUnlimited(organization: { subscription_plan?: string; plan?: string } | null | undefined): boolean {
  const plan = resolvePlan(organization);
  return plan === 'starter' || plan === 'pro';
}

// ── Feature limit helpers ───────────────────────────────────────────────────

/**
 * Get a specific feature limit for a plan. Returns Infinity for unlimited (-1).
 */
export function getFeatureLimit(plan: PlanTier, feature: keyof PlanFeatures): number {
  const value = PLANS[plan].features[feature];
  return value === -1 ? Infinity : value;
}

/**
 * Check if a plan allows a feature (non-zero).
 */
export function planAllowsFeature(plan: PlanTier, feature: keyof PlanFeatures): boolean {
  const value = PLANS[plan].features[feature];
  if (typeof value === 'boolean') return value;
  return value !== 0;
}

// ── Plan display helpers (for pricing cards & billing UI) ────────────────────

export interface FeatureDisplayItem {
  text: string;
  included: boolean;
  highlight?: boolean;
  bold?: boolean;
}

/**
 * Derive feature display lists for pricing cards from the canonical PLANS config.
 * This ensures pricing UIs always reflect the actual tier gating, not hardcoded text.
 */
export function getPlanFeatureDisplay(tier: PlanTier): {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyTotal: number;
  savings: number;
  features: FeatureDisplayItem[];
} {
  const plan = PLANS[tier];
  const f = plan.features;
  const savings = plan.monthlyPrice * 12 - plan.yearlyTotal;

  const features: FeatureDisplayItem[] = [];

  if (tier === 'free') {
    features.push(
      { text: f.boards === -1 ? 'Unlimited boards' : `${f.boards} boards`, included: true },
      { text: f.posts_per_board === -1 ? 'Unlimited posts per board' : `${f.posts_per_board} posts per board`, included: true },
      { text: `${f.tracked_users} tracked users`, included: true },
      { text: `${f.team_members} members`, included: true },
      { text: 'Basic priority flagging', included: true },
      { text: 'Public roadmap & changelog', included: true },
      { text: 'Feedback widget', included: true },
      { text: 'Integrations (Slack, Discord, Intercom)', included: false },
      { text: 'AI Chat', included: false },
      { text: 'Autopilot', included: false },
      { text: 'Webhooks & API', included: false },
    );
  } else if (tier === 'starter') {
    features.push(
      { text: 'Everything in Free, plus:', bold: true, included: true },
      { text: 'Unlimited boards & posts', included: true, highlight: true },
      { text: `Unlimited members, up to ${f.admin_members} admins`, included: true, highlight: true },
      { text: `${f.tracked_users}+ tracked users with overage billing`, included: true },
      { text: 'Slack, Discord & Intercom integrations', included: true },
      { text: 'Autopilot manual mode', included: true },
      { text: 'AI Chat', included: true },
      { text: 'Webhooks & API access', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Custom branding', included: true },
      { text: 'Autopilot Automatic Mode', included: false },
      { text: 'AI-powered severity classification', included: false },
      { text: 'Configurable Slack/Discord alerts', included: false },
    );
  } else {
    features.push(
      { text: 'Everything in Starter, plus:', bold: true, included: true },
      { text: 'Autopilot Automatic Mode', included: true, highlight: true },
      { text: 'AI-powered severity classification', included: true, highlight: true },
      { text: 'Needs Attention Slack/Discord alerts', included: true, highlight: true },
      { text: `Unlimited members, up to ${f.admin_members} admins`, included: true },
      { text: `${f.tracked_users}+ tracked users with overage billing`, included: true },
      { text: f.custom_domain > 0 ? `${f.custom_domain} custom domain${f.custom_domain > 1 ? 's' : ''}` : 'Custom domains', included: true, highlight: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Custom branding', included: true },
    );
  }

  return {
    name: plan.name,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    yearlyTotal: plan.yearlyTotal,
    savings,
    features,
  };
}
