import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import IntegrationsSettingsPage from '../page';
import { zapierConnection } from '@/services/zapierConnection';

const fixture = vi.hoisted(() => ({
  toast: { toast: vi.fn() },
  disconnected: { data: { status: 'disconnected' } },
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => fixture.toast }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@/context/OrganizationContext', () => ({
  useOrganization: () => ({
    organization: { id: 'org-1', subscription_plan: 'free' },
    loading: false,
  }),
}));
vi.mock('@/components/ProtectedRoute', () => ({ ProtectedRoute: ({ children }: React.PropsWithChildren) => children }));
vi.mock('@/components/PaidFeatureGate', () => ({ PaidFeatureGate: ({ children }: React.PropsWithChildren) => children }));
vi.mock('@/lib/api', () => ({ isPlanUpgradeRequired: () => false }));
vi.mock('@/services/intercomService', () => ({ intercomService: { getStatus: async () => fixture.disconnected } }));
vi.mock('@/services/slackService', () => ({ slackService: { getStatus: async () => fixture.disconnected } }));
vi.mock('@/services/discordService', () => ({ discordService: { getStatus: async () => fixture.disconnected } }));
vi.mock('@/services/githubService', () => ({ githubService: { getStatus: async () => fixture.disconnected } }));
vi.mock('@/services/boardService', () => ({ boardService: { getAllBoards: async () => ({ data: { boards: [] } }) } }));
vi.mock('@/services/autopilotService', () => ({ autopilotService: { getSettings: async () => ({ data: {} }) } }));
vi.mock('@/services/zapierConnection', () => ({ zapierConnection: { getActiveCount: vi.fn(), disconnect: vi.fn() } }));

afterEach(cleanup);

it('shows the active count and restores Connect after a Free admin disconnects', async () => {
  let active = 3;
  vi.mocked(zapierConnection.getActiveCount).mockImplementation(async () => active);
  vi.mocked(zapierConnection.disconnect).mockImplementation(async () => { active = 0; });

  render(<IntegrationsSettingsPage />);
  expect(await screen.findByText('3 active connections')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Manage Zapier settings' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Disconnect Zapier' }));
  const confirm = await screen.findByRole('alertdialog', { name: 'Disconnect Zapier?' });
  fireEvent.click(within(confirm).getByRole('button', { name: 'Disconnect Zapier' }));

  expect(await screen.findByRole('heading', { name: 'Zapier' })).toBeTruthy();
  expect(screen.queryByText('3 active connections')).toBeNull();
  expect(zapierConnection.disconnect).toHaveBeenCalledExactlyOnceWith('org-1');
});
