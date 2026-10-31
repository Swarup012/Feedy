/**
 * ProFeatureGate — access must come from PLANS config, not a plan name.
 *
 *  feature="notifications"  → Starter and Pro see children, Free is gated
 *                             and is pointed at Starter (not Pro)
 *  feature="webhooks_api"   → still Pro-only (Starter gated, pointed at Pro)
 *  no feature prop          → legacy Pro-only behaviour preserved
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

let mockOrganization: Record<string, string | null> | null = null;

vi.mock("@/context/OrganizationContext", () => ({
  useOrganization: () => ({
    organization: mockOrganization,
    loading: false,
    organizationRole: "owner",
  }),
}));

vi.mock("@/components/UpgradeDialog", () => ({
  UpgradeDialog: () => null,
}));

const { ProFeatureGate } = await import("@/components/ProFeatureGate");

function setOrg(plan: string | null, status: string | null = "active") {
  mockOrganization =
    plan === null ? null : { subscription_plan: plan, subscription_status: status };
}

function renderGate(feature?: "notifications" | "webhooks_api") {
  return render(
    <ProFeatureGate featureName="Alerts" {...(feature ? { feature } : {})}>
      <div>secret-content</div>
    </ProFeatureGate>,
  );
}

beforeEach(() => {
  setOrg("free", null);
});

describe("feature='notifications'", () => {
  it("Starter active sees the content", () => {
    setOrg("starter");
    renderGate("notifications");

    expect(screen.getByText("secret-content")).not.toBeNull();
    expect(screen.queryByText(/Upgrade to/)).toBeNull();
  });

  it("Pro sees the content", () => {
    setOrg("pro");
    renderGate("notifications");

    expect(screen.getByText("secret-content")).not.toBeNull();
  });

  it("Free is gated and pointed at Starter", () => {
    setOrg("free", null);
    renderGate("notifications");

    expect(screen.getByText("Upgrade to Starter to use this feature.")).not.toBeNull();
  });

  it("Starter with a canceled subscription is still shown (backend stays authoritative)", () => {
    setOrg("starter", "canceled");
    renderGate("notifications");

    expect(screen.getByText("secret-content")).not.toBeNull();
  });
});

describe("feature='webhooks_api' stays Pro-only", () => {
  it("Starter is gated and pointed at Pro", () => {
    setOrg("starter");
    renderGate("webhooks_api");

    expect(screen.getByText("Upgrade to Pro to use this feature.")).not.toBeNull();
  });

  it("Pro sees the content", () => {
    setOrg("pro");
    renderGate("webhooks_api");

    expect(screen.getByText("secret-content")).not.toBeNull();
  });
});

describe("no feature prop — legacy Pro gate", () => {
  it("Starter is gated", () => {
    setOrg("starter");
    renderGate();

    expect(screen.getByText("Upgrade to Pro to use this feature.")).not.toBeNull();
  });

  it("Pro sees the content", () => {
    setOrg("pro");
    renderGate();

    expect(screen.getByText("secret-content")).not.toBeNull();
  });

  it("missing organization is gated", () => {
    mockOrganization = null;
    renderGate("notifications");

    expect(screen.getByText("Upgrade to Starter to use this feature.")).not.toBeNull();
  });
});
