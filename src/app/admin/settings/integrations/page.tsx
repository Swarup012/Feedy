'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useOrganization } from '@/context/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import {
  intercomService,
  type IntercomStatus,
} from '@/services/intercomService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plug,
  Unplug,
  ExternalLink,
  Bot,
  Settings2,
} from 'lucide-react';
import { autopilotService, type AutopilotSettings } from '@/services/autopilotService';
import { boardService, type Board } from '@/services/boardService';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function formatDate(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: IntercomStatus['status'] }) {
  if (!status) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Not connected
      </Badge>
    );
  }

  if (status === 'active') {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0">
        Connected
      </Badge>
    );
  }

  if (status === 'error') {
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-0">
        Error — reconnect required
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      Disconnected
    </Badge>
  );
}

function IntegrationsPageInner() {
  const { organization, loading: orgLoading } = useOrganization();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const orgId = organization?.id;

  const [status, setStatus] = useState<IntercomStatus | null>(null);
  const [autopilotSettings, setAutopilotSettings] = useState<AutopilotSettings | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [savingAutopilot, setSavingAutopilot] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await intercomService.getStatus(orgId);
      setStatus(res.data);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to load status';
      toast({
        title: 'Failed to load Intercom status',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [orgId, toast]);

  // Fetch Autopilot Settings
  useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        const res = await autopilotService.getSettings(orgId, 'intercom');
        const s = res.data?.settings || null;
        setAutopilotSettings(s);
        // Seed the local board picker with whatever is already persisted
        if (s?.default_board_id) setSelectedBoardId(s.default_board_id);
      } catch {
        // non-fatal — columns may not exist yet if migration is pending
      }
    })();
  }, [orgId]);

  // Fetch Boards
  useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        const res = await boardService.getAllBoards();
        setBoards(res.data?.boards || []);
      } catch (err) {
        console.error("Failed to load boards:", err);
      }
    })();
  }, [orgId]);

  const handleAutopilotModeToggle = async (enable: boolean) => {
    if (!orgId) return;

    if (enable && !selectedBoardId) {
      toast({
        title: 'Select a board first',
        description: 'Choose a default board before enabling Automatic Mode.',
        variant: 'destructive',
      });
      return;
    }

    // Always send both fields together — the backend needs autopilot_mode, and
    // default_board_id must be in the same request when switching to 'automatic'
    // because a prior board-selection PATCH may not have been made yet.
    const payload: Partial<AutopilotSettings> = {
      autopilot_mode: enable ? 'automatic' : 'manual',
      ...(selectedBoardId ? { default_board_id: selectedBoardId } : {}),
    };

    setSavingAutopilot(true);
    try {
      const res = await autopilotService.updateSettings(orgId, 'intercom', payload);
      setAutopilotSettings(res.data.settings);
      toast({
        title: enable ? 'Automatic Mode enabled' : 'Switched to Manual Mode',
        description: enable
          ? 'Feedback will now be published directly without review.'
          : 'Suggestions will queue for manual review.',
      });
    } catch (err: unknown) {
      toast({
        title: 'Update failed',
        description: (err as any)?.response?.data?.message || 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setSavingAutopilot(false);
    }
  };

  const handleBoardChange = async (boardId: string) => {
    // Update local state immediately so the toggle unlocks right away.
    setSelectedBoardId(boardId);

    // If already in automatic mode, persist the new board immediately too.
    if (autopilotSettings?.autopilot_mode === 'automatic' && orgId) {
      setSavingAutopilot(true);
      try {
        const res = await autopilotService.updateSettings(orgId, 'intercom', {
          autopilot_mode: 'automatic',
          default_board_id: boardId,
        });
        setAutopilotSettings(res.data.settings);
        toast({ title: 'Default board updated' });
      } catch (err: unknown) {
        toast({
          title: 'Update failed',
          description: (err as any)?.response?.data?.message || 'Failed to update board',
          variant: 'destructive',
        });
      } finally {
        setSavingAutopilot(false);
      }
    }
  };

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Handle OAuth callback query params
  useEffect(() => {
    const result = searchParams.get('intercom');
    if (!result) return;

    if (result === 'connected') {
      toast({
        title: 'Intercom connected',
        description: 'New closed conversations will feed into Autopilot.',
      });
    } else if (result === 'error') {
      toast({
        title: 'Intercom connection failed',
        description: searchParams.get('message') || 'Please try again.',
        variant: 'destructive',
      });
    }

    // Clean query string without full reload
    const url = new URL(window.location.href);
    url.searchParams.delete('intercom');
    url.searchParams.delete('message');
    window.history.replaceState({}, '', url.pathname);
  }, [searchParams, toast]);

  const handleConnect = () => {
    if (!orgId) return;
    intercomService.startConnect(orgId);
  };

  const handleDisconnect = async () => {
    if (!orgId) return;
    setDisconnecting(true);
    try {
      await intercomService.disconnect(orgId);
      toast({
        title: 'Intercom disconnected',
        description: 'Closed conversations will no longer be ingested.',
      });
      await loadStatus();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as Error)?.message ||
        'Disconnect failed';
      toast({
        title: 'Disconnect failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(false);
    }
  };

  if (orgLoading || !orgId) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isActive = status?.status === 'active';
  const needsReconnect = status?.status === 'error';

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <Link
          href="/admin/organization"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Organization settings
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground text-sm">
          Connect support tools so closed conversations can feed Autopilot.
          Phase 1 covers Intercom only — no historical backfill.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F8DED]/10 text-[#1F8DED]">
              <Plug className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-medium text-lg">Intercom</h2>
                {!loading && <StatusBadge status={status?.status ?? null} />}
              </div>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                When a conversation is closed in Intercom, we fetch the full
                thread and run it through Autopilot for feedback suggestions.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading connection status…
          </div>
        ) : (
          <div className="space-y-4">
            {needsReconnect && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 px-3 py-2.5 text-sm text-red-800 dark:text-red-200">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Intercom rejected an API call (auth error). There is no refresh
                  token — reconnect to restore the integration.
                </span>
              </div>
            )}

            {isActive && (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 px-3 py-2.5 text-sm text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p>Connected and listening for closed conversations.</p>
                  {status?.provider_workspace_id && (
                    <p className="text-xs opacity-80 mt-0.5 font-mono">
                      Workspace: {status.provider_workspace_id}
                    </p>
                  )}
                  {status?.connected_at && (
                    <p className="text-xs opacity-80 mt-0.5">
                      Since {formatDate(status.connected_at)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {isActive ? (
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Unplug className="h-4 w-4 mr-2" />
                  )}
                  Disconnect
                </Button>
              ) : (
                <Button onClick={handleConnect}>
                  <Plug className="h-4 w-4 mr-2" />
                  {needsReconnect || status?.status === 'disconnected'
                    ? 'Reconnect Intercom'
                    : 'Connect Intercom'}
                </Button>
              )}

              <a
                href="https://app.intercom.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                Open Intercom
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <p className="text-xs text-muted-foreground border-t pt-4">
              Subscribe to <code className="font-mono text-[11px]">conversation.admin.closed</code>{' '}
              in your Intercom app Webhooks settings, and point the URL at your
              public webhook endpoint (ngrok while developing). Intercom does not
              expose a separate user-closed topic today.
            </p>
          </div>
        )}
      </div>

      {/* Autopilot Settings */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-medium text-lg">Autopilot Approval Mode</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Configure how feedback suggestions generated by the Autopilot pipeline are handled.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading settings…
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between gap-4 border border-border p-4 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Automatic Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Bypass manual review and immediately publish suggestions.
                </p>
                {!selectedBoardId && (
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 font-medium">
                    Select a default board below to enable.
                  </p>
                )}
              </div>
              <Switch
                checked={autopilotSettings?.autopilot_mode === 'automatic'}
                disabled={savingAutopilot || !selectedBoardId}
                onCheckedChange={(checked) => handleAutopilotModeToggle(checked)}
              />
            </div>

            <div className="space-y-4 p-4 rounded-lg border border-border">
              <div className="space-y-2 max-w-sm">
                <Label>Default Board</Label>
                <Select
                  value={selectedBoardId || undefined}
                  onValueChange={handleBoardChange}
                  disabled={savingAutopilot}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a board..." />
                  </SelectTrigger>
                  <SelectContent>
                    {boards.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Posts generated by Autopilot will be published here.
                </p>
              </div>
            </div>

            {autopilotSettings?.autopilot_mode === 'automatic' && (
              <div className="flex items-start gap-2 text-sm text-indigo-900 dark:text-indigo-200 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  <strong>Warning:</strong> In automatic mode, any incoming feedback (including test submissions) will be published directly to the selected board without human review.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function IntegrationsSettingsPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <IntegrationsPageInner />
      </Suspense>
    </ProtectedRoute>
  );
}
