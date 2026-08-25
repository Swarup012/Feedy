'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { isPlanUpgradeRequired } from '@/lib/api';
import {
  notificationChannelsService,
  type NotificationChannel,
  type WriteScopeStatus,
} from '@/services/notificationChannelsService';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Bell,
  Hash,
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';

const DiscordIcon = ({ className }: { className?: string }) => (
  <img src="/images/icons/discord.svg" alt="Discord" className={className} />
);

const SlackIcon = ({ className }: { className?: string }) => (
  <img src="/images/icons/slack-new.svg" alt="Slack" className={className} />
);

export function NotificationsTab() {
  const { organization, refreshOrganization } = useOrganization();
  const { toast } = useToast();
  const orgId = organization?.id;

  // Master switch
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [savingMaster, setSavingMaster] = useState(false);

  // Notification channels
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Connected providers
  const [slackStatus, setSlackStatus] = useState<SlackStatus | null>(null);
  const [discordStatus, setDiscordStatus] = useState<DiscordStatus | null>(null);
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([]);
  const [discordChannels, setDiscordChannels] = useState<DiscordChannel[]>([]);

  // Write scope status
  const [writeScopeStatus, setWriteScopeStatus] = useState<WriteScopeStatus>({
    slack: { connected: false, has_write_scope: false },
    discord: { connected: false, has_write_scope: false },
  });

  // Channel picker state
  const [addingProvider, setAddingProvider] = useState<'slack' | 'discord' | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');

  const loadAll = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [channelsRes, slackRes, discordRes, scopeRes] = await Promise.all([
        notificationChannelsService.getChannels(orgId).catch(() => null),
        slackService.getStatus(orgId).catch(() => null),
        discordService.getStatus(orgId).catch(() => null),
        notificationChannelsService.getWriteScopeStatus(orgId).catch(() => null),
      ]);

      if (channelsRes?.data?.channels) {
        setChannels(channelsRes.data.channels);
        // Set master switch from org data (refreshed via organization context)
      }

      if (slackRes?.data) {
        setSlackStatus(slackRes.data);
        if (slackRes.data.status === 'active' && slackRes.data.provider_workspace_id) {
          slackService.listChannels(orgId).then(res => {
            setSlackChannels(res.data.channels);
          }).catch(() => {});
        }
      }

      if (discordRes?.data) {
        setDiscordStatus(discordRes.data);
        if (discordRes.data.status === 'active' && discordRes.data.provider_workspace_id) {
          discordService.listChannels(orgId).then(res => {
            setDiscordChannels(res.data.channels);
          }).catch(() => {});
        }
      }

      if (scopeRes?.data) {
        setWriteScopeStatus(scopeRes.data);
      }
    } catch (err: any) {
      if (!isPlanUpgradeRequired(err)) {
        toast({
          title: 'Failed to load notification settings',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [orgId, toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Sync master switch with org data
  useEffect(() => {
    if (organization?.notify_on_high_severity !== undefined) {
      setMasterEnabled(organization.notify_on_high_severity);
    }
  }, [organization]);

  const handleMasterToggle = async (checked: boolean) => {
    if (!orgId) return;
    setSavingMaster(true);
    try {
      await notificationChannelsService.replaceChannels(orgId, channels, checked);
      setMasterEnabled(checked);
      await refreshOrganization();
      toast({
        title: checked ? 'Notifications enabled' : 'Notifications disabled',
      });
    } catch (err) {
      toast({
        title: 'Failed to update notification settings',
        variant: 'destructive',
      });
      setMasterEnabled(!checked);
    } finally {
      setSavingMaster(false);
    }
  };

  const handleAddChannel = async () => {
    if (!orgId || !addingProvider || !selectedChannelId) return;

    // Check for duplicates
    const exists = channels.some(
      ch => ch.provider === addingProvider && ch.channel_id === selectedChannelId
    );
    if (exists) {
      toast({
        title: 'Channel already configured',
        variant: 'destructive',
      });
      return;
    }

    // Get channel name from the list
    const channelList = addingProvider === 'slack' ? slackChannels : discordChannels;
    const channelName = channelList.find(ch => ch.id === selectedChannelId)?.name;

    const newChannel: NotificationChannel = {
      provider: addingProvider,
      channel_id: selectedChannelId,
      channel_name: channelName ? `#${channelName}` : undefined,
      event_type: 'needs_attention',
      enabled: true,
    };

    const updatedChannels = [...channels, newChannel];

    setSaving(true);
    try {
      await notificationChannelsService.replaceChannels(orgId, updatedChannels, masterEnabled);
      setChannels(updatedChannels);
      setAddingProvider(null);
      setSelectedChannelId('');
      toast({
        title: 'Channel added',
      });
    } catch (err) {
      toast({
        title: 'Failed to add channel',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveChannel = async (index: number) => {
    if (!orgId) return;

    const updatedChannels = channels.filter((_, i) => i !== index);

    setSaving(true);
    try {
      await notificationChannelsService.replaceChannels(orgId, updatedChannels, masterEnabled);
      setChannels(updatedChannels);
      toast({
        title: 'Channel removed',
      });
    } catch (err) {
      toast({
        title: 'Failed to remove channel',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleChannel = async (index: number, enabled: boolean) => {
    if (!orgId) return;

    const updatedChannels = channels.map((ch, i) =>
      i === index ? { ...ch, enabled } : ch
    );

    setSaving(true);
    try {
      await notificationChannelsService.replaceChannels(orgId, updatedChannels, masterEnabled);
      setChannels(updatedChannels);
    } catch (err) {
      toast({
        title: 'Failed to update channel',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    if (provider === 'slack') return <SlackIcon className="h-5 w-5" />;
    if (provider === 'discord') return <DiscordIcon className="h-5 w-5" />;
    return <Hash className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading notification settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Master Switch */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary/60 to-primary" />
        <div className="flex items-center justify-between p-5 pl-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold leading-none tracking-tight">
                High-Severity Alerts
              </h3>
              <p className="text-sm text-muted-foreground">
                Get notified when posts are classified as high severity — billing, security, or data
                loss issues.
              </p>
            </div>
          </div>
          <Switch
            checked={masterEnabled}
            onCheckedChange={handleMasterToggle}
            disabled={savingMaster}
          />
        </div>
      </div>

      {/* Alert Destinations */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between p-5 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Hash className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold leading-none tracking-tight">
                Alert Destinations
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose which channels receive high-severity alerts. Separate from your feedback
                ingestion channel.
              </p>
            </div>
          </div>
          {channels.length > 0 && (
            <Badge variant="secondary" className="text-xs font-medium">
              {channels.length} {channels.length === 1 ? 'channel' : 'channels'}
            </Badge>
          )}
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Configured Channels */}
          {channels.length > 0 ? (
            <div className="space-y-2">
              {channels.map((channel, index) => (
                <div
                  key={channel.id || `${channel.provider}-${channel.channel_id}`}
                  className={`group flex items-center justify-between rounded-lg border bg-background/50 px-4 py-3 transition-colors hover:bg-accent/50 ${
                    !channel.enabled ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                        channel.provider === 'slack'
                          ? 'bg-[#E01E5A]/10'
                          : 'bg-[#5865F2]/10'
                      }`}
                    >
                      {getProviderIcon(channel.provider)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {channel.channel_name || channel.channel_id}
                        </span>
                        {!channel.enabled && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {channel.provider}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={(checked) => handleToggleChannel(index, checked)}
                      disabled={saving}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveChannel(index)}
                      disabled={saving}
                      className="h-8 w-8 p-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">No destinations yet</p>
                <p className="text-xs text-muted-foreground max-w-[280px]">
                  Add a Slack or Discord channel to start receiving high-severity alerts.
                </p>
              </div>
            </div>
          )}

          {/* Add Channel */}
          {addingProvider ? (
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Plus className="h-3.5 w-3.5" />
                Add alert destination
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={addingProvider}
                  onValueChange={(value: 'slack' | 'discord') => {
                    setAddingProvider(value);
                    setSelectedChannelId('');
                  }}
                >
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {slackStatus?.connected && (
                      <SelectItem value="slack">
                        <div className="flex items-center gap-2">
                          <SlackIcon className="h-3.5 w-3.5" />
                          Slack
                        </div>
                      </SelectItem>
                    )}
                    {discordStatus?.connected && (
                      <SelectItem value="discord">
                        <div className="flex items-center gap-2">
                          <DiscordIcon className="h-3.5 w-3.5" />
                          Discord
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedChannelId}
                  onValueChange={setSelectedChannelId}
                >
                  <SelectTrigger className="flex-1 h-9">
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {(addingProvider === 'slack' ? slackChannels : discordChannels).map((ch) => (
                      <SelectItem key={ch.id} value={ch.id}>
                        #{ch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  className="h-9 px-4"
                  onClick={handleAddChannel}
                  disabled={!selectedChannelId || saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Add'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 px-3"
                  onClick={() => {
                    setAddingProvider(null);
                    setSelectedChannelId('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Reconnect banners */}
              {slackStatus?.connected && !writeScopeStatus.slack?.has_write_scope && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200/60 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20 p-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Reconnect Slack
                    </p>
                    <p className="text-xs text-amber-700/80 dark:text-amber-300/70">
                      The current token lacks{' '}
                      <code className="font-mono text-[11px] bg-amber-100/60 dark:bg-amber-900/30 px-1 py-0.5 rounded">
                        chat:write
                      </code>{' '}
                      permission. Reconnect to enable notification alerts.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-8 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                    onClick={() => {
                      window.location.href = `/api/organizations/${orgId}/integrations/slack/connect`;
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Reconnect
                  </Button>
                </div>
              )}

              {/* Add button */}
              {(slackStatus?.connected || discordStatus?.connected) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-dashed"
                  onClick={() => {
                    if (slackStatus?.connected) {
                      setAddingProvider('slack');
                    } else if (discordStatus?.connected) {
                      setAddingProvider('discord');
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add channel
                </Button>
              )}

              {/* Not connected message */}
              {!slackStatus?.connected && !discordStatus?.connected && (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Hash className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium">No integrations connected</p>
                    <p className="text-xs text-muted-foreground max-w-[280px]">
                      Connect Slack or Discord in the Integrations tab to set up alert destinations.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info note */}
          {channels.length > 0 && (
            <p className="text-xs text-muted-foreground/70 pt-1">
              Alerts are sent to the channels above, not the channel used for feedback ingestion.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
