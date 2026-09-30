/**
 * Slack connection-level Automatic Mode + Board select (shared-board UI).
 *
 * Live component tests against the real integrations page with service
 * modules mocked to an in-memory "database" (updateChannelMapping mutates
 * the mapping fixtures, listChannelMappings re-reads them) — proving the UI
 * reflects returned DB state rather than stale client state.
 *
 * Covers:
 *  1. Fan-out confirmation dialog (appears / cancel untouched / confirm updates all)
 *  3. Per-mapping list re-renders from re-fetched state after fan-out
 *  2. Add Channel pre-fill from connection default + per-channel override
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { Children } from 'react';

// ── hoisted spies ─────────────────────────────────────────────────────
const h = vi.hoisted(() => ({
  toast: vi.fn(),
}));

// ── module mocks (hoisted before page import) ─────────────────────────
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: h.toast }) }));
vi.mock('@/config/plans', () => ({ resolvePlan: () => 'pro' }));
vi.mock('@/lib/api', () => ({ isPlanUpgradeRequired: () => false }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@/context/OrganizationContext', () => ({
  useOrganization: () => ({ organization: { id: 'org-1' }, loading: false }),
}));
vi.mock('@/components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/components/PaidFeatureGate', () => ({
  PaidFeatureGate: ({ children }: any) => <>{children}</>,
}));

// Radix primitives → native equivalents (jsdom-friendly, same props contract)
vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, disabled, onCheckedChange, ...rest }: any) => (
    <input
      type="checkbox"
      role="switch"
      checked={!!checked}
      disabled={disabled}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...rest}
    />
  ),
}));
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, disabled, children, ...rest }: any) => (
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onValueChange?.(e.target.value)}
      {...rest}
    >
      <option value="" disabled hidden />
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

// Settings content lives behind the card's "Manage" Popover — plain open/close stand-in
vi.mock('@/components/ui/popover', async () => {
  const react = await import('react');
  const Ctx = react.createContext<{ open: boolean; toggle: () => void }>({ open: false, toggle: () => {} });
  return {
    Popover: ({ children }: any) => {
      const [open, setOpen] = react.useState(false);
      return <Ctx.Provider value={{ open, toggle: () => setOpen(o => !o) }}>{children}</Ctx.Provider>;
    },
    PopoverTrigger: ({ children }: any) => {
      const { toggle } = react.useContext(Ctx);
      const child = react.Children.only(children);
      const original = child.props.onClick;
      return react.cloneElement(child, {
        onClick: (e: any) => {
          original?.(e);
          toggle();
        },
      });
    },
    PopoverContent: ({ children }: any) => {
      const { open } = react.useContext(Ctx);
      return open ? <div role="dialog">{children}</div> : null;
    },
    PopoverAnchor: ({ children }: any) => <>{children}</>,
  };
});

// AlertDialog → plain markup; Cancel/Action trigger the onOpenChange contract
vi.mock('@/components/ui/alert-dialog', async () => {
  const react = await import('react');
  const Ctx = react.createContext<(open: boolean) => void>(() => {});
  return {
    AlertDialog: ({ open, onOpenChange, children }: any) =>
      open ? (
        <Ctx.Provider value={onOpenChange}>
          <div role="alertdialog">{children}</div>
        </Ctx.Provider>
      ) : null,
    AlertDialogContent: ({ children }: any) => <div>{children}</div>,
    AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
    AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
    AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
    AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
    AlertDialogCancel: ({ children }: any) => {
      const onOpenChange = react.useContext(Ctx);
      return (
        <button onClick={() => onOpenChange(false)}>{children}</button>
      );
    },
    AlertDialogAction: ({ children, onClick }: any) => {
      const onOpenChange = react.useContext(Ctx);
      return (
        <button
          onClick={() => {
            onClick?.();
            onOpenChange(false);
          }}
        >
          {children}
        </button>
      );
    },
  };
});

// ── service mocks ─────────────────────────────────────────────────────
vi.mock('@/services/intercomService', () => ({
  intercomService: { getStatus: vi.fn() },
}));
vi.mock('@/services/discordService', () => ({
  discordService: { getStatus: vi.fn() },
}));
vi.mock('@/services/githubService', () => ({
  githubService: { getStatus: vi.fn() },
}));
vi.mock('@/services/slackService', () => ({
  slackService: { getStatus: vi.fn(), listChannels: vi.fn(), startConnect: vi.fn(), disconnect: vi.fn() },
}));
vi.mock('@/services/boardService', () => ({
  boardService: { getAllBoards: vi.fn() },
}));
vi.mock('@/services/autopilotService', () => ({
  autopilotService: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    listChannelMappings: vi.fn(),
    createChannelMapping: vi.fn(),
    updateChannelMapping: vi.fn(),
    deleteChannelMapping: vi.fn(),
  },
}));

import { autopilotService } from '@/services/autopilotService';
import { slackService } from '@/services/slackService';
import { boardService } from '@/services/boardService';
import { intercomService } from '@/services/intercomService';
import { discordService } from '@/services/discordService';
import { githubService } from '@/services/githubService';
import IntegrationsSettingsPage from '../page';

// ── in-memory "DB" ────────────────────────────────────────────────────
const BOARDS = [
  { id: 'board-a', name: 'Bugs' },
  { id: 'board-b', name: 'Features' },
  { id: 'board-c', name: 'Roadmap' },
];

const CHANNELS = [
  { id: 'C1', name: 'general' },
  { id: 'C2', name: 'support' },
  { id: 'C3', name: 'feedback' },
  { id: 'C4', name: 'random' },
];

let connection: { autopilot_mode: 'manual' | 'automatic'; default_board_id: string | null };
let mappings: any[];

function makeMapping(n: number, board_id: string, mode: 'manual' | 'automatic') {
  return {
    id: `map-${n}`,
    integration_connection_id: 'conn-1',
    channel_id: `C${n}`,
    channel_name: CHANNELS[n - 1].name,
    board_id,
    autopilot_mode: mode,
    last_message_id: null,
    status: 'active',
    created_at: '2026-09-26T00:00:00Z',
    updated_at: '2026-09-26T00:00:00Z',
  };
}

const a = autopilotService as unknown as Record<string, ReturnType<typeof vi.fn>>;

function setupDb(opts?: {
  connMode?: 'manual' | 'automatic';
  connBoard?: string | null;
  initialMappings?: any[];
}) {
  connection = {
    autopilot_mode: opts?.connMode ?? 'manual',
    default_board_id: opts?.connBoard === undefined ? 'board-a' : opts.connBoard,
  };
  mappings =
    opts?.initialMappings ??
    [
      makeMapping(1, 'board-a', 'manual'),
      makeMapping(2, 'board-b', 'automatic'),
      makeMapping(3, 'board-a', 'automatic'),
    ];

  a.getSettings.mockImplementation((_org: string, provider: string) =>
    Promise.resolve({
      success: true,
      data: {
        settings:
          provider === 'slack'
            ? { ...connection }
            : { autopilot_mode: 'manual', default_board_id: null },
      },
    })
  );

  a.updateSettings.mockImplementation((_org: string, provider: string, patch: any) => {
    if (provider === 'slack') Object.assign(connection, patch); // DB write
    return Promise.resolve({ success: true, data: { settings: { ...connection } } });
  });

  a.listChannelMappings.mockImplementation((_org: string, provider: string) =>
    Promise.resolve({
      success: true,
      data: { mappings: provider === 'slack' ? mappings.map(m => ({ ...m })) : [] },
    })
  );

  a.updateChannelMapping.mockImplementation(
    (_org: string, _provider: string, mappingId: string, patch: any) => {
      const row = mappings.find(m => m.id === mappingId);
      if (row) Object.assign(row, patch); // DB write
      return Promise.resolve({ success: true, data: { mapping: row } });
    }
  );

  a.createChannelMapping.mockImplementation((_org: string, _provider: string, body: any) => {
    mappings.push({ ...makeMapping(mappings.length + 1, body.board_id, body.autopilot_mode ?? 'manual'), ...body });
    return Promise.resolve({ success: true, data: { mapping: mappings[mappings.length - 1] } });
  });

  vi.mocked(slackService.getStatus as any).mockResolvedValue({
    success: true,
    data: {
      status: 'active',
      provider: 'slack',
      provider_workspace_id: 'T1',
      provider_channel_id: null,
      connected_at: '2026-09-26T00:00:00Z',
      updated_at: '2026-09-26T00:00:00Z',
    },
  } as any);
  vi.mocked(slackService.listChannels as any).mockResolvedValue({
    success: true,
    data: { channels: CHANNELS },
  } as any);
  vi.mocked(boardService.getAllBoards as any).mockResolvedValue({
    success: true,
    data: { boards: BOARDS },
  } as any);

  const inactive = { success: true, data: { status: 'disconnected', provider_workspace_id: null } };
  vi.mocked(intercomService.getStatus as any).mockResolvedValue(inactive as any);
  vi.mocked(discordService.getStatus as any).mockResolvedValue(inactive as any);
  vi.mocked(githubService.getStatus as any).mockResolvedValue(inactive as any);
}

async function renderPage() {
  render(<IntegrationsSettingsPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Manage Slack settings' }));
  await screen.findByText('Automatic Mode');
  await waitFor(() => expect(a.listChannelMappings).toHaveBeenCalled());
}

function connectionSwitch() {
  return screen.getAllByRole('switch')[0] as HTMLInputElement; // connection switch renders before mapping rows
}

function boardSelects() {
  return screen.getAllByRole('combobox') as HTMLSelectElement[]; // [0]=connection default, [1]=add channel, [2]=add board
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  setupDb();
});

// ── 1 + 3: fan-out confirmation, confirm/cancel, list reflects DB ─────
describe('connection-level Automatic Mode + Board fan-out', () => {
  it('shows the confirmation dialog, cancel leaves all mappings untouched', async () => {
    await renderPage();
    expect(connectionSwitch().checked).toBe(false); // manual

    // Enable Automatic Mode → fan-out dialog must appear (3 mappings exist)
    fireEvent.click(connectionSwitch());
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/This will update 3 existing channel\(s\) to use this board and mode\. Continue\?/)).toBeTruthy();

    // Cancel → nothing written anywhere
    fireEvent.click(within(dialog).getByText('Cancel'));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(a.updateChannelMapping).not.toHaveBeenCalled();
    expect(a.updateSettings).not.toHaveBeenCalled();
    expect(connectionSwitch().checked).toBe(false); // mode state untouched
    expect(connection.autopilot_mode).toBe('manual'); // "DB" untouched
    expect(mappings.map(m => `${m.board_id}:${m.autopilot_mode}`)).toEqual([
      'board-a:manual',
      'board-b:automatic',
      'board-a:automatic',
    ]);
  });

  it('confirm updates all 3 mappings + persists the connection default, list re-renders from re-fetched state', async () => {
    await renderPage();

    fireEvent.click(connectionSwitch());
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(within(dialog).getByText('Update channels'));

    // All 3 mappings PATCHed with {board, mode} via the existing endpoint
    await waitFor(() => expect(a.updateChannelMapping).toHaveBeenCalledTimes(3));
    const ids = a.updateChannelMapping.mock.calls.map(c => c[2]).sort();
    expect(ids).toEqual(['map-1', 'map-2', 'map-3']);
    for (const call of a.updateChannelMapping.mock.calls) {
      expect(call[1]).toBe('slack');
      expect(call[3]).toEqual({ board_id: 'board-a', autopilot_mode: 'automatic' });
    }

    // Connection-level default persisted (future mappings pre-fill from this)
    await waitFor(() => expect(a.updateSettings).toHaveBeenCalledTimes(1));
    expect(a.updateSettings.mock.calls[0]).toEqual([
      'org-1',
      'slack',
      { autopilot_mode: 'automatic', default_board_id: 'board-a' },
    ]);
    expect(connection).toEqual({ autopilot_mode: 'automatic', default_board_id: 'board-a' });

    // Toast confirms how many channels were updated
    await waitFor(() =>
      expect(h.toast.mock.calls.some(c => c[0]?.title === '3 channel(s) updated')).toBe(true)
    );

    // Connection switch now reflects persisted mode
    await waitFor(() => expect(connectionSwitch().checked).toBe(true));

    // Test 3: list rows re-render from re-fetched mapping state (all → Bugs, all automatic)
    await waitFor(() => {
      const switches = screen.getAllByRole('switch') as HTMLInputElement[];
      expect(switches).toHaveLength(4); // 1 connection + 3 mapping rows
      expect(switches.every(s => s.checked)).toBe(true);
      expect(screen.getAllByText('→ Bugs')).toHaveLength(3);
    });
  });

  it('board Select fan-out overwrites divergent rows and the UI shows the real returned state', async () => {
    await renderPage();
    // rows before: 1× Bugs/manual, 1× Features/automatic, 1× Bugs/automatic
    expect(screen.getAllByText('→ Bugs')).toHaveLength(2);
    expect(screen.getAllByText('→ Features')).toHaveLength(1);

    // Change the connection-level board (mode currently manual) → dialog → confirm
    fireEvent.change(boardSelects()[0], { target: { value: 'board-c' } });
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(within(dialog).getByText('Update channels'));

    await waitFor(() => expect(a.updateChannelMapping).toHaveBeenCalledTimes(3));
    for (const call of a.updateChannelMapping.mock.calls) {
      expect(call[3]).toEqual({ board_id: 'board-c', autopilot_mode: 'manual' });
    }
    expect(a.updateSettings.mock.calls[0][2]).toEqual({
      autopilot_mode: 'manual',
      default_board_id: 'board-c',
    });

    // UI reflects the re-fetched rows (Roadmap everywhere, no stale client state)
    await waitFor(() => {
      expect(screen.getAllByText('→ Roadmap')).toHaveLength(3);
      expect(screen.queryByText('→ Bugs')).toBeNull();
      expect(screen.queryByText('→ Features')).toBeNull();
    });
    expect(connection.default_board_id).toBe('board-c');
  });
});

// ── 2: Add Channel pre-fill + override ────────────────────────────────
describe('Add Channel form pre-fill', () => {
  it('pre-fills board AND mode from the connection default; override still works', async () => {
    setupDb({ connMode: 'automatic', connBoard: 'board-b', initialMappings: [] });
    await renderPage();

    const [, channelSel, boardSel] = boardSelects();
    // Board pre-filled with the connection default — no user interaction yet
    expect(boardSel.value).toBe('board-b');

    // Create with only the channel chosen → default board + mode inherited
    fireEvent.change(channelSel, { target: { value: 'C4' } });
    const addBtn = screen.getByRole('button', { name: 'Add' }) as HTMLButtonElement;
    expect(addBtn.disabled).toBe(false); // enabled without touching the board select
    fireEvent.click(addBtn);

    await waitFor(() => expect(a.createChannelMapping).toHaveBeenCalledTimes(1));
    expect(a.createChannelMapping.mock.calls[0]).toEqual([
      'org-1',
      'slack',
      {
        channel_id: 'C4',
        channel_name: 'random',
        board_id: 'board-b',
        autopilot_mode: 'automatic',
      },
    ]);

    // Override still available: pick a different board for this one channel
    cleanup();
    vi.clearAllMocks();
    setupDb({ connMode: 'automatic', connBoard: 'board-b', initialMappings: [] });
    await renderPage();

    const [, channelSel2, boardSel2] = boardSelects();
    expect(boardSel2.value).toBe('board-b');
    fireEvent.change(channelSel2, { target: { value: 'C4' } });
    fireEvent.change(boardSel2, { target: { value: 'board-c' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(a.createChannelMapping).toHaveBeenCalledTimes(1));
    expect(a.createChannelMapping.mock.calls[0][2]).toMatchObject({
      channel_id: 'C4',
      board_id: 'board-c', // per-channel override wins over the default
      autopilot_mode: 'automatic',
    });
  });

  it('without a connection default the board select is empty (old behavior)', async () => {
    setupDb({ connMode: 'manual', connBoard: null, initialMappings: [] });
    await renderPage();
    expect(boardSelects()[2].value).toBe('');
    // Automatic Mode switch disabled until a board is chosen (Intercom pattern)
    expect(connectionSwitch().disabled).toBe(true);
  });
});
