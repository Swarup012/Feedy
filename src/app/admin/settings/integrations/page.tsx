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
} from 'lucide-react';
import {
  autopilotService,
  type AutopilotSettings,
  type ChannelBoardMapping,
} from '@/services/autopilotService';
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
import { INTEGRATION_BRAND_COLORS } from '@/components/admin/integration-brands';

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
  const [githubAutopilot, setGithubAutopilot] = useState<AutopilotSettings | null>(null);

  const [discordMappings, setDiscordMappings] = useState<ChannelBoardMapping[]>([]);
  const [slackMappings, setSlackMappings] = useState<ChannelBoardMapping[]>([]);

  const [boards, setBoards] = useState<Board[]>([]);

  const [intercomBoardId, setIntercomBoardId] = useState<string | null>(null);
  const [githubBoardId, setGithubBoardId] = useState<string | null>(null);

  // New channel mapping form state
  const [newDiscordChannelId, setNewDiscordChannelId] = useState<string>('');
  const [newDiscordBoardId, setNewDiscordBoardId] = useState<string>('');
  const [newSlackChannelId, setNewSlackChannelId] = useState<string>('');
  const [newSlackBoardId, setNewSlackBoardId] = useState<string>('');
  const [addingDiscordChannel, setAddingDiscordChannel] = useState(false);
  const [addingSlackChannel, setAddingSlackChannel] = useState(false);

  const [loading, setLoading] = useState(true);
  const [disconnectingIntercom, setDisconnectingIntercom] = useState(false);
  const [disconnectingDiscord, setDisconnectingDiscord] = useState(false);
  const [disconnectingSlack, setDisconnectingSlack] = useState(false);
  const [disconnectingGithub, setDisconnectingGithub] = useState(false);
  const [savingIntercomAutopilot, setSavingIntercomAutopilot] = useState(false);
  const [savingGithubAutopilot, setSavingGithubAutopilot] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [intercomRes, discordRes, slackRes, githubRes] = await Promise.all([
        intercomService.getStatus(orgId).catch(err => {
          console.error('Failed to load Intercom status:', err);
          return null;
        }),
        discordService.getStatus(orgId).catch(err => {
          console.error('Failed to load Discord status:', err);
          return null;
        }),
        slackService.getStatus(orgId).catch(err => {
          console.error('Failed to load Slack status:', err);
          return null;
        }),
        githubService.getStatus(orgId).catch(err => {
          console.error('Failed to load GitHub status:', err);
          return null;
        }),
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

      // Load channel mappings for Slack/Discord
      const [discordMappingsRes, slackMappingsRes] = await Promise.all([
        (discordRes?.data?.status === 'active'
          ? autopilotService.listChannelMappings(orgId, 'discord').catch(() => ({ data: { mappings: [] } }))
          : Promise.resolve({ data: { mappings: [] } })),
        (slackRes?.data?.status === 'active'
          ? autopilotService.listChannelMappings(orgId, 'slack').catch(() => ({ data: { mappings: [] } }))
          : Promise.resolve({ data: { mappings: [] } })),
      ]);

      setDiscordMappings(discordMappingsRes.data?.mappings || []);
      setSlackMappings(slackMappingsRes.data?.mappings || []);
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
        // Intercom/GitHub: legacy single-row settings
        const [intercomRes, githubRes] = await Promise.all([
          autopilotService.getSettings(orgId, 'intercom').catch(err => {
            console.error('Failed to load Intercom autopilot settings:', err);
            return null;
          }),
          autopilotService.getSettings(orgId, 'github').catch(err => {
            console.error('Failed to load GitHub autopilot settings:', err);
            return null;
          }),
        ]);

        if (intercomRes?.data?.settings) {
          setIntercomAutopilot(intercomRes.data.settings);
          if (intercomRes.data.settings.default_board_id) {
            setIntercomBoardId(intercomRes.data.settings.default_board_id);
          }
        }

        if (githubRes?.data?.settings) {
          setGithubAutopilot(githubRes.data.settings);
          if (githubRes.data.settings.default_board_id) {
            setGithubBoardId(githubRes.data.settings.default_board_id);
          }
        }
      } catch (err) {
        console.error('Failed to load autopilot settings:', err);
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

  const handleAutopilotModeToggle = async (provider: 'intercom' | 'discord' | 'slack' | 'github', enable: boolean, mappingId?: string) => {
    if (!orgId) return;

    if ((provider === 'discord' || provider === 'slack') && mappingId) {
      // Multi-channel: update the specific mapping
      setAddingDiscordChannel(true); // reuse loading state
      try {
        await autopilotService.updateChannelMapping(orgId, provider, mappingId, {
          autopilot_mode: enable ? 'automatic' : 'manual',
        });
        // Reload mappings
        const res = await autopilotService.listChannelMappings(orgId, provider);
        if (provider === 'discord') {
          setDiscordMappings(res.data?.mappings || []);
        } else {
          setSlackMappings(res.data?.mappings || []);
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
        setAddingDiscordChannel(false);
      }
      return;
    }

    // Legacy: Intercom/GitHub
    const selectedBoardId =
      provider === 'intercom' ? intercomBoardId :
      githubBoardId;

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
      setSavingGithubAutopilot;
    setSaving(true);
    try {
      const res = await autopilotService.updateSettings(orgId, provider, payload);
      if (provider === 'intercom') {
        setIntercomAutopilot(res.data.settings);
      } else {
        setGithubAutopilot(res.data.settings);
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

  const handleBoardChange = async (provider: 'intercom' | 'discord' | 'slack' | 'github', boardId: string, mappingId?: string) => {
    if ((provider === 'discord' || provider === 'slack') && mappingId) {
      // Multi-channel: update the specific mapping's board
      try {
        await autopilotService.updateChannelMapping(orgId!, provider, mappingId, {
          board_id: boardId,
        });
        // Reload mappings
        const res = await autopilotService.listChannelMappings(orgId!, provider);
        if (provider === 'discord') {
          setDiscordMappings(res.data?.mappings || []);
        } else {
          setSlackMappings(res.data?.mappings || []);
        }
        toast({ title: 'Default board updated' });
      } catch (err: unknown) {
        toast({
          title: 'Update failed',
          description: (err as any)?.response?.data?.message || 'Failed to update board',
          variant: 'destructive',
        });
      }
      return;
    }

    // Legacy: Intercom/GitHub
    if (provider === 'intercom') {
      setIntercomBoardId(boardId);
    } else {
      setGithubBoardId(boardId);
    }

    const autopilotSettings =
      provider === 'intercom' ? intercomAutopilot :
      githubAutopilot;

    if (autopilotSettings?.autopilot_mode === 'automatic' && orgId) {
      const setSaving =
        provider === 'intercom' ? setSavingIntercomAutopilot :
        setSavingGithubAutopilot;
      setSaving(true);
      try {
        const res = await autopilotService.updateSettings(orgId, provider, {
          autopilot_mode: 'automatic',
          default_board_id: boardId,
        });
        if (provider === 'intercom') {
          setIntercomAutopilot(res.data.settings);
        } else {
          setGithubAutopilot(res.data.settings);
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

  const handleAddChannelMapping = async (provider: 'discord' | 'slack') => {
    if (!orgId) return;
    const channelId = provider === 'discord' ? newDiscordChannelId : newSlackChannelId;
    const boardId = provider === 'discord' ? newDiscordBoardId : newSlackBoardId;
    const setAdding = provider === 'discord' ? setAddingDiscordChannel : setAddingSlackChannel;

    if (!channelId) {
      toast({ title: 'Select a channel', variant: 'destructive' });
      return;
    }
    if (!boardId) {
      toast({ title: 'Select a board', variant: 'destructive' });
      return;
    }

    const channels = provider === 'discord' ? discordChannels : slackChannels;
    const channelName = channels.find(c => c.id === channelId)?.name || null;

    setAdding(true);
    try {
      await autopilotService.createChannelMapping(orgId, provider, {
        channel_id: channelId,
        channel_name: channelName,
        board_id: boardId,
      });
      // Reload mappings
      const res = await autopilotService.listChannelMappings(orgId, provider);
      if (provider === 'discord') {
        setDiscordMappings(res.data?.mappings || []);
        setNewDiscordChannelId('');
        setNewDiscordBoardId('');
      } else {
        setSlackMappings(res.data?.mappings || []);
        setNewSlackChannelId('');
        setNewSlackBoardId('');
      }
      toast({ title: 'Channel added', description: `Now monitoring #${channelName || channelId}` });
    } catch (err: unknown) {
      toast({
        title: 'Failed to add channel',
        description: (err as any)?.response?.data?.message || 'Failed to add channel mapping',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveChannelMapping = async (provider: 'discord' | 'slack', mappingId: string) => {
    if (!orgId) return;
    try {
      await autopilotService.deleteChannelMapping(orgId, provider, mappingId);
      // Reload mappings
      const res = await autopilotService.listChannelMappings(orgId, provider);
      if (provider === 'discord') {
        setDiscordMappings(res.data?.mappings || []);
      } else {
        setSlackMappings(res.data?.mappings || []);
      }
      toast({ title: 'Channel removed' });
    } catch (err: unknown) {
      toast({
        title: 'Failed to remove channel',
        description: (err as any)?.response?.data?.message || 'Failed to remove channel mapping',
        variant: 'destructive',
      });
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

    const hasAnyResult = intercomResult || discordResult || slackResult || githubResult;

    if (intercomResult === 'connected') {
      toast({
        title: 'Intercom connected',
        description: 'New closed conversations will feed into Autopilot.',
      });
      loadStatus();
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

    if (hasAnyResult) {
      const url = new URL(window.location.href);
      url.searchParams.delete('intercom');
      url.searchParams.delete('discord');
      url.searchParams.delete('slack');
      url.searchParams.delete('github');
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.pathname);

      // Retry after delay to handle backend eventual consistency
      const retry1 = setTimeout(() => loadStatus(), 2000);
      const retry2 = setTimeout(() => loadStatus(), 5000);
      return () => {
        clearTimeout(retry1);
        clearTimeout(retry2);
      };
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
                    brandColor={INTEGRATION_BRAND_COLORS.discord}
                    status={discordStatus?.status === 'error' ? 'error' : 'active'}
                    subtitle={`${discordMappings.length} channel(s) monitored · connected ${discordStatus?.connected_at ? formatDate(discordStatus.connected_at) : '—'}`}
                    settingsContent={
                      <>
                        {/* Existing channel mappings */}
                        {discordMappings.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <Hash className="h-3.5 w-3.5" /> Monitored Channels
                            </Label>
                            <div className="space-y-2">
                              {discordMappings.map(mapping => (
                                <div key={mapping.id} className="flex items-center gap-2 rounded-lg border p-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                      # {mapping.channel_name || discordChannels.find(c => c.id === mapping.channel_id)?.name || mapping.channel_id}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      → {boards.find(b => b.id === mapping.board_id)?.name || 'Unknown board'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Switch
                                      checked={mapping.autopilot_mode === 'automatic'}
                                      disabled={!canUseAutoMode}
                                      onCheckedChange={(checked) => handleAutopilotModeToggle('discord', checked, mapping.id)}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleRemoveChannelMapping('discord', mapping.id)}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add channel form */}
                        {discordChannels.length > 0 && (
                          <div className="space-y-2 pt-2 border-t">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Channel</Label>
                            <div className="flex gap-2">
                              <Select value={newDiscordChannelId || undefined} onValueChange={setNewDiscordChannelId}>
                                <SelectTrigger className="h-9 flex-1"><SelectValue placeholder="Channel…" /></SelectTrigger>
                                <SelectContent>
                                  {discordChannels
                                    .filter(ch => !discordMappings.some(m => m.channel_id === ch.id))
                                    .map(ch => (
                                      <SelectItem key={ch.id} value={ch.id}># {ch.name}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <Select value={newDiscordBoardId || undefined} onValueChange={setNewDiscordBoardId}>
                                <SelectTrigger className="h-9 flex-1"><SelectValue placeholder="Board…" /></SelectTrigger>
                                <SelectContent>
                                  {boards.map(b => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                className="h-9"
                                disabled={!newDiscordChannelId || !newDiscordBoardId || addingDiscordChannel}
                                onClick={() => handleAddChannelMapping('discord')}
                              >
                                {addingDiscordChannel ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                              </Button>
                            </div>
                          </div>
                        )}
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
                    brandColor={INTEGRATION_BRAND_COLORS.intercom}
                    status={intercomStatus?.status === 'error' ? 'error' : 'active'}
                    subtitle={`${intercomStatus?.provider_workspace_id || 'No workspace'} → ${boards.find(b => b.id === intercomBoardId)?.name || 'No board'} · connected ${intercomStatus?.connected_at ? formatDate(intercomStatus.connected_at) : '—'}`}
                    settingsContent={
                      <>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> Automatic Mode</Label>
                              <p className="text-xs text-muted-foreground leading-tight">Bypass review & publish instantly.</p>
                              {!intercomBoardId && <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5 font-medium">Select a board below first.</p>}
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
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Subscribe to <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">conversation.admin.closed</code> in Intercom Webhooks and point to your public webhook endpoint.
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
                    brandColor={INTEGRATION_BRAND_COLORS.slack}
                    status={slackStatus?.status === 'error' ? 'error' : 'active'}
                    subtitle={`${slackMappings.length} channel(s) monitored · connected ${slackStatus?.connected_at ? formatDate(slackStatus.connected_at) : '—'}`}
                    settingsContent={
                      <>
                        {/* Existing channel mappings */}
                        {slackMappings.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <Hash className="h-3.5 w-3.5" /> Monitored Channels
                            </Label>
                            <div className="space-y-2">
                              {slackMappings.map(mapping => (
                                <div key={mapping.id} className="flex items-center gap-2 rounded-lg border p-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                      # {mapping.channel_name || slackChannels.find(c => c.id === mapping.channel_id)?.name || mapping.channel_id}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      → {boards.find(b => b.id === mapping.board_id)?.name || 'Unknown board'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Switch
                                      checked={mapping.autopilot_mode === 'automatic'}
                                      disabled={!canUseAutoMode}
                                      onCheckedChange={(checked) => handleAutopilotModeToggle('slack', checked, mapping.id)}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleRemoveChannelMapping('slack', mapping.id)}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add channel form */}
                        {slackChannels.length > 0 && (
                          <div className="space-y-2 pt-2 border-t">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Channel</Label>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Invite the Feedy bot to each channel so Events API can deliver messages.
                            </p>
                            <div className="flex gap-2">
                              <Select value={newSlackChannelId || undefined} onValueChange={setNewSlackChannelId}>
                                <SelectTrigger className="h-9 flex-1"><SelectValue placeholder="Channel…" /></SelectTrigger>
                                <SelectContent>
                                  {slackChannels
                                    .filter(ch => !slackMappings.some(m => m.channel_id === ch.id))
                                    .map(ch => (
                                      <SelectItem key={ch.id} value={ch.id}># {ch.name}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <Select value={newSlackBoardId || undefined} onValueChange={setNewSlackBoardId}>
                                <SelectTrigger className="h-9 flex-1"><SelectValue placeholder="Board…" /></SelectTrigger>
                                <SelectContent>
                                  {boards.map(b => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                className="h-9"
                                disabled={!newSlackChannelId || !newSlackBoardId || addingSlackChannel}
                                onClick={() => handleAddChannelMapping('slack')}
                              >
                                {addingSlackChannel ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                              </Button>
                            </div>
                          </div>
                        )}
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
                    brandColor={INTEGRATION_BRAND_COLORS.github}
                    status={githubStatus?.status === 'error' ? 'error' : 'active'}
                    subtitle={`Installation #${githubStatus?.provider_workspace_id || '—'} → ${boards.find(b => b.id === githubBoardId)?.name || 'No board'} · connected ${githubStatus?.connected_at ? formatDate(githubStatus.connected_at) : '—'}`}
                    settingsContent={
                      <>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> Automatic Mode</Label>
                              <p className="text-xs text-muted-foreground leading-tight">Bypass review & publish instantly.</p>
                              {!githubBoardId && <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5 font-medium">Select a board below first.</p>}
                            </div>
                             <Switch checked={githubAutopilot?.autopilot_mode === 'automatic'} disabled={savingGithubAutopilot || !githubBoardId || !canUseAutoMode} onCheckedChange={(checked) => handleAutopilotModeToggle('github', checked)} />
                          </div>

                          {githubAutopilot?.autopilot_mode === 'automatic' && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30 px-3 py-2.5 flex gap-2">
                              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
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
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Subscribe to <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">issues</code> and <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">pull_request</code> events in your GitHub App settings and point to your public webhook endpoint.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {!isDiscordActive && (
                <IntegrationCardAdd
                  name="Discord"
                  icon={<DiscordIcon className="h-5 w-5 text-brand-discord" />}
                  brandColor={INTEGRATION_BRAND_COLORS.discord}
                  description="Monitor Discord channels and convert conversations into actionable feedback."
                  onConnect={handleConnectDiscord}
                />
              )}
              {!isIntercomActive && (
                <IntegrationCardAdd
                  name="Intercom"
                  icon={<IntercomIcon className="h-5 w-5 text-brand-intercom" />}
                  brandColor={INTEGRATION_BRAND_COLORS.intercom}
                  description="Receive closed conversation transcripts and generate feedback suggestions."
                  onConnect={handleConnectIntercom}
                />
              )}
              {!isSlackActive && (
                <IntegrationCardAdd
                  name="Slack"
                  icon={<SlackIcon className="h-5 w-5 text-brand-slack" />}
                  brandColor={INTEGRATION_BRAND_COLORS.slack}
                  description="Monitor a Slack channel and convert messages into actionable feedback."
                  onConnect={handleConnectSlack}
                />
              )}
              {!isGithubActive && (
                <IntegrationCardAdd
                  name="GitHub"
                  icon={<GitHubIcon className="h-5 w-5 text-brand-github dark:text-brand-github-light" />}
                  brandColor={INTEGRATION_BRAND_COLORS.github}
                  description="Track issues and pull requests as feedback via GitHub App webhooks."
                  onConnect={handleConnectGithub}
                />
              )}
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
