'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { webhookService, Webhook, WebhookEvent, WebhookType } from '@/services/webhookService';
import { Copy, Check, ExternalLink } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const ALL_EVENTS: { value: WebhookEvent; label: string; category: string }[] = [
  { value: 'post.created',        label: 'Post Created',        category: 'post' },
  { value: 'post.updated',        label: 'Post Updated',        category: 'post' },
  { value: 'post.status_changed', label: 'Post Status Changed', category: 'post' },
  { value: 'post.deleted',        label: 'Post Deleted',        category: 'post' },
  { value: 'comment.created',     label: 'Comment Created',     category: 'comment' },
  { value: 'vote.created',        label: 'Vote Added',          category: 'vote' },
  { value: 'board.created',       label: 'Board Created',       category: 'board' },
  { value: 'changelog.published', label: 'Changelog Published', category: 'changelog' },
];

const EVENT_CATEGORIES = ['post', 'comment', 'vote', 'board', 'changelog'];

const WEBHOOK_TYPES: { value: WebhookType; label: string; description: string }[] = [
  { value: 'custom',  label: 'Custom',  description: 'Standard JSON payload to any HTTPS endpoint' },
  { value: 'discord', label: 'Discord', description: 'Formatted Discord embed via webhook URL' },
  { value: 'slack',   label: 'Slack',   description: 'Slack Block Kit message via incoming webhook' },
];

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface WebhookFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (webhook: Webhook) => void;
  existing?: Webhook | null; // null = create mode, Webhook = edit mode
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function WebhookFormDialog({ open, onClose, onSaved, existing }: WebhookFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!existing;

  // Form state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<WebhookType>('custom');
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Secret display (shown once after creation)
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);

  // Pre-fill form in edit mode
  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setUrl(existing.url);
      setType(existing.type);
      setEvents(existing.events);
      setDescription(existing.description || '');
      setIsActive(existing.is_active);
    } else {
      setName('');
      setUrl('');
      setType('custom');
      setEvents([]);
      setDescription('');
      setIsActive(true);
    }
    setNewSecret(null);
    setSecretCopied(false);
  }, [existing, open]);

  // Toggle an event on/off
  const toggleEvent = (event: WebhookEvent) => {
    setEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  // Select/deselect all events in a category
  const toggleCategory = (category: string) => {
    const categoryEvents = ALL_EVENTS.filter(e => e.category === category).map(e => e.value);
    const allSelected = categoryEvents.every(e => events.includes(e));
    if (allSelected) {
      setEvents(prev => prev.filter(e => !categoryEvents.includes(e)));
    } else {
      setEvents(prev => [...new Set([...prev, ...categoryEvents])]);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast({ title: 'Webhook name is required', variant: 'destructive' });
    if (!url.trim()) return toast({ title: 'Webhook URL is required', variant: 'destructive' });
    if (events.length === 0) return toast({ title: 'Select at least one event', variant: 'destructive' });

    setSaving(true);
    try {
      if (isEditing && existing) {
        const updated = await webhookService.updateWebhook(existing.id, {
          name, url, type, events, description: description || null, is_active: isActive,
        });
        toast({ title: '✅ Webhook updated successfully' });
        onSaved(updated);
        onClose();
      } else {
        const created = await webhookService.createWebhook({
          name, url, type, events, description: description || null,
        });
        // Show secret key — only time it's visible
        if (created.secret_key) {
          setNewSecret(created.secret_key);
        }
        toast({ title: '✅ Webhook created successfully' });
        onSaved(created);
      }
    } catch (err: any) {
      toast({
        title: 'Failed to save webhook',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const copySecret = async () => {
    if (!newSecret) return;
    await navigator.clipboard.writeText(newSecret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  const handleDone = () => {
    setNewSecret(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? 'Edit Webhook' : 'Create Webhook'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update webhook configuration and event subscriptions.'
              : 'Send real-time HTTP notifications to external services when events happen.'}
          </DialogDescription>
        </DialogHeader>

        {/* ── Secret Display (shown once after creation) ── */}
        {newSecret && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-700 dark:text-amber-400 font-semibold text-sm">
                🔑 Save your signing secret — it won&apos;t be shown again
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-md border px-3 py-2">
              <code className="text-xs font-mono flex-1 break-all select-all text-foreground">
                {newSecret}
              </code>
              <Button size="sm" variant="ghost" onClick={copySecret} className="shrink-0">
                {secretCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Use this secret to verify incoming webhook signatures using HMAC-SHA256.
            </p>
            <Button onClick={handleDone} className="w-full mt-1">
              I&apos;ve saved my secret — Done
            </Button>
          </div>
        )}

        {!newSecret && (
          <div className="space-y-5 py-1">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="wh-name">Name <span className="text-red-500">*</span></Label>
              <Input
                id="wh-name"
                placeholder="e.g. Slack Notifications"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label>Type <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-3 gap-2">
                {WEBHOOK_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      type === t.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium text-sm">{t.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* URL */}
            <div className="space-y-1.5">
              <Label htmlFor="wh-url">
                {type === 'discord' ? 'Discord Webhook URL' : type === 'slack' ? 'Slack Incoming Webhook URL' : 'Endpoint URL'}
                {' '}<span className="text-red-500">*</span>
              </Label>
              <Input
                id="wh-url"
                placeholder={
                  type === 'discord'
                    ? 'https://discord.com/api/webhooks/...'
                    : type === 'slack'
                    ? 'https://hooks.slack.com/services/...'
                    : 'https://your-server.com/webhooks/faddy'
                }
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
              {type !== 'custom' && (
                <p className="text-xs text-muted-foreground">
                  {type === 'discord'
                    ? 'Go to your Discord channel → Edit Channel → Integrations → Webhooks'
                    : 'Go to your Slack workspace → Apps → Incoming Webhooks'}
                </p>
              )}
            </div>

            {/* Events */}
            <div className="space-y-2">
              <Label>Events <span className="text-red-500">*</span></Label>
              <p className="text-xs text-muted-foreground">Select which events trigger this webhook.</p>
              <div className="space-y-3 rounded-lg border border-border p-3">
                {EVENT_CATEGORIES.map(category => {
                  const catEvents = ALL_EVENTS.filter(e => e.category === category);
                  const allSelected = catEvents.every(e => events.includes(e.value));
                  const someSelected = catEvents.some(e => events.includes(e.value));

                  return (
                    <div key={category}>
                      {/* Category header */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="flex items-center gap-2 mb-1.5 group"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          allSelected
                            ? 'bg-primary border-primary'
                            : someSelected
                            ? 'bg-primary/30 border-primary'
                            : 'border-border group-hover:border-primary/50'
                        }`}>
                          {allSelected && <Check className="h-2.5 w-2.5 text-white" />}
                          {someSelected && !allSelected && <div className="w-2 h-2 bg-primary rounded-sm" />}
                        </div>
                        <span className="text-sm font-medium capitalize text-foreground">{category}</span>
                      </button>

                      {/* Events in this category */}
                      <div className="ml-6 grid grid-cols-2 gap-1.5">
                        {catEvents.map(event => (
                          <button
                            key={event.value}
                            onClick={() => toggleEvent(event.value)}
                            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors text-left ${
                              events.includes(event.value)
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                              events.includes(event.value) ? 'bg-primary border-primary' : 'border-border'
                            }`}>
                              {events.includes(event.value) && <Check className="h-2 w-2 text-white" />}
                            </div>
                            {event.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {events.length > 0 && (
                <p className="text-xs text-muted-foreground">{events.length} event{events.length !== 1 ? 's' : ''} selected</p>
              )}
            </div>

            {/* Description (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="wh-desc">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="wh-desc"
                placeholder="What is this webhook used for?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Active toggle (edit mode only) */}
            {isEditing && (
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <div className="font-medium text-sm">Active</div>
                  <div className="text-xs text-muted-foreground">Pause or resume this webhook</div>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            )}
          </div>
        )}

        {!newSecret && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
