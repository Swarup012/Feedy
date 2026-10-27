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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { webhookService, Webhook, WebhookEvent, WebhookType } from '@/services/webhookService';
import { useBoards } from '@/hooks/useFeedbackData';
import { Copy, Check, X, ChevronDown } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const ALL_EVENTS: { value: WebhookEvent; label: string; category: string }[] = [
  { value: 'post.created',        label: 'Post Created',        category: 'post' },
  { value: 'post.updated',        label: 'Post Updated',        category: 'post' },
  { value: 'post.status_changed', label: 'Post Status Changed', category: 'post' },
  { value: 'post.deleted',        label: 'Post Deleted',        category: 'post' },
  { value: 'post.needs_attention', label: 'Post Needs Attention', category: 'post' },
  { value: 'comment.created',     label: 'Comment Created',     category: 'comment' },
  { value: 'vote.created',        label: 'Vote Added',          category: 'vote' },
  { value: 'board.created',       label: 'Board Created',       category: 'board' },
  { value: 'changelog.published', label: 'Changelog Published', category: 'changelog' },
  { value: 'user.identified',     label: 'User Identified',     category: 'user' },
  { value: 'autopilot.suggestion.created',  label: 'Suggestion Created',  category: 'autopilot' },
  { value: 'autopilot.suggestion.approved', label: 'Suggestion Approved', category: 'autopilot' },
  { value: 'autopilot.suggestion.rejected', label: 'Suggestion Rejected', category: 'autopilot' },
];

const EVENT_CATEGORIES = ['post', 'comment', 'vote', 'board', 'changelog', 'user', 'autopilot'];

const WEBHOOK_TYPES: { value: WebhookType; label: string }[] = [
  { value: 'custom', label: 'Custom' },
  { value: 'discord', label: 'Discord' },
  { value: 'slack', label: 'Slack' },
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
  const [type, setType] = useState<WebhookType | ''>('');
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
      setType('');
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
    if (!type) return toast({ title: 'Select a type', variant: 'destructive' });
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-lg font-semibold">
            {isEditing ? 'Edit Webhook' : 'Create Webhook'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update webhook configuration and event subscriptions.'
              : ''}
          </DialogDescription>
        </DialogHeader>

        {/* ── Secret Display (shown once after creation) ── */}
        {newSecret && (
          <div className="mx-5 mb-5 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-amber-700 dark:text-amber-400 font-semibold text-xs">
                🔑 Save your signing secret — it won&apos;t be shown again
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-md border px-2 py-1.5">
              <code className="text-xs font-mono flex-1 break-all select-all text-foreground">
                {newSecret}
              </code>
              <Button size="sm" variant="ghost" onClick={copySecret} className="shrink-0 h-6 w-6 p-0">
                {secretCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <Button onClick={handleDone} className="w-full" size="sm">
              I&apos;ve saved my secret — Done
            </Button>
          </div>
        )}

        {!newSecret && (
          <div className="space-y-4 px-5 pb-5">
            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor="wh-name" className="text-sm">Name <span className="text-red-500">*</span></Label>
              <Input
                id="wh-name"
                placeholder="e.g. Slack Notifications"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Type / Events / Boards */}
            <div className="grid grid-cols-3 gap-3">
              <Select value={type} onValueChange={v => setType(v as WebhookType)}>
                <SelectTrigger aria-label="Type" className="h-9 w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {WEBHOOK_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Events — selection popup */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    aria-label="Events"
                    className="h-9 w-full justify-between gap-1 px-3 font-normal"
                  >
                    <span className="truncate">
                      Events
                      {events.length > 0 && (
                        <span className="text-muted-foreground"> ({events.length})</span>
                      )}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 p-0">
                  <div className="max-h-[320px] overflow-y-auto p-3 space-y-3">
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
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                              allSelected
                                ? 'bg-primary border-primary'
                                : someSelected
                                ? 'bg-primary/30 border-primary'
                                : 'border-border group-hover:border-primary/50'
                            }`}>
                              {allSelected && <Check className="h-2 w-2 text-white" />}
                              {someSelected && !allSelected && <div className="w-1.5 h-1.5 bg-primary rounded-sm" />}
                            </div>
                            <span className="text-xs font-medium capitalize text-foreground">{category}</span>
                          </button>

                          {/* Events in this category */}
                          <div className="ml-5 grid grid-cols-2 gap-1">
                            {catEvents.map(event => (
                              <button
                                key={event.value}
                                role="checkbox"
                                aria-checked={events.includes(event.value)}
                                onClick={() => toggleEvent(event.value)}
                                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors text-left ${
                                  events.includes(event.value)
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                              >
                                <div className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${
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
                </PopoverContent>
              </Popover>

              {/* Boards — multi-select popup */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    aria-label="Boards"
                    className="h-9 w-full justify-between gap-1 px-3 font-normal"
                  >
                    <span className="truncate">
                      Boards
                      {boardIds.length > 0 && (
                        <span className="text-muted-foreground"> ({boardIds.length})</span>
                      )}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 p-0">
                  <div className="max-h-[320px] overflow-y-auto p-3 space-y-2">
                    {boardsLoading ? (
                      <p className="text-xs text-muted-foreground">Loading boards…</p>
                    ) : boards.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No boards in this organization yet.</p>
                    ) : (
                      <>
                        {/* Selected boards as badges */}
                        {boardIds.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {boardIds.map(id => {
                              const board = boards.find(b => b.id === id);
                              return (
                                <Badge key={id} variant="secondary" className="gap-1 pr-1 text-xs h-5">
                                  {board?.icon} {board?.name || id}
                                  <button
                                    type="button"
                                    onClick={() => setBoardIds(prev => prev.filter(b => b !== id))}
                                    className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        {/* Board checkboxes */}
                        <div className="grid grid-cols-2 gap-1">
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
                              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors text-left ${
                                boardIds.includes(board.id)
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              }`}
                            >
                              <div className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${
                                boardIds.includes(board.id) ? 'bg-primary border-primary' : 'border-border'
                              }`}>
                                {boardIds.includes(board.id) && <Check className="h-2 w-2 text-white" />}
                              </div>
                              <span className="truncate">{board.icon} {board.name}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* URL */}
            <div className="space-y-1">
              <Label htmlFor="wh-url" className="text-sm">
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
                className="h-9"
              />
              {type !== 'custom' && (
                <p className="text-xs text-muted-foreground">
                  {type === 'discord'
                    ? 'Discord channel → Edit → Integrations → Webhooks'
                    : 'Slack workspace → Apps → Incoming Webhooks'}
                </p>
              )}
            </div>

            {/* Description (optional) */}
            <div className="space-y-1">
              <Label htmlFor="wh-desc" className="text-sm">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="wh-desc"
                placeholder="What is this webhook used for?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
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
          <DialogFooter className="gap-2 px-5 pb-5 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving} size="sm">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving} size="sm">
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
