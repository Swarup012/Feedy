import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mocks (module-level, before importing the component) ────────────

const ctx = vi.hoisted(() => ({
  organization: null as any,
  role: 'owner' as string | null,
  refreshOrganization: vi.fn(async () => {}),
  apiPut: vi.fn(async () => ({ data: {} })),
}));

const apiPut = ctx.apiPut;

vi.mock('@/context/OrganizationContext', () => ({
  useOrganization: () => ({
    organization: ctx.organization,
    organizationRole: ctx.role,
    refreshOrganization: ctx.refreshOrganization,
  }),
}));

vi.mock('@/lib/api', () => ({
  default: { put: ctx.apiPut },
  isPlanUpgradeRequired: (error: any) =>
    error?.response?.status === 403 &&
    error?.response?.data?.code === 'PLAN_UPGRADE_REQUIRED',
}));

vi.mock('@/services/uploadService', () => ({
  uploadService: {
    uploadImage: vi.fn(async () => 'https://x.supabase.co/storage/v1/object/public/user-uploads/org-1/branding/a.png'),
    deleteImage: vi.fn(async () => {}),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Heavy: pulls paddleService + supabase. The Upgrade button in this
// component is ours (opens the dialog) — the dialog itself is not under test.
vi.mock('@/components/UpgradeDialog', () => ({
  UpgradeDialog: () => null,
}));

import { BrandingSection } from '@/components/organization/BrandingSection';

function setOrg({
  plan = 'starter',
  status = 'active' as string | null,
  role = 'owner',
  logo_url = null as string | null,
  primaryColor = null as string | null,
} = {}) {
  ctx.role = role;
  ctx.organization = {
    id: 'org-1',
    name: 'Acme',
    subscription_plan: plan,
    subscription_status: status,
    logo_url,
    settings: primaryColor ? { branding: { primaryColor } } : {},
  };
}

const FREE_HINT = 'Custom branding is available on Starter and Pro.';
const OWNER_NOTE = 'Only the organization owner can change branding.';

beforeEach(() => {
  apiPut.mockClear();
  ctx.refreshOrganization.mockClear();
});

// ── Owner on Starter ────────────────────────────────────────────────

describe('owner on Starter', () => {
  it('saves the default color as a branding clear ({}), logo null', async () => {
    setOrg({ plan: 'starter', status: 'active', role: 'owner' });
    render(<BrandingSection />);

    fireEvent.click(screen.getByRole('button', { name: /Save Branding/ }));

    await waitFor(() => expect(apiPut).toHaveBeenCalledTimes(1));
    expect(apiPut).toHaveBeenCalledWith('/api/organizations/org-1', {
      logo_url: null,
      settings: { branding: {} },
    });
    await waitFor(() => expect(ctx.refreshOrganization).toHaveBeenCalled());
  });

  it('saves a changed hex color (lowercased)', async () => {
    setOrg();
    render(<BrandingSection />);

    fireEvent.change(screen.getByLabelText('Brand color'), {
      target: { value: '#FF0000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save Branding/ }));

    await waitFor(() => expect(apiPut).toHaveBeenCalledTimes(1));
    expect(apiPut).toHaveBeenCalledWith('/api/organizations/org-1', {
      logo_url: null,
      settings: { branding: { primaryColor: '#ff0000' } },
    });
  });

  it('removing the logo sends logo_url: null', async () => {
    setOrg({ logo_url: 'https://x.supabase.co/storage/v1/object/public/user-uploads/org-1/branding/old.png' });
    render(<BrandingSection />);

    fireEvent.click(screen.getByLabelText('Remove logo'));
    fireEvent.click(screen.getByRole('button', { name: /Save Branding/ }));

    await waitFor(() => expect(apiPut).toHaveBeenCalledTimes(1));
    expect(apiPut).toHaveBeenCalledWith('/api/organizations/org-1', {
      logo_url: null,
      settings: { branding: {} },
    });
  });

  it('restores stored color and logo from the organization', () => {
    setOrg({ logo_url: 'https://x.supabase.co/storage/v1/object/public/user-uploads/org-1/branding/old.png', primaryColor: '#123456' });
    render(<BrandingSection />);

    expect(screen.getByLabelText('Brand color')).toHaveProperty('value', '#123456');
    expect(screen.getByAltText('Organization logo')).toBeTruthy();
  });
});

// ── Free plan gate ──────────────────────────────────────────────────

describe('owner on Free plan', () => {
  it('shows disabled controls + upgrade hint, no Save', () => {
    setOrg({ plan: 'free', status: null, role: 'owner' });
    render(<BrandingSection />);

    expect(screen.getByText(FREE_HINT)).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Upgrade$/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Save Branding/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Upload logo/ })).toBeNull();
    expect(screen.getByLabelText('Brand color')).toHaveProperty('disabled', true);
    expect(screen.getByLabelText('Brand color picker')).toHaveProperty('disabled', true);
  });
});

// ── Non-owner read-only ─────────────────────────────────────────────

describe('non-owner roles', () => {
  it('admin sees read-only section: note, disabled inputs, no Save, no Upgrade', () => {
    setOrg({ plan: 'starter', status: 'active', role: 'admin' });
    render(<BrandingSection />);

    expect(screen.getByText(OWNER_NOTE)).toBeTruthy();
    expect(screen.getByLabelText('Brand color')).toHaveProperty('disabled', true);
    expect(screen.queryByRole('button', { name: /Save Branding/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Upload logo/ })).toBeNull();
    expect(screen.queryByText(FREE_HINT)).toBeNull();
    expect(screen.queryByRole('button', { name: /^Upgrade$/ })).toBeNull();
  });

  it('member sees read-only section too', () => {
    setOrg({ plan: 'starter', status: 'active', role: 'member' });
    render(<BrandingSection />);

    expect(screen.getByText(OWNER_NOTE)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Save Branding/ })).toBeNull();
  });
});

// ── Invalid hex blocked ─────────────────────────────────────────────

describe('hex validation', () => {
  it('invalid hex disables Save and shows the error', () => {
    setOrg();
    render(<BrandingSection />);

    const input = screen.getByLabelText('Brand color');
    fireEvent.change(input, { target: { value: 'red' } });

    expect(screen.getByText('Enter a hex color like #3b82f6.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Save Branding/ })).toHaveProperty('disabled', true);
  });

  it.each(['#fff', '#12345', 'ff0000', '#gggggg'])(
    'short/invalid hex %s blocks Save',
    (value) => {
      setOrg();
      render(<BrandingSection />);

      fireEvent.change(screen.getByLabelText('Brand color'), {
        target: { value },
      });
      expect(screen.getByRole('button', { name: /Save Branding/ })).toHaveProperty('disabled', true);
    },
  );

  it('valid hex re-enables Save', () => {
    setOrg();
    render(<BrandingSection />);

    fireEvent.change(screen.getByLabelText('Brand color'), {
      target: { value: 'nope' },
    });
    fireEvent.change(screen.getByLabelText('Brand color'), {
      target: { value: '#ABCDEF' },
    });
    expect(screen.getByRole('button', { name: /Save Branding/ })).toHaveProperty('disabled', false);
  });
});
