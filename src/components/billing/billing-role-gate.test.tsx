import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SubscriptionInfo } from '@/services/paddleService';

const org = vi.hoisted(() => ({ role: 'owner' as string | null }));

vi.mock('@/context/OrganizationContext', () => ({
  useOrganization: () => ({ organizationRole: org.role }),
}));

// paddleService pulls in the Supabase client, which needs env vars this suite doesn't have.
vi.mock('@/services/paddleService', () => ({
  __esModule: true,
  default: { getSubscription: vi.fn(async () => ({ success: false })) },
}));

import { PlanCard } from '@/components/billing/PlanCard';
import { UpgradeDialog } from '@/components/UpgradeDialog';

const noop = () => {};

const starterSubscription: SubscriptionInfo = {
  status: 'active',
  plan: 'starter',
  trialEndsAt: null,
  currentPeriodStart: '2026-01-01',
  currentPeriodEnd: '2026-11-01',
  cancelAtPeriodEnd: false,
  hasActiveSubscription: true,
  billingProvider: 'paddle',
};

const freeSubscription: SubscriptionInfo = {
  ...starterSubscription,
  status: 'free',
  plan: 'free',
  hasActiveSubscription: false,
  currentPeriodEnd: null,
};

function renderPlanCard(subscription: SubscriptionInfo, role: string | null) {
  org.role = role;
  return render(
    <PlanCard
      subscription={subscription}
      onUpgrade={noop}
      onDowngrade={noop}
      onCancel={noop}
      actionLoading={false}
    />,
  );
}

const NOTE = 'Only the organization owner can change billing.';

describe('PlanCard billing role gate (used by /admin/billing and Organization > Billing tab)', () => {
  beforeEach(() => {
    org.role = 'owner';
  });

  it('owner sees Upgrade and Cancel buttons', () => {
    renderPlanCard(starterSubscription, 'owner');
    expect(screen.getByRole('button', { name: /Upgrade to Pro/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Cancel Subscription/ })).toBeTruthy();
    expect(screen.queryByText(NOTE)).toBeNull();
  });

  it('admin sees no billing buttons, sees owner-only note', () => {
    renderPlanCard(starterSubscription, 'admin');
    expect(screen.queryByRole('button', { name: /Upgrade to Pro/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Cancel Subscription/ })).toBeNull();
    expect(screen.getByText(NOTE)).toBeTruthy();
  });

  it('member sees no billing buttons, sees owner-only note', () => {
    renderPlanCard(starterSubscription, 'member');
    expect(screen.queryByRole('button', { name: /Upgrade to Pro/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Cancel Subscription/ })).toBeNull();
    expect(screen.getByText(NOTE)).toBeTruthy();
  });

  it('owner on the free plan sees Choose a Plan', () => {
    renderPlanCard(freeSubscription, 'owner');
    expect(screen.getByRole('button', { name: /Choose a Plan/ })).toBeTruthy();
    expect(screen.queryByText(NOTE)).toBeNull();
  });

  it('member on the free plan sees no Choose a Plan', () => {
    renderPlanCard(freeSubscription, 'member');
    expect(screen.queryByRole('button', { name: /Choose a Plan/ })).toBeNull();
    expect(screen.getByText(NOTE)).toBeTruthy();
  });

  it('read-only info stays visible for non-owners', () => {
    renderPlanCard(starterSubscription, 'member');
    expect(screen.getByText('Starter')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('$25')).toBeTruthy();
  });

  it('unknown role (null, still loading) fails closed', () => {
    renderPlanCard(starterSubscription, null);
    expect(screen.queryByRole('button', { name: /Upgrade to Pro/ })).toBeNull();
    expect(screen.getByText(NOTE)).toBeTruthy();
  });
});

const UPGRADE_NOTE = 'Ask your organization owner to upgrade';

describe('UpgradeDialog (feature-gate upsell) billing role gate', () => {
  beforeEach(() => {
    org.role = 'owner';
  });

  it('owner sees both Start Free Trial buttons', () => {
    org.role = 'owner';
    render(<UpgradeDialog open={true} onOpenChange={noop} subscription={null} />);
    expect(screen.getAllByRole('button', { name: /Start Free Trial/ })).toHaveLength(2);
    expect(screen.queryByTestId('owner-only-note')).toBeNull();
  });

  it('admin sees no trial buttons, sees owner-only note', () => {
    org.role = 'admin';
    render(<UpgradeDialog open={true} onOpenChange={noop} subscription={null} />);
    expect(screen.queryAllByRole('button', { name: /Start Free Trial/ })).toHaveLength(0);
    expect(screen.getAllByTestId('owner-only-note').length).toBeGreaterThan(0);
  });

  it('member sees no trial buttons, sees owner-only note', () => {
    org.role = 'member';
    render(<UpgradeDialog open={true} onOpenChange={noop} subscription={null} />);
    expect(screen.queryAllByRole('button', { name: /Start Free Trial/ })).toHaveLength(0);
    expect(screen.getAllByTestId('owner-only-note').length).toBeGreaterThan(0);
  });

  it('standalone trigger: owner gets Upgrade button, member gets the note instead', () => {
    org.role = 'owner';
    const ownerView = render(<UpgradeDialog subscription={null} />);
    expect(screen.getByRole('button', { name: /Upgrade/ })).toBeTruthy();
    ownerView.unmount();

    org.role = 'member';
    render(<UpgradeDialog subscription={null} />);
    expect(screen.queryByRole('button', { name: /^Upgrade$/ })).toBeNull();
    expect(screen.getByTestId('owner-only-note').textContent).toContain(UPGRADE_NOTE);
  });
});
