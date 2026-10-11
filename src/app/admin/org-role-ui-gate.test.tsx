import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================
// UI role gates matching the backend authorize(['owner','admin'])
// on tracked-users routes, paddle invoices, and changelog writes.
// ============================================================

const ctx = vi.hoisted(() => ({
  role: 'owner' as string | null,
  push: vi.fn(),
  getInvoices: vi.fn(async () => ({ success: true, data: { invoices: [] } })),
  getSubscription: vi.fn(async () => ({
    success: true,
    data: {
      status: 'active',
      plan: 'starter',
      trialEndsAt: null,
      currentPeriodStart: '2026-01-01',
      currentPeriodEnd: '2026-11-01',
      cancelAtPeriodEnd: false,
      hasActiveSubscription: true,
      billingProvider: 'paddle',
    },
  })),
}));

vi.mock('@/context/OrganizationContext', () => ({
  useOrganization: () => ({
    organization: { id: 'org-1', name: 'Acme' },
    organizations: [],
    organizationRole: ctx.role,
    loading: false,
    orgsFetchStatus: 'loaded',
    refreshOrganization: vi.fn(),
  }),
}));

// ProtectedRoute reads organization_role off the auth user.
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', organization_role: ctx.role },
    loading: false,
    isAuthenticated: true,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: ctx.push, replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useErrorHandler', () => ({
  useErrorHandler: () => vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), delete: vi.fn(), post: vi.fn() },
}));

vi.mock('@/services/trackedUsersService', () => ({
  default: {
    getUsage: vi.fn(async () => ({
      success: true,
      data: {
        count: 5,
        limit: 100,
        usage_percent: 5,
        status: 'good',
        days_remaining: 20,
        current_period: 'October 2026',
        peak: 5,
        breakdown: { posts: 1, votes: 2, comments: 2 },
      },
    })),
    getHistory: vi.fn(async () => ({ success: true, data: { history: [] } })),
    getList: vi.fn(async () => ({
      success: true,
      data: { users: [], pagination: { pages: 1 } },
    })),
    exportCSV: vi.fn(async () => {}),
    recalculateCache: vi.fn(async () => ({ success: true })),
  },
}));

vi.mock('@/services/paddleService', () => ({
  __esModule: true,
  default: {
    getInvoices: ctx.getInvoices,
    getSubscription: ctx.getSubscription,
  },
}));

// Page-only dialogs are not under test.
vi.mock('@/components/billing/UpgradeDialog', () => ({
  UpgradeDialog: () => null,
}));
vi.mock('@/components/billing/CancelFlow', () => ({
  CancelFlow: () => null,
}));

// recharts pulls canvas-ish layout; stub chart shells.
vi.mock('recharts', () => ({
  LineChart: () => null,
  Line: () => null,
  BarChart: () => null,
  Bar: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('gsap', () => ({
  default: { registerPlugin: vi.fn(), fromTo: vi.fn(), to: vi.fn() },
}));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }));

vi.mock('@/services/changelogService', () => ({
  changelogService: {
    getAllChangelogs: vi.fn(async () => ({ data: { changelogs: [] } })),
    getRecentPublished: vi.fn(async () => ({ data: { changelogs: [] } })),
    createChangelog: vi.fn(),
    updateChangelog: vi.fn(),
    deleteChangelog: vi.fn(),
    publishChangelog: vi.fn(),
  },
}));

// lottie-web (via LoadingAnimation → ProtectedRoute) needs a real canvas in jsdom.
vi.mock('lottie-react', () => ({
  default: () => null,
}));

vi.mock('@/components/LoadingAnimation', () => ({
  LoadingAnimation: () => null,
}));

import TrackedUsersPage from '@/app/admin/tracked-users/page';
import BillingPage from '@/app/admin/billing/page';
import ChangelogPage from '@/app/admin/changelog/page';
import trackedUsersService from '@/services/trackedUsersService';

const USAGE_SERVICE = vi.mocked(trackedUsersService);

beforeEach(() => {
  ctx.role = 'owner';
  ctx.push.mockClear();
  ctx.getInvoices.mockClear();
  ctx.getSubscription.mockClear();
  USAGE_SERVICE.getUsage.mockClear();
  USAGE_SERVICE.getList.mockClear();
  USAGE_SERVICE.exportCSV.mockClear();
  USAGE_SERVICE.recalculateCache.mockClear();
});

// ── Tracked users page ───────────────────────────────────────────────

describe('Tracked users page role gate', () => {
  it('member is redirected and sees no list / Export CSV / Refresh', async () => {
    ctx.role = 'member';
    render(<TrackedUsersPage />);
    await waitFor(() => expect(ctx.push).toHaveBeenCalledWith('/unauthorized'));
    expect(screen.queryByText('Tracked Users List')).toBeNull();
    expect(screen.queryByRole('button', { name: /Export CSV/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Refresh/ })).toBeNull();
    // No gated fetches fire for members.
    expect(USAGE_SERVICE.getUsage).not.toHaveBeenCalled();
    expect(USAGE_SERVICE.getList).not.toHaveBeenCalled();
    expect(USAGE_SERVICE.exportCSV).not.toHaveBeenCalled();
    expect(USAGE_SERVICE.recalculateCache).not.toHaveBeenCalled();
  });

  it('admin sees the list, Export CSV, and Refresh', async () => {
    ctx.role = 'admin';
    render(<TrackedUsersPage />);
    await waitFor(() =>
      expect(screen.getByText('Tracked Users List')).toBeTruthy()
    );
    expect(screen.getByRole('button', { name: /Export CSV/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Refresh/ })).toBeTruthy();
    expect(USAGE_SERVICE.getUsage).toHaveBeenCalled();
    expect(USAGE_SERVICE.getList).toHaveBeenCalled();
  });

  it('owner sees the list, Export CSV, and Refresh', async () => {
    ctx.role = 'owner';
    render(<TrackedUsersPage />);
    await waitFor(() =>
      expect(screen.getByText('Tracked Users List')).toBeTruthy()
    );
    expect(screen.getByRole('button', { name: /Export CSV/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Refresh/ })).toBeTruthy();
  });
});

// ── Changelog page ───────────────────────────────────────────────────

describe('Changelog page role gate', () => {
  it('member sees reads but no New Entry / Create First Entry', async () => {
    ctx.role = 'member';
    render(<ChangelogPage />);
    await waitFor(() =>
      expect(screen.getByText('No updates yet')).toBeTruthy()
    );
    expect(screen.queryByRole('button', { name: /New Entry/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Create First Entry/ })).toBeNull();
  });

  it('admin sees New Entry and Create First Entry', async () => {
    ctx.role = 'admin';
    render(<ChangelogPage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /New Entry/ })).toBeTruthy()
    );
    expect(screen.getByRole('button', { name: /Create First Entry/ })).toBeTruthy();
  });

  it('owner sees New Entry and Create First Entry', async () => {
    ctx.role = 'owner';
    render(<ChangelogPage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /New Entry/ })).toBeTruthy()
    );
    expect(screen.getByRole('button', { name: /Create First Entry/ })).toBeTruthy();
  });
});

// ── Billing page (InvoiceHistory gate) ───────────────────────────────

describe('Billing page InvoiceHistory role gate', () => {
  it('member: no Payment History, invoices never fetched, plan still readable', async () => {
    ctx.role = 'member';
    render(<BillingPage />);
    await waitFor(() => expect(ctx.getSubscription).toHaveBeenCalled());
    expect(screen.queryByText('Payment History')).toBeNull();
    expect(ctx.getInvoices).not.toHaveBeenCalled();
    // Plan name + status stay readable for members.
    expect(screen.getByText('Starter')).toBeTruthy();
  });

  it('admin: Payment History shown, invoices fetched', async () => {
    ctx.role = 'admin';
    render(<BillingPage />);
    await waitFor(() => expect(screen.getByText('Payment History')).toBeTruthy());
    expect(ctx.getInvoices).toHaveBeenCalled();
  });

  it('owner: Payment History shown, invoices fetched', async () => {
    ctx.role = 'owner';
    render(<BillingPage />);
    await waitFor(() => expect(screen.getByText('Payment History')).toBeTruthy());
    expect(ctx.getInvoices).toHaveBeenCalled();
  });
});
