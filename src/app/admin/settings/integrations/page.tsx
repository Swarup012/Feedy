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
import {
  discordService,
  type DiscordStatus,
  type DiscordChannel,
} from '@/services/discordService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plug,
  Unplug,
  ExternalLink,
  MessageSquare,
  Hash,
  Settings2,
  Zap,
  Globe,
  Mail,
} from 'lucide-react';
import { autopilotService, type AutopilotSettings } from '@/services/autopilotService';
import { boardService, type Board } from '@/services/boardService';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-19.32-72.15ZM42.68,65.33C38.08,65.33,34.2,61,34.2,55.77s3.8-9.56,8.48-9.56,8.53,4.3,8.48,9.56C51.15,61,47.38,65.33,42.68,65.33Zm41.73,0c-4.6,0-8.48-4.3-8.48-9.56s3.8-9.56,8.48-9.56,8.53,4.3,8.48,9.56C92.89,61,89.11,65.33,84.41,65.33Z"/>
  </svg>
);

const IntercomIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm-2.486 16.593a1.536 1.536 0 1 1 0-3.072 1.536 1.536 0 0 1 0 3.072zm0-4.577a1.536 1.536 0 1 1 0-3.072 1.536 1.536 0 0 1 0 3.072zm4.972 4.577a1.536 1.536 0 1 1 0-3.072 1.536 1.536 0 0 1 0 3.072zm0-4.577a1.536 1.536 0 1 1 0-3.072 1.536 1.536 0 0 1 0 3.072z" />
  </svg>
);

const SlackIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521h-6.313A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.835a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.835a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.835zM17.688 8.835a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.313zM15.165 18.958a2.528 2.528 0 0 1 2.523 2.52 2.528 2.528 0 0 1-2.523 2.522 2.528 2.528 0 0 1-2.52-2.522v-2.52h2.52zM15.165 17.687a2.528 2.528 0 0 1-2.523-2.52 2.528 2.528 0 0 1 2.523-2.521h6.313A2.528 2.528 0 0 1 24 15.167a2.528 2.528 0 0 1-2.522 2.52h-6.313z" />
  </svg>
);

function StatusBadge({ status }: { status: string | null }) {
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

  const [intercomStatus, setIntercomStatus] = useState<IntercomStatus | null>(null);
  const [discordStatus, setDiscordStatus] = useState<DiscordStatus | null>(null);
  const [discordChannels, setDiscordChannels] = useState<DiscordChannel[]>([]);
  
  const [intercomAutopilot, setIntercomAutopilot] = useState<AutopilotSettings | null>(null);
  const [discordAutopilot, setDiscordAutopilot] = useState<AutopilotSettings | null>(null);
  
  const [boards, setBoards] = useState<Board[]>([]);
  
  const [intercomBoardId, setIntercomBoardId] = useState<string | null>(null);
  const [discordBoardId, setDiscordBoardId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [disconnectingIntercom, setDisconnectingIntercom] = useState(false);
  const [disconnectingDiscord, setDisconnectingDiscord] = useState(false);
  const [savingIntercomAutopilot, setSavingIntercomAutopilot] = useState(false);
  const [savingDiscordAutopilot, setSavingDiscordAutopilot] = useState(false);
  const [savingDiscordChannel, setSavingDiscordChannel] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [intercomRes, discordRes] = await Promise.all([
        intercomService.getStatus(orgId).catch(() => null),
        discordService.getStatus(orgId).catch(() => null),
      ]);
      
      if (intercomRes) setIntercomStatus(intercomRes.data);
      if (discordRes) setDiscordStatus(discordRes.data);
      
      // Load Discord channels if connected
      if (discordRes?.data?.status === 'active' && discordRes.data.provider_workspace_id) {
        discordService.listChannels(orgId).then(res => {
          setDiscordChannels(res.data.channels);
        }).catch(err => {
          console.error("Failed to load Discord channels:", err);
        });
      }
    } catch (err: unknown) {
      toast({
        title: 'Failed to load integration status',
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
        const [intercomRes, discordRes] = await Promise.all([
          autopilotService.getSettings(orgId, 'intercom').catch(() => null),
          autopilotService.getSettings(orgId, 'discord').catch(() => null),
        ]);
        
        if (intercomRes?.data?.settings) {
          setIntercomAutopilot(intercomRes.data.settings);
          if (intercomRes.data.settings.default_board_id) {
            setIntercomBoardId(intercomRes.data.settings.default_board_id);
          }
        }
        
        if (discordRes?.data?.settings) {
          setDiscordAutopilot(discordRes.data.settings);
          if (discordRes.data.settings.default_board_id) {
            setDiscordBoardId(discordRes.data.settings.default_board_id);
          }
        }
      } catch {
        // non-fatal
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

  const handleAutopilotModeToggle = async (provider: 'intercom' | 'discord', enable: boolean) => {
    if (!orgId) return;
    
    const selectedBoardId = provider === 'intercom' ? intercomBoardId : discordBoardId;

    if (enable && !selectedBoardId) {
      toast({
        title: 'Select a board first',
        description: 'Choose a default board before enabling Automatic Mode.',
        variant: 'destructive',
      });
      return;
    }

    const payload: Partial<AutopilotSettings> = {
      autopilot_mode: enable ? 'automatic' : 'manual',
      ...(selectedBoardId ? { default_board_id: selectedBoardId } : {}),
    };

    const setSaving = provider === 'intercom' ? setSavingIntercomAutopilot : setSavingDiscordAutopilot;
    setSaving(true);
    try {
      const res = await autopilotService.updateSettings(orgId, provider, payload);
      if (provider === 'intercom') {
        setIntercomAutopilot(res.data.settings);
      } else {
        setDiscordAutopilot(res.data.settings);
      }
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
      setSaving(false);
    }
  };

  const handleBoardChange = async (provider: 'intercom' | 'discord', boardId: string) => {
    if (provider === 'intercom') {
      setIntercomBoardId(boardId);
    } else {
      setDiscordBoardId(boardId);
    }

    const autopilotSettings = provider === 'intercom' ? intercomAutopilot : discordAutopilot;

    if (autopilotSettings?.autopilot_mode === 'automatic' && orgId) {
      const setSaving = provider === 'intercom' ? setSavingIntercomAutopilot : setSavingDiscordAutopilot;
      setSaving(true);
      try {
        const res = await autopilotService.updateSettings(orgId, provider, {
          autopilot_mode: 'automatic',
          default_board_id: boardId,
        });
        if (provider === 'intercom') {
          setIntercomAutopilot(res.data.settings);
        } else {
          setDiscordAutopilot(res.data.settings);
        }
        toast({ title: 'Default board updated' });
      } catch (err: unknown) {
        toast({
          title: 'Update failed',
          description: (err as any)?.response?.data?.message || 'Failed to update board',
          variant: 'destructive',
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDiscordChannelChange = async (channelId: string) => {
    if (!orgId) return;
    setSavingDiscordChannel(true);
    try {
      const res = await discordService.setChannel(orgId, channelId);
      if (discordStatus) {
        setDiscordStatus({
          ...discordStatus,
          provider_channel_id: res.data.provider_channel_id,
          updated_at: res.data.updated_at,
        });
      }
      toast({ title: 'Monitored channel updated' });
    } catch (err: unknown) {
      toast({
        title: 'Update failed',
        description: (err as any)?.response?.data?.message || 'Failed to set channel',
        variant: 'destructive',
      });
    } finally {
      setSavingDiscordChannel(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Handle OAuth callback query params
  useEffect(() => {
    const intercomResult = searchParams.get('intercom');
    const discordResult = searchParams.get('discord');
    const message = searchParams.get('message');
    
    if (intercomResult === 'connected') {
      toast({
        title: 'Intercom connected',
        description: 'New closed conversations will feed into Autopilot.',
      });
    } else if (intercomResult === 'error') {
      toast({
        title: 'Intercom connection failed',
        description: message || 'Please try again.',
        variant: 'destructive',
      });
    }

    if (discordResult === 'connected') {
      toast({
        title: 'Discord connected',
        description: 'Select a channel to monitor for feedback.',
      });
      loadStatus(); // Reload to get channels
    } else if (discordResult === 'error') {
      toast({
        title: 'Discord connection failed',
        description: message || 'Please try again.',
        variant: 'destructive',
      });
    }

    if (intercomResult || discordResult) {
      // Clean query string without full reload
      const url = new URL(window.location.href);
      url.searchParams.delete('intercom');
      url.searchParams.delete('discord');
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [searchParams, toast, loadStatus]);

  const handleConnectIntercom = () => {
    if (!orgId) return;
    intercomService.startConnect(orgId);
  };

  const handleConnectDiscord = () => {
    if (!orgId) return;
    discordService.startConnect(orgId);
  };

  const handleDisconnectIntercom = async () => {
    if (!orgId) return;
    setDisconnectingIntercom(true);
    try {
      await intercomService.disconnect(orgId);
      toast({
        title: 'Intercom disconnected',
        description: 'Closed conversations will no longer be ingested.',
      });
      await loadStatus();
    } catch (err: unknown) {
      toast({
        title: 'Disconnect failed',
        description: (err as Error)?.message || 'Disconnect failed',
        variant: 'destructive',
      });
    } finally {
      setDisconnectingIntercom(false);
    }
  };

  const handleDisconnectDiscord = async () => {
    if (!orgId) return;
    setDisconnectingDiscord(true);
    try {
      await discordService.disconnect(orgId);
      toast({
        title: 'Discord disconnected',
        description: 'We will no longer monitor your Discord channel.',
      });
      setDiscordChannels([]);
      await loadStatus();
    } catch (err: unknown) {
      toast({
        title: 'Disconnect failed',
        description: (err as Error)?.message || 'Disconnect failed',
        variant: 'destructive',
      });
    } finally {
      setDisconnectingDiscord(false);
    }
  };

  if (orgLoading || !orgId) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isIntercomActive = intercomStatus?.status === 'active';
  const needsIntercomReconnect = intercomStatus?.status === 'error';
  
  const isDiscordActive = discordStatus?.status === 'active';
  const needsDiscordReconnect = discordStatus?.status === 'error';

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">Connect and manage your favorite tools.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading integrations…
        </div>
      ) : (
        <>
          {/* ── Connected Integrations ── */}
          {(isDiscordActive || isIntercomActive) && (
            <section className="space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Connected Integrations
              </h2>

              {isDiscordActive && (
                <div className="rounded-xl border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 shrink-0 rounded-xl bg-[#5865F2] flex items-center justify-center shadow-sm">
                        <DiscordIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-semibold">Discord</h3>
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0 text-[11px] font-semibold">Connected</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                          Monitor a Discord channel for product feedback. We&apos;ll post new messages through Autopilot.
                        </p>
                      </div>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="shrink-0 gap-2">
                          <Settings2 className="h-3.5 w-3.5" /> Manage
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-80 p-0 overflow-hidden rounded-xl border bg-card shadow-lg">
                        <div className="bg-muted/50 px-4 py-3 border-b">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <DiscordIcon className="h-4 w-4 text-[#5865F2]" /> Discord Settings
                          </h4>
                        </div>
                        <div className="p-4 space-y-5">
                          {discordChannels.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Hash className="h-3.5 w-3.5" /> Monitored Channel
                              </Label>
                              <Select value={discordStatus?.provider_channel_id || undefined} onValueChange={handleDiscordChannelChange} disabled={savingDiscordChannel}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Select channel…" /></SelectTrigger>
                                <SelectContent>
                                  {discordChannels.map(ch => (
                                    <SelectItem key={ch.id} value={ch.id}># {ch.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="space-y-0.5">
                                <Label className="text-sm font-medium flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> Automatic Mode</Label>
                                <p className="text-[11px] text-muted-foreground leading-tight">Bypass review & publish instantly.</p>
                                {!discordBoardId && <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5 font-medium">Select a board below first.</p>}
                              </div>
                              <Switch checked={discordAutopilot?.autopilot_mode === 'automatic'} disabled={savingDiscordAutopilot || !discordBoardId} onCheckedChange={(checked) => handleAutopilotModeToggle('discord', checked)} />
                            </div>
                            
                            <div className="space-y-2 pt-1 border-t">
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-2 block">Default Board</Label>
                              <Select value={discordBoardId || undefined} onValueChange={(val) => handleBoardChange('discord', val)} disabled={savingDiscordAutopilot}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Select a board…" /></SelectTrigger>
                                <SelectContent>
                                  {boards.map(b => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t bg-red-50/50 dark:bg-red-950/20 p-4">
                          <Button variant="destructive" size="sm" className="w-full gap-2" onClick={handleDisconnectDiscord} disabled={disconnectingDiscord}>
                            {disconnectingDiscord ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unplug className="h-3.5 w-3.5" />}
                            Disconnect Discord
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="border-t bg-muted/30 px-5 py-3.5 flex flex-wrap items-center gap-x-10 gap-y-2 text-sm">
                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wide block">Channel</span>
                      <p className="font-medium flex items-center gap-1 mt-0.5">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        {discordChannels.find(c => c.id === discordStatus?.provider_channel_id)?.name || 'Not selected'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wide block">Board</span>
                      <p className="font-medium mt-0.5">{boards.find(b => b.id === discordBoardId)?.name || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wide block">Connected on</span>
                      <p className="font-medium mt-0.5">{discordStatus?.connected_at ? formatDate(discordStatus.connected_at) : '—'}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">Active</span>
                    </div>
                  </div>
                </div>
              )}

              {isIntercomActive && (
                <div className="rounded-xl border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 shrink-0 rounded-xl bg-[#1F8DED] flex items-center justify-center shadow-sm">
                        <IntercomIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-semibold">Intercom</h3>
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0 text-[11px] font-semibold">Connected</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                          Closed conversations feed into Autopilot for feedback suggestions.
                        </p>
                      </div>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="shrink-0 gap-2">
                          <Settings2 className="h-3.5 w-3.5" /> Manage
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-80 p-0 overflow-hidden rounded-xl border bg-card shadow-lg">
                        <div className="bg-muted/50 px-4 py-3 border-b">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <IntercomIcon className="h-4 w-4 text-[#1F8DED]" /> Intercom Settings
                          </h4>
                        </div>
                        <div className="p-4 space-y-5">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="space-y-0.5">
                                <Label className="text-sm font-medium flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> Automatic Mode</Label>
                                <p className="text-[11px] text-muted-foreground leading-tight">Bypass review & publish instantly.</p>
                                {!intercomBoardId && <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5 font-medium">Select a board below first.</p>}
                              </div>
                              <Switch checked={intercomAutopilot?.autopilot_mode === 'automatic'} disabled={savingIntercomAutopilot || !intercomBoardId} onCheckedChange={(checked) => handleAutopilotModeToggle('intercom', checked)} />
                            </div>
                            
                            <div className="space-y-2 pt-1 border-t">
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-2 block">Default Board</Label>
                              <Select value={intercomBoardId || undefined} onValueChange={(val) => handleBoardChange('intercom', val)} disabled={savingIntercomAutopilot}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Select a board…" /></SelectTrigger>
                                <SelectContent>
                                  {boards.map(b => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="rounded-lg bg-muted/50 border border-dashed px-3 py-2.5">
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              Subscribe to <code className="font-mono text-[9px] bg-muted px-1 py-0.5 rounded">conversation.admin.closed</code> in Intercom Webhooks and point to your public webhook endpoint.
                            </p>
                          </div>
                        </div>
                        
                        <div className="border-t bg-red-50/50 dark:bg-red-950/20 p-4">
                          <Button variant="destructive" size="sm" className="w-full gap-2" onClick={handleDisconnectIntercom} disabled={disconnectingIntercom}>
                            {disconnectingIntercom ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unplug className="h-3.5 w-3.5" />}
                            Disconnect Intercom
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="border-t bg-muted/30 px-5 py-3.5 flex flex-wrap items-center gap-x-10 gap-y-2 text-sm">
                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wide block">Workspace</span>
                      <p className="font-medium font-mono text-xs mt-0.5">{intercomStatus?.provider_workspace_id || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wide block">Board</span>
                      <p className="font-medium mt-0.5">{boards.find(b => b.id === intercomBoardId)?.name || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wide block">Connected on</span>
                      <p className="font-medium mt-0.5">{intercomStatus?.connected_at ? formatDate(intercomStatus.connected_at) : '—'}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">Active</span>
                    </div>
                  </div>
                </div>
              )}

              {needsDiscordReconnect && (
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Discord connection lost</p>
                    <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-0.5">Bot token was rejected. Reconnect to restore.</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300" onClick={handleConnectDiscord}>
                    <Plug className="h-3.5 w-3.5 mr-1.5" /> Reconnect
                  </Button>
                </div>
              )}

              {needsIntercomReconnect && (
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Intercom connection lost</p>
                    <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-0.5">Auth error — reconnect to restore.</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300" onClick={handleConnectIntercom}>
                    <Plug className="h-3.5 w-3.5 mr-1.5" /> Reconnect
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* ── Add Integrations ── */}
          <section className="space-y-4">
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Add Integrations</h2>
              <p className="text-sm text-muted-foreground mt-1">Supercharge your workflow by connecting with the tools you already use.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Discord */}
              <div className="rounded-xl border bg-card p-5 flex flex-col hover:shadow-md hover:border-[#5865F2]/30 transition-all group">
                <div className="h-10 w-10 rounded-lg bg-[#5865F2]/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <DiscordIcon className="h-5 w-5 text-[#5865F2]" />
                </div>
                <h3 className="font-semibold text-sm">Discord</h3>
                <p className="text-xs text-muted-foreground mt-1.5 flex-1 leading-relaxed">Monitor Discord channels and convert conversations into actionable feedback.</p>
                {isDiscordActive ? (
                  <div className="mt-4 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="h-4 w-4" /> Connected
                  </div>
                ) : (
                  <Button size="sm" className="mt-4 w-full bg-[#5865F2] hover:bg-[#4752C4]" onClick={handleConnectDiscord}>Connect</Button>
                )}
              </div>
              {/* Intercom */}
              <div className="rounded-xl border bg-card p-5 flex flex-col hover:shadow-md hover:border-[#1F8DED]/30 transition-all group">
                <div className="h-10 w-10 rounded-lg bg-[#1F8DED]/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <IntercomIcon className="h-5 w-5 text-[#1F8DED]" />
                </div>
                <h3 className="font-semibold text-sm">Intercom</h3>
                <p className="text-xs text-muted-foreground mt-1.5 flex-1 leading-relaxed">Receive closed conversation transcripts and generate feedback suggestions.</p>
                {isIntercomActive ? (
                  <div className="mt-4 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="h-4 w-4" /> Connected
                  </div>
                ) : (
                  <Button size="sm" className="mt-4 w-full bg-[#1F8DED] hover:bg-[#1a7ad4]" onClick={handleConnectIntercom}>Connect</Button>
                )}
              </div>
              {/* Slack — coming soon */}
              <div className="rounded-xl border bg-card p-5 flex flex-col opacity-60 cursor-not-allowed">
                <div className="h-10 w-10 rounded-lg bg-[#E01E5A]/10 flex items-center justify-center mb-3">
                  <SlackIcon className="h-5 w-5 text-[#E01E5A]" />
                </div>
                <h3 className="font-semibold text-sm">Slack</h3>
                <p className="text-xs text-muted-foreground mt-1.5 flex-1 leading-relaxed">Receive notifications and manage feedback directly from Slack.</p>
                <Button size="sm" variant="outline" className="mt-4 w-full" disabled>Coming Soon</Button>
              </div>
              {/* Email — coming soon */}
              <div className="rounded-xl border bg-card p-5 flex flex-col opacity-60 cursor-not-allowed">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                  <Mail className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-sm">Email</h3>
                <p className="text-xs text-muted-foreground mt-1.5 flex-1 leading-relaxed">Collect feedback via email and turn it into organized suggestions.</p>
                <Button size="sm" variant="outline" className="mt-4 w-full" disabled>Coming Soon</Button>
              </div>
            </div>
          </section>


        </>
      )}
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
