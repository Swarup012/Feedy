import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
  toast: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}));

vi.mock('@/context/OrganizationContext', () => {
  const organization = { id: 'org-1', name: 'Acme', subdomain: 'acme' };
  return {
    useOrganization: () => ({
      organization,
      organizations: [organization],
      organizationRole: 'owner',
      loading: false,
      orgsFetchStatus: 'success',
      refreshOrganization: vi.fn(),
    }),
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true, loading: false }),
}));

vi.mock('@/hooks/useScrollToHash', () => ({
  useScrollToHash: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: mocks.get,
    put: mocks.put,
    post: mocks.post,
    delete: mocks.delete,
  },
}));

vi.mock('@/services/paddleService', () => ({
  default: {
    getSubscription: vi.fn().mockResolvedValue({ success: false }),
    getInvoices: vi.fn().mockResolvedValue({ success: false }),
  },
}));

vi.mock('@/components/organization/InviteMemberModal', () => ({
  InviteMemberModal: () => null,
}));

vi.mock('@/components/organization/PendingInvitations', () => ({
  PendingInvitations: () => null,
}));

import OrganizationSettingsPage from './page';

const MEMBER = {
  id: 'member-1',
  name: 'Test Member',
  email: 'member@example.com',
  organization_role: 'member',
  created_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  mocks.get.mockReset().mockResolvedValue({
    data: { data: { members: [MEMBER] } },
  });
  mocks.put.mockReset().mockResolvedValue({ status: 200, data: { success: true } });
  mocks.post.mockReset();
  mocks.delete.mockReset();
  mocks.toast.mockReset();
  mocks.push.mockReset();
  window.history.replaceState({}, '', '/admin/organization?tab=members');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('organization member role update', () => {
  it('updates the role through the cookie-based api client', async () => {
    render(<OrganizationSettingsPage />);

    await screen.findByText('Test Member');

    const select = screen.getByDisplayValue('Member');
    fireEvent.change(select, { target: { value: 'admin' } });

    await waitFor(() =>
      expect(mocks.put).toHaveBeenCalledWith(
        '/api/organizations/org-1/members/member-1',
        { role: 'admin' }
      )
    );
  });
});
