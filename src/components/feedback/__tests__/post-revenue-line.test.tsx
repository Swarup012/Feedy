/**
 * PostRevenueLine — the admin-only "Known MRR" line PostDetails mounts
 * above User Attributes. PostDetails renders on public pages, so this test
 * proves the revenue endpoint is NEVER called for non-admins (or Free
 * plans), and renders nothing on 403/404/locked/no-data/failure.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PostRevenueLine } from '@/components/feedback/PostRevenueLine';

const h = vi.hoisted(() => ({
  get: vi.fn(),
  user: null as any,
  organization: null as any,
}));

vi.mock('@/lib/api', () => ({
  default: { get: h.get },
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: h.user }),
}));
vi.mock('@/context/OrganizationContext', () => ({
  useOrganization: () => ({ organization: h.organization, loading: false }),
}));

const STARTER_ORG = { id: 'org-1', subscription_plan: 'starter', subscription_status: 'active' };
const FREE_ORG = { id: 'org-1', subscription_plan: 'free', subscription_status: 'active' };

beforeEach(() => {
  h.get.mockReset();
  h.user = null;
  h.organization = STARTER_ORG;
});

describe('PostRevenueLine', () => {
  it('non-admin (member) → revenue endpoint is never called, renders nothing', async () => {
    h.user = { organization_role: 'member' };
    render(<PostRevenueLine postId="p1" />);
    await waitFor(() => expect(h.get).not.toHaveBeenCalled());
    expect(screen.queryByText('Known MRR')).toBeNull();
  });

  it('anonymous (no user) → never called', async () => {
    h.user = null;
    render(<PostRevenueLine postId="p1" />);
    await waitFor(() => expect(h.get).not.toHaveBeenCalled());
  });

  it('admin on Free plan → never called (overview-only plan)', async () => {
    h.user = { organization_role: 'admin' };
    h.organization = FREE_ORG;
    render(<PostRevenueLine postId="p1" />);
    await waitFor(() => expect(h.get).not.toHaveBeenCalled());
    expect(screen.queryByText('Known MRR')).toBeNull();
  });

  it('admin on Starter + data → renders "$X/mo · n of m customers have revenue data"', async () => {
    h.user = { organization_role: 'owner' };
    h.get.mockResolvedValue({
      data: {
        data: {
          mrr: 4200,
          customerCount: 7,
          customersWithMrr: 3,
          currency: 'USD',
        },
      },
    });
    render(<PostRevenueLine postId="p1" />);
    expect(await screen.findByText('Known MRR')).toBeTruthy();
    expect(
      screen.getByText('$4,200/mo · 3 of 7 customers have revenue data')
    ).toBeTruthy();
    expect(h.get).toHaveBeenCalledTimes(1);
    expect(h.get).toHaveBeenCalledWith('/api/posts/p1/revenue');
  });

  it('403 / 404 / locked / no-revenue-data → renders nothing, no console errors', async () => {
    h.user = { organization_role: 'admin' };
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const cases = [
      () => Promise.reject({ response: { status: 403 } }),
      () => Promise.reject({ response: { status: 404 } }),
      () => Promise.resolve({ data: { data: { locked: true } } }),
      () =>
        Promise.resolve({
          data: {
            data: { mrr: 0, customerCount: 5, customersWithMrr: 0, currency: 'USD' },
          },
        }),
    ];
    for (const mock of cases) {
      h.get.mockReset();
      h.get.mockImplementation(mock as any);
      const { unmount } = render(<PostRevenueLine postId="p1" />);
      await waitFor(() => expect(h.get).toHaveBeenCalled());
      await waitFor(() => expect(screen.queryByText('Known MRR')).toBeNull());
      unmount();
    }
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
