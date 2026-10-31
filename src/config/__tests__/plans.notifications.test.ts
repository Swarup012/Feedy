/**
 * Plan config + pricing copy consistency for the notifications tier.
 *
 * Guards three things:
 *  - features.notifications matches the shipped entitlement (Free no,
 *    Starter yes, Pro yes) and features.severity_ai stays Pro-only
 *  - pricing-card copy is derived from those flags (no stale "instant
 *    alerts" / "urgent flagging" claims left in the Pro list)
 *  - prices are NOT touched by the notifications change
 */
import { describe, it, expect } from "vitest";
import {
  PLANS,
  planAllowsFeature,
  resolvePlan,
  getPlanFeatureDisplay,
} from "@/config/plans";

describe("features.notifications", () => {
  it("grants alerts to Starter and Pro, not Free", () => {
    expect(PLANS.free.features.notifications).toBe(false);
    expect(PLANS.starter.features.notifications).toBe(true);
    expect(PLANS.pro.features.notifications).toBe(true);
  });

  it("planAllowsFeature reflects the same entitlement", () => {
    expect(planAllowsFeature("free", "notifications")).toBe(false);
    expect(planAllowsFeature("starter", "notifications")).toBe(true);
    expect(planAllowsFeature("pro", "notifications")).toBe(true);
  });

  it("resolvePlan still maps unknown/legacy values to free", () => {
    expect(resolvePlan({ subscription_plan: "starter" })).toBe("starter");
    expect(resolvePlan({ subscription_plan: "pro" })).toBe("pro");
    expect(resolvePlan({ plan: "enterprise" })).toBe("free");
    expect(resolvePlan(null)).toBe("free");
  });
});

describe("features.severity_ai remains Pro-only", () => {
  it("only Pro grants AI severity", () => {
    expect(PLANS.free.features.severity_ai).toBe(false);
    expect(PLANS.starter.features.severity_ai).toBe(false);
    expect(PLANS.pro.features.severity_ai).toBe(true);
  });
});

describe("pricing card copy", () => {
  const starterTexts = getPlanFeatureDisplay("starter").features.map((f) => f.text);
  const proTexts = getPlanFeatureDisplay("pro").features.map((f) => f.text);

  it("Starter advertises high-severity feedback alerts", () => {
    expect(starterTexts).toContain("High-Severity Feedback Alerts");
  });

  it("Pro advertises AI severity and API access & webhooks", () => {
    expect(proTexts).toContain("Advanced Severity Detection");
    expect(proTexts).toContain("Developer API & Webhook Access");
  });

  it("drops the claims the code does not support", () => {
    for (const stale of ["Instant alerts", "Urgent-issue flagging", "Automatic feedback triage"]) {
      expect(proTexts).not.toContain(stale);
      expect(starterTexts).not.toContain(stale);
    }
  });

  it("does not offer alert channels to Free", () => {
    const freeTexts = getPlanFeatureDisplay("free").features.map((f) => f.text);
    expect(freeTexts.some((t) => /alert/i.test(t))).toBe(false);
  });
});

describe("prices are unchanged by the notifications tier move", () => {
  it("keeps the published monthly / yearly figures", () => {
    expect(PLANS.free.monthlyPrice).toBe(0);
    expect(PLANS.starter.monthlyPrice).toBe(25);
    expect(PLANS.starter.yearlyPrice).toBe(19);
    expect(PLANS.starter.yearlyTotal).toBe(228);
    expect(PLANS.pro.monthlyPrice).toBe(59);
    expect(PLANS.pro.yearlyPrice).toBe(49);
    expect(PLANS.pro.yearlyTotal).toBe(588);
  });

  it("keeps the overage economics", () => {
    expect(PLANS.starter.overage).toEqual({
      grace_buffer: 25,
      effective_limit: 150,
      price_per_block: 12,
      block_size: 50,
    });
  });
});
