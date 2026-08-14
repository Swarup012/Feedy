'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PaidFeatureGate } from '@/components/PaidFeatureGate';
import { useOrganization } from '@/context/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { planAllowsFeature, resolvePlan } from '@/config/plans';
import { isPlanUpgradeRequired } from '@/lib/api';
import {
  intercomService,
  type IntercomStatus,
} from '@/services/intercomService';
import {
  discordService,
  type DiscordStatus,
  type DiscordChannel,
} from '@/services/discordService';
import {
  slackService,
  type SlackStatus,
  type SlackChannel,
} from '@/services/slackService';
import {
  githubService,
  type GitHubStatus,
} from '@/services/githubService';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Hash,
  Zap,
  Mail,
} from 'lucide-react';
import { autopilotService, type AutopilotSettings } from '@/services/autopilotService';
import { boardService, type Board } from '@/services/boardService';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  IntegrationCardConnected,
  IntegrationCardAdd,
  IntegrationDisconnectButton,
  IntegrationReconnectBanner,
  formatDate,
} from '@/components/admin/IntegrationCard';

const DiscordIcon = ({ className }: { className?: string }) => (
  <img src="/images/icons/discord.svg" alt="Discord" className={className} />
);

const IntercomIcon = ({ className }: { className?: string }) => (
  <img src="/images/icons/intercom.svg" alt="Intercom" className={className} />
);

const SlackIcon = ({ className }: { className?: string }) => (
  <img src="/images/icons/slack-new.svg" alt="Slack" className={className} />
);

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

function IntegrationsPageInner() {
  const { organization, loading: orgLoading } = useOrganization();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const orgId = organization?.id;
  const currentPlan = resolvePlan(organization);
  const canUseAutoMode = planAllowsFeature(currentPlan, 'autopilot_auto');

  const [intercomStatus, setIntercomStatus] = useState<IntercomStatus | null>(null);
  const [discordStatus, setDiscordStatus] = useState<DiscordStatus | null>(null);
  const [slackStatus, setSlackStatus] = useState<SlackStatus | null>(null);
  const [githubStatus, setGithubStatus] = useState<GitHubStatus | null>(null);
  const [discordChannels, setDiscordChannels] = useState<DiscordChannel[]>([]);
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([]);

  const [intercomAutopilot, setIntercomAutopilot] = useState<AutopilotSettings | null>(null);
  const [discordAutopilot, setDiscordAutopilot] = useState<AutopilotSettings | null>(null);
  const [slackAutopilot, setSlackAutopilot] = useState<AutopilotSettings | null>(null);
  const [githubAutopilot, setGithubAutopilot] = useState<AutopilotSettings | null>(null);

  const [boards, setBoards] = useState<Board[]>([]);

  const [intercomBoardId, setIntercomBoardId] = useState<string | null>(null);
  const [discordBoardId, setDiscordBoardId] = useState<string | null>(null);
  const [slackBoardId, setSlackBoardId] = useState<string | null>(null);
  const [githubBoardId, setGithubBoardId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [disconnectingIntercom, setDisconnectingIntercom] = useState(false);
  const [disconnectingDiscord, setDisconnectingDiscord] = useState(false);
  const [disconnectingSlack, setDisconnectingSlack] = useState(false);
  const [disconnectingGithub, setDisconnectingGithub] = useState(false);
  const [savingIntercomAutopilot, setSavingIntercomAutopilot] = useState(false);
  const [savingDiscordAutopilot, setSavingDiscordAutopilot] = useState(false);
  const [savingSlackAutopilot, setSavingSlackAutopilot] = useState(false);
  const [savingGithubAutopilot, setSavingGithubAutopilot] = useState(false);
  const [savingDiscordChannel, setSavingDiscordChannel] = useState(false);
  const [savingSlackChannel, setSavingSlackChannel] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [intercomRes, discordRes, slackRes, githubRes] = await Promise.all([
        intercomService.getStatus(orgId).catch(() => null),
        discordService.getStatus(orgId).catch(() => null),
        slackService.getStatus(orgId).catch(() => null),
        githubService.getStatus(orgId).catch(() => null),
      ]);

      if (intercomRes) setIntercomStatus(intercomRes.data);
      if (discordRes) setDiscordStatus(discordRes.data);
      if (slackRes) setSlackStatus(slackRes.data);
      if (githubRes) setGithubStatus(githubRes.data);

      if (discordRes?.data?.status === 'active' && discordRes.data.provider_workspace_id) {
        discordService.listChannels(orgId).then(res => {
          setDiscordChannels(res.data.channels);
        }).catch(err => {
          console.error("Failed to load Discord channels:", err);
        });
      }

      if (slackRes?.data?.status === 'active' && slackRes.data.provider_workspace_id) {
        slackService.listChannels(orgId).then(res => {
          setSlackChannels(res.data.channels);
        }).catch(err => {
          console.error("Failed to load Slack channels:", err);
        });
      }
    } catch (err: any) {
      if (!isPlanUpgradeRequired(err)) {
        toast({
          title: 'Failed to load integration status',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [orgId, toast]);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        const [intercomRes, discordRes, slackRes, githubRes] = await Promise.all([
          autopilotService.getSettings(orgId, 'intercom').catch(() => null),
          autopilotService.getSettings(orgId, 'discord').catch(() => null),
          autopilotService.getSettings(orgId, 'slack').catch(() => null),
          autopilotService.getSettings(orgId, 'github').catch(() => null),
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

        if (slackRes?.data?.settings) {
          setSlackAutopilot(slackRes.data.settings);
          if (slackRes.data.settings.default_board_id) {
            setSlackBoardId(slackRes.data.settings.default_board_id);
          }
        }

        if (githubRes?.data?.settings) {
          setGithubAutopilot(githubRes.data.settings);
          if (githubRes.data.settings.default_board_id) {
            setGithubBoardId(githubRes.data.settings.default_board_id);
          }
        }
      } catch {
        // non-fatal.
      }
    })();
  }, [orgId]);

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

  const handleAutopilotModeToggle = async (provider: 'intercom' | 'discord' | 'slack' | 'github', enable: boolean) => {
    if (!orgId) return;

    const selectedBoardId =
      provider === 'intercom' ? intercomBoardId :
      provider === 'discord' ? discordBoardId :
      provider === 'github' ? githubBoardId :
      slackBoardId;

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

    const setSaving =
      provider === 'intercom' ? setSavingIntercomAutopilot :
      provider === 'discord' ? setSavingDiscordAutopilot :
      provider === 'github' ? setSavingGithubAutopilot :
      setSavingSlackAutopilot;
    setSaving(true);
    try {
      const res = await autopilotService.updateSettings(orgId, provider, payload);
      if (provider === 'intercom') {
        setIntercomAutopilot(res.data.settings);
      } else if (provider === 'discord') {
        setDiscordAutopilot(res.data.settings);
      } else if (provider === 'github') {
        setGithubAutopilot(res.data.settings);
      } else {
        setSlackAutopilot(res.data.settings);
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

  const handleBoardChange = async (provider: 'intercom' | 'discord' | 'slack' | 'github', boardId: string) => {
    if (provider === 'intercom') {
      setIntercomBoardId(boardId);
    } else if (provider === 'discord') {
      setDiscordBoardId(boardId);
    } else if (provider === 'github') {
      setGithubBoardId(boardId);
    } else {
      setSlackBoardId(boardId);
    }

    const autopilotSettings =
      provider === 'intercom' ? intercomAutopilot :
      provider === 'discord' ? discordAutopilot :
      provider === 'github' ? githubAutopilot :
      slackAutopilot;

    if (autopilotSettings?.autopilot_mode === 'automatic' && orgId) {
      const setSaving =
        provider === 'intercom' ? setSavingIntercomAutopilot :
        provider === 'discord' ? setSavingDiscordAutopilot :
        provider === 'github' ? setSavingGithubAutopilot :
        setSavingSlackAutopilot;
      setSaving(true);
      try {
        const res = await autopilotService.updateSettings(orgId, provider, {
          autopilot_mode: 'automatic',
          default_board_id: boardId,
        });
        if (provider === 'intercom') {
          setIntercomAutopilot(res.data.settings);
        } else if (provider === 'discord') {
          setDiscordAutopilot(res.data.settings);
        } else if (provider === 'github') {
          setGithubAutopilot(res.data.settings);
        } else {
          setSlackAutopilot(res.data.settings);
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

  const handleSlackChannelChange = async (channelId: string) => {
    if (!orgId) return;
    setSavingSlackChannel(true);
    try {
      const res = await slackService.setChannel(orgId, channelId);
      if (slackStatus) {
        setSlackStatus({
          ...slackStatus,
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
      setSavingSlackChannel(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const intercomResult = searchParams.get('intercom');
    const discordResult = searchParams.get('discord');
    const slackResult = searchParams.get('slack');
    const githubResult = searchParams.get('github');
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
      loadStatus();
    } else if (discordResult === 'error') {
      toast({
        title: 'Discord connection failed',
        description: message || 'Please try again.',
        variant: 'destructive',
      });
    }

    if (slackResult === 'connected') {
      toast({
        title: 'Slack connected',
        description: 'Select a channel to monitor for feedback. Invite the bot to that channel.',
      });
      loadStatus();
    } else if (slackResult === 'error') {
      toast({
        title: 'Slack connection failed',
        description: message || 'Please try again.',
        variant: 'destructive',
      });
    }

    if (githubResult === 'connected') {
      toast({
        title: 'GitHub connected',
        description: 'Issues and pull requests will now feed into Autopilot.',
      });
      loadStatus();
    } else if (githubResult === 'error') {
      toast({
        title: 'GitHub connection failed',
        description: message || 'Please try again.',
        variant: 'destructive',
      });
    }

    if (intercomResult || discordResult || slackResult || githubResult) {
      const url = new URL(window.location.href);
      url.searchParams.delete('intercom');
      url.searchParams.delete('discord');
      url.searchParams.delete('slack');
      url.searchParams.delete('github');
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

  const handleConnectSlack = () => {
    if (!orgId) return;
    slackService.startConnect(orgId);
  };

  const handleConnectGithub = () => {
    if (!orgId) return;
    githubService.startConnect(orgId);
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

  const handleDisconnectSlack = async () => {
    if (!orgId) return;
    setDisconnectingSlack(true);
    try {
      await slackService.disconnect(orgId);
      toast({
        title: 'Slack disconnected',
        description: 'We will no longer monitor your Slack channel.',
      });
      setSlackChannels([]);
      await loadStatus();
    } catch (err: unknown) {
      toast({
        title: 'Disconnect failed',
        description: (err as Error)?.message || 'Disconnect failed',
        variant: 'destructive',
      });
    } finally {
      setDisconnectingSlack(false);
    }
  };

  const handleDisconnectGithub = async () => {
    if (!orgId) return;
    setDisconnectingGithub(true);
    try {
      await githubService.disconnect(orgId);
      toast({
        title: 'GitHub disconnected',
        description: 'Issues and pull requests will no longer be ingested. Note: the GitHub App is not uninstalled from your GitHub account.',
      });
      await loadStatus();
    } catch (err: unknown) {
      toast({
        title: 'Disconnect failed',
        description: (err as Error)?.message || 'Disconnect failed',
        variant: 'destructive',
      });
    } finally {
      setDisconnectingGithub(false);
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

  const isSlackActive = slackStatus?.status === 'active';
  const needsSlackReconnect = slackStatus?.status === 'error';

  const isGithubActive = githubStatus?.status === 'active';
  const needsGithubReconnect = githubStatus?.status === 'error';

  const activeCount = [isDiscordActive, isIntercomActive, isSlackActive, isGithubActive].filter(Boolean).length;

  return (
    <PaidFeatureGate featureName="Integrations">
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">Connect and manage your favorite tools.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-5">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading integrations…
        </div>
      ) : (
        <>
          {/* ── Connected Integrations ── */}
          {activeCount > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Connected · {activeCount}
              </h2>

              <div className="space-y-2">
                {isDiscordActive && (
                  <IntegrationCardConnected
                    name="Discord"
                    icon={<DiscordIcon className="h-5 w-5" />}
                    brandColor="#5865F2"
                    status={discordStatus?.status === 'error' ? 'error' : 'active'}
                    subtitle={`#${discordChannels.find(c => c.id === discordStatus?.provider_channel_id)?.name || 'No channel'} → ${boards.find(b => b.id === discordBoardId)?.name || 'No board'} · connected ${discordStatus?.connected_at ? formatDate(discordStatus.connected_at) : '—'}`}
                    settingsContent={
                      <>
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
                             <Switch checked={discordAutopilot?.autopilot_mode === 'automatic'} disabled={savingDiscordAutopilot || !discordBoardId || !canUseAutoMode} onCheckedChange={(checked) => handleAutopilotModeToggle('discord', checked)} />
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
                      </>
                    }
                    footerContent={
                      <IntegrationDisconnectButton
                        onClick={handleDisconnectDiscord}
                        loading={disconnectingDiscord}
                        label="Disconnect Discord"
                      />
                    }
                    reconnectButton={
                      needsDiscordReconnect ? (
                        <IntegrationReconnectBanner
                          name="Discord"
                          message="Bot token was rejected. Reconnect to restore."
                          onReconnect={handleConnectDiscord}
                        />
                      ) : undefined
                    }
                  />
                )}

                {isIntercomActive && (
                  <IntegrationCardConnected
                    name="Intercom"
                    icon={<IntercomIcon className="h-5 w-5" />}
                    brandColor="#1F8DED"
                    status={intercomStatus?.status === 'error' ? 'error' : 'active'}
                    subtitle={`${intercomStatus?.provider_workspace_id || 'No workspace'} → ${boards.find(b => b.id === intercomBoardId)?.name || 'No board'} · connected ${intercomStatus?.connected_at ? formatDate(intercomStatus.connected_at) : '—'}`}
                    settingsContent={
                      <>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> Automatic Mode</Label>
                              <p className="text-[11px] text-muted-foreground leading-tight">Bypass review & publish instantly.</p>
                              {!intercomBoardId && <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5 font-medium">Select a board below first.</p>}
                            </div>
                             <Switch checked={intercomAutopilot?.autopilot_mode === 'automatic'} disabled={savingIntercomAutopilot || !intercomBoardId || !canUseAutoMode} onCheckedChange={(checked) => handleAutopilotModeToggle('intercom', checked)} />
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
                      </>
                    }
                    footerContent={
                      <IntegrationDisconnectButton
                        onClick={handleDisconnectIntercom}
                        loading={disconnectingIntercom}
                        label="Disconnect Intercom"
                      />
                    }
                    reconnectButton={
                      needsIntercomReconnect ? (
                        <IntegrationReconnectBanner
                          name="Intercom"
                          message="Auth error — reconnect to restore."
                          onReconnect={handleConnectIntercom}
                        />
                      ) : undefined
                    }
                  />
                )}

                {isSlackActive && (
                  <IntegrationCardConnected
                    name="Slack"
                    icon={<SlackIcon className="h-5 w-5" />}
                    brandColor="#E01E5A"
                    status={slackStatus?.status === 'error' ? 'error' : 'active'}
                    subtitle={`#${slackChannels.find(c => c.id === slackStatus?.provider_channel_id)?.name || 'No channel'} → ${boards.find(b => b.id === slackBoardId)?.name || 'No board'} · connected ${slackStatus?.connected_at ? formatDate(slackStatus.connected_at) : '—'}`}
                    settingsContent={
                      <>
                        {slackChannels.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <Hash className="h-3.5 w-3.5" /> Monitored Channel
                            </Label>
                            <Select value={slackStatus?.provider_channel_id || undefined} onValueChange={handleSlackChannelChange} disabled={savingSlackChannel}>
                              <SelectTrigger className="h-9"><SelectValue placeholder="Select channel…" /></SelectTrigger>
                              <SelectContent>
                                {slackChannels.map(ch => (
                                  <SelectItem key={ch.id} value={ch.id}># {ch.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              Invite the Feedy bot to this channel so Events API can deliver messages.
                            </p>
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> Automatic Mode</Label>
                              <p className="text-[11px] text-muted-foreground leading-tight">Bypass review & publish instantly.</p>
                              {!slackBoardId && <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5 font-medium">Select a board below first.</p>}
                            </div>
                             <Switch checked={slackAutopilot?.autopilot_mode === 'automatic'} disabled={savingSlackAutopilot || !slackBoardId || !canUseAutoMode} onCheckedChange={(checked) => handleAutopilotModeToggle('slack', checked)} />
                          </div>

                          {slackAutopilot?.autopilot_mode === 'automatic' && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30 px-3 py-2.5 flex gap-2">
                              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                                Feedback from this channel will publish directly to the board without manual review.
                              </p>
                            </div>
                          )}

                          <div className="space-y-2 pt-1 border-t">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-2 block">Default Board</Label>
                            <Select value={slackBoardId || undefined} onValueChange={(val) => handleBoardChange('slack', val)} disabled={savingSlackAutopilot}>
                              <SelectTrigger className="h-9"><SelectValue placeholder="Select a board…" /></SelectTrigger>
                              <SelectContent>
                                {boards.map(b => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    }
                    footerContent={
                      <IntegrationDisconnectButton
                        onClick={handleDisconnectSlack}
                        loading={disconnectingSlack}
                        label="Disconnect Slack"
                      />
                    }
                    reconnectButton={
                      needsSlackReconnect ? (
                        <IntegrationReconnectBanner
                          name="Slack"
                          message="Auth error — reconnect to restore."
                          onReconnect={handleConnectSlack}
                        />
                      ) : undefined
                    }
                  />
                )}

                {isGithubActive && (
                  <IntegrationCardConnected
                    name="GitHub"
                    icon={<GitHubIcon className="h-5 w-5" />}
                    brandColor="#24292F"
                    status={githubStatus?.status === 'error' ? 'error' : 'active'}
                    subtitle={`Installation #${githubStatus?.provider_workspace_id || '—'} → ${boards.find(b => b.id === githubBoardId)?.name || 'No board'} · connected ${githubStatus?.connected_at ? formatDate(githubStatus.connected_at) : '—'}`}
                    settingsContent={
                      <>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> Automatic Mode</Label>
                              <p className="text-[11px] text-muted-foreground leading-tight">Bypass review & publish instantly.</p>
                              {!githubBoardId && <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5 font-medium">Select a board below first.</p>}
                            </div>
                             <Switch checked={githubAutopilot?.autopilot_mode === 'automatic'} disabled={savingGithubAutopilot || !githubBoardId || !canUseAutoMode} onCheckedChange={(checked) => handleAutopilotModeToggle('github', checked)} />
                          </div>

                          {githubAutopilot?.autopilot_mode === 'automatic' && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30 px-3 py-2.5 flex gap-2">
                              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                                Issues and pull requests will publish directly to the board without manual review.
                              </p>
                            </div>
                          )}

                          <div className="space-y-2 pt-1 border-t">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-2 block">Default Board</Label>
                            <Select value={githubBoardId || undefined} onValueChange={(val) => handleBoardChange('github', val)} disabled={savingGithubAutopilot}>
                              <SelectTrigger className="h-9"><SelectValue placeholder="Select a board…" /></SelectTrigger>
                              <SelectContent>
                                {boards.map(b => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="rounded-lg bg-muted/50 border border-dashed px-3 py-2.5">
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Subscribe to <code className="font-mono text-[9px] bg-muted px-1 py-0.5 rounded">issues</code> and <code className="font-mono text-[9px] bg-muted px-1 py-0.5 rounded">pull_request</code> events in your GitHub App settings and point to your public webhook endpoint.
                          </p>
                        </div>
                      </>
                    }
                    footerContent={
                      <IntegrationDisconnectButton
                        onClick={handleDisconnectGithub}
                        loading={disconnectingGithub}
                        label="Disconnect GitHub"
                        note="This only disconnects Faddy. You must uninstall the App from GitHub separately."
                      />
                    }
                    reconnectButton={
                      needsGithubReconnect ? (
                        <IntegrationReconnectBanner
                          name="GitHub"
                          message="Connection error — reconnect to restore."
                          onReconnect={handleConnectGithub}
                        />
                      ) : undefined
                    }
                  />
                )}
              </div>
            </section>
          )}

          {/* ── Add Integrations ── */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Add Integrations</h2>
              <p className="text-sm text-muted-foreground mt-1">Supercharge your workflow by connecting with the tools you already use.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {!isDiscordActive && (
                <IntegrationCardAdd
                  name="Discord"
                  icon={<DiscordIcon className="h-5 w-5 text-[#5865F2]" />}
                  brandColor="#5865F2"
                  description="Monitor Discord channels and convert conversations into actionable feedback."
                  onConnect={handleConnectDiscord}
                />
              )}
              {!isIntercomActive && (
                <IntegrationCardAdd
                  name="Intercom"
                  icon={<IntercomIcon className="h-5 w-5 text-[#1F8DED]" />}
                  brandColor="#1F8DED"
                  description="Receive closed conversation transcripts and generate feedback suggestions."
                  onConnect={handleConnectIntercom}
                />
              )}
              {!isSlackActive && (
                <IntegrationCardAdd
                  name="Slack"
                  icon={<SlackIcon className="h-5 w-5" />}
                  brandColor="#E01E5A"
                  description="Monitor a Slack channel and convert messages into actionable feedback."
                  onConnect={handleConnectSlack}
                />
              )}
              {!isGithubActive && (
                <IntegrationCardAdd
                  name="GitHub"
                  icon={<GitHubIcon className="h-5 w-5 text-[#24292F] dark:text-[#f0f6fc]" />}
                  brandColor="#24292F"
                  description="Track issues and pull requests as feedback via GitHub App webhooks."
                  onConnect={handleConnectGithub}
                />
              )}
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
    </PaidFeatureGate>
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
