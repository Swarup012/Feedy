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
import { useBoards } from '@/hooks/useFeedbackData';
import { Copy, Check, ExternalLink, X } from 'lucide-react';

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

const WEBHOOK_TYPES: { value: WebhookType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'custom',
    label: 'Custom',
    description: 'Standard JSON payload to any HTTPS endpoint',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    value: 'discord',
    label: 'Discord',
    description: 'Formatted Discord embed via webhook URL',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    value: 'slack',
    label: 'Slack',
    description: 'Slack Block Kit message via incoming webhook',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.315A2.527 2.527 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z" />
      </svg>
    ),
  },
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
  const [boardIds, setBoardIds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const { boards, isLoading: boardsLoading } = useBoards();

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
      setBoardIds(existing.board_ids || []);
      setDescription(existing.description || '');
      setIsActive(existing.is_active);
    } else {
      setName('');
      setUrl('');
      setType('custom');
      setEvents([]);
      setBoardIds([]);
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
      const boardIdsPayload = boardIds.length > 0 ? boardIds : null;
      if (isEditing && existing) {
        const updated = await webhookService.updateWebhook(existing.id, {
          name, url, type, events, board_ids: boardIdsPayload, description: description || null, is_active: isActive,
        });
        toast({ title: '✅ Webhook updated successfully' });
        onSaved(updated);
        onClose();
      } else {
        const created = await webhookService.createWebhook({
          name, url, type, events, board_ids: boardIdsPayload, description: description || null,
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
              <div role="radiogroup" aria-label="Webhook type" className="grid grid-cols-3 gap-2">
                {WEBHOOK_TYPES.map(t => (
                  <button
                    key={t.value}
                    role="radio"
                    aria-checked={type === t.value}
                    onClick={() => setType(t.value)}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      type === t.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 ${type === t.value ? 'text-primary' : 'text-muted-foreground'}`}>
                        {t.icon}
                      </div>
                      <div className="font-medium text-sm">{t.label}</div>
                    </div>
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
                        role="checkbox"
                        aria-checked={allSelected}
                        aria-label={`Select all ${category} events`}
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
                            role="checkbox"
                            aria-checked={events.includes(event.value)}
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

            {/* Board scope */}
            <div className="space-y-2">
              <Label>Boards <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <p className="text-xs text-muted-foreground">Leave empty to receive events from all boards.</p>
              {boardsLoading ? (
                <p className="text-xs text-muted-foreground">Loading boards…</p>
              ) : boards.length === 0 ? (
                <p className="text-xs text-muted-foreground">No boards in this organization yet.</p>
              ) : (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  {/* Selected boards as badges */}
                  {boardIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {boardIds.map(id => {
                        const board = boards.find(b => b.id === id);
                        return (
                          <Badge key={id} variant="secondary" className="gap-1 pr-1">
                            {board?.icon} {board?.name || id}
                            <button
                              type="button"
                              onClick={() => setBoardIds(prev => prev.filter(b => b !== id))}
                              className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  {/* Board checkboxes */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {boards.map(board => (
                      <button
                        key={board.id}
                        role="checkbox"
                        aria-checked={boardIds.includes(board.id)}
                        onClick={() => {
                          setBoardIds(prev =>
                            prev.includes(board.id)
                              ? prev.filter(id => id !== board.id)
                              : [...prev, board.id]
                          );
                        }}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors text-left ${
                          boardIds.includes(board.id)
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                          boardIds.includes(board.id) ? 'bg-primary border-primary' : 'border-border'
                        }`}>
                          {boardIds.includes(board.id) && <Check className="h-2 w-2 text-white" />}
                        </div>
                        <span className="truncate">{board.icon} {board.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {boardIds.length > 0 && (
                <p className="text-xs text-muted-foreground">{boardIds.length} board{boardIds.length !== 1 ? 's' : ''} selected</p>
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
