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
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  CheckCircle2,
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Master Switch */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">High-Severity Alerts</CardTitle>
                <CardDescription>
                  Receive Slack/Discord notifications when posts are classified as high severity
                  (billing, security, or data loss issues).
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={masterEnabled}
              onCheckedChange={handleMasterToggle}
              disabled={savingMaster}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Alert Destinations */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Alert Destinations</CardTitle>
              <CardDescription>
                Choose which channels receive high-severity alerts. These are independent of the
                channel used for feedback ingestion.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configured Channels */}
          {channels.length > 0 ? (
            <div className="space-y-2">
              {channels.map((channel, index) => (
                <div
                  key={channel.id || `${channel.provider}-${channel.channel_id}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {getProviderIcon(channel.provider)}
                    <div>
                      <span className="font-medium">
                        {channel.channel_name || channel.channel_id}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({channel.provider})
                      </span>
                    </div>
                    {!channel.enabled && (
                      <Badge variant="outline" className="text-xs">
                        Disabled
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
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
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No alert destinations configured. Add a channel below.
            </p>
          )}

          {/* Add Channel */}
          {addingProvider ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed">
              <Select
                value={addingProvider}
                onValueChange={(value: 'slack' | 'discord') => {
                  setAddingProvider(value);
                  setSelectedChannelId('');
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {slackStatus?.connected && (
                    <SelectItem value="slack">
                      <div className="flex items-center gap-2">
                        <SlackIcon className="h-4 w-4" />
                        Slack
                      </div>
                    </SelectItem>
                  )}
                  {discordStatus?.connected && (
                    <SelectItem value="discord">
                      <div className="flex items-center gap-2">
                        <DiscordIcon className="h-4 w-4" />
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
                <SelectTrigger className="flex-1">
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
                onClick={() => {
                  setAddingProvider(null);
                  setSelectedChannelId('');
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Reconnect banners */}
              {slackStatus?.connected && !writeScopeStatus.slack?.has_write_scope && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Reconnect Slack to enable notification alerts. The current token lacks{' '}
                    <code className="font-mono text-xs">chat:write</code> permission.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      window.location.href = `/api/organizations/${orgId}/integrations/slack/connect`;
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reconnect
                  </Button>
                </div>
              )}

              {/* Add button */}
              {(slackStatus?.connected || discordStatus?.connected) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Default to the first connected provider
                    if (slackStatus?.connected) {
                      setAddingProvider('slack');
                    } else if (discordStatus?.connected) {
                      setAddingProvider('discord');
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add channel
                </Button>
              )}

              {/* Not connected message */}
              {!slackStatus?.connected && !discordStatus?.connected && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Connect Slack or Discord in the Integrations tab to set up alert destinations.
                </p>
              )}
            </div>
          )}

          {/* Info note */}
          {channels.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Alerts are sent to the channels above, not the channel used for feedback ingestion.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
