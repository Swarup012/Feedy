import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mocks (module-level, before importing the component) ────────────

const ctx = vi.hoisted(() => ({
  organization: null as any,
  organizations: [] as any[],
  switchOrganization: vi.fn(async () => {}),
}));

vi.mock('@/context/OrganizationContext', () => ({
  useOrganization: () => ({
    organization: ctx.organization,
    organizations: ctx.organizations,
    switchOrganization: ctx.switchOrganization,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { OrganizationSwitcher } from '@/components/organization/OrganizationSwitcher';

function setOrgs(role: 'owner' | 'admin' | 'member') {
  ctx.organization = { id: 'org-1', name: 'TEST Org One' };
  ctx.organizations = [
    { id: 'org-1', name: 'TEST Org One', role },
    { id: 'org-2', name: 'TEST Org Two', role: 'member' },
  ];
}

beforeEach(() => {
  ctx.organization = null;
  ctx.organizations = [];
  ctx.switchOrganization.mockClear();
});

function openMenu() {
  render(<OrganizationSwitcher />);
  const trigger = screen.getByRole('button');
  // Radix opens the menu on pointerdown, not click
  fireEvent.pointerDown(trigger, { button: 0 });
  fireEvent.click(trigger);
}

// ── Create New Organization is gone for every role ──────────────────

describe('OrganizationSwitcher — create action removed', () => {
  it.each(['owner', 'admin', 'member'] as const)(
    '%s: menu has no Create New Organization item',
    (role) => {
      setOrgs(role);
      openMenu();

      expect(screen.getByText('Switch Organization')).toBeTruthy();
      expect(screen.queryByText('Create New Organization')).toBeNull();
      expect(screen.queryByText(/organizations$/)).toBeNull();
      // No limit counter like "0/1 organizations"
      expect(screen.queryByText(/\/1 organizations/)).toBeNull();
    },
  );

  it('still lists every organization and switches on click', async () => {
    setOrgs('owner');
    openMenu();

    const menu = within(screen.getByRole('menu'));
    // "TEST Org One" also appears in the trigger button, so scope to the menu
    expect(menu.getByText('TEST Org One')).toBeTruthy();
    expect(menu.getByText('TEST Org Two')).toBeTruthy();

    fireEvent.click(menu.getByText('TEST Org Two'));
    expect(ctx.switchOrganization).toHaveBeenCalledWith('org-2');
  });

  it('renders nothing without an organization', () => {
    ctx.organization = null;
    ctx.organizations = [];
    const { container } = render(<OrganizationSwitcher />);
    expect(container.firstChild).toBeNull();
  });
});
