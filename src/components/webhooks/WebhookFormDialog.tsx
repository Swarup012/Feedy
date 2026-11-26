'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { webhookService, Webhook, WebhookEvent, WebhookType } from '@/services/webhookService';
import { useBoards } from '@/hooks/useFeedbackData';
import { Check, Copy, Loader2, X } from 'lucide-react';
import '../ui/dialog-forms.css';

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

// Display names differ from stored event-category values, which are a wire contract
const CATEGORY_DISPLAY_LABELS: Record<string, string> = { autopilot: 'Smartflow' };
const categoryLabel = (category: string) => CATEGORY_DISPLAY_LABELS[category] ?? category;

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
  const nameInputRef = useRef<HTMLInputElement>(null);

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
    if (!type) return toast({ title: 'Pick a delivery type', variant: 'destructive' });
    if (!name.trim()) return toast({ title: 'Name the webhook', variant: 'destructive' });
    if (!url.trim()) return toast({ title: 'Add an endpoint URL', variant: 'destructive' });
    if (events.length === 0) return toast({ title: 'Choose at least one event', variant: 'destructive' });

    setSaving(true);
    try {
      const boardIdsPayload = boardIds.length > 0 ? boardIds : null;
      if (isEditing && existing) {
        const updated = await webhookService.updateWebhook(existing.id, {
          name, url, type, events, board_ids: boardIdsPayload, description: description || null, is_active: isActive,
        });
        toast({ title: 'Webhook updated' });
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
        toast({ title: 'Webhook created' });
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

  const urlLabel = type === 'discord'
    ? 'Discord webhook URL'
    : type === 'slack'
    ? 'Slack incoming webhook URL'
    : 'Endpoint URL';

  const urlPlaceholder = type === 'discord'
    ? 'https://discord.com/api/webhooks/...'
    : type === 'slack'
    ? 'https://hooks.slack.com/services/...'
    : 'https://your-server.com/webhooks/faddy';

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent
        className="fd wh-dialog w-[640px] max-w-[calc(100vw-32px)] gap-0 border-0 bg-transparent p-0 shadow-none [&>button]:hidden"
        overlayClassName="bg-black/45"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          nameInputRef.current?.focus();
        }}
      >
        <div className="fd__shell">
          <header className="fd__head wh-head">
            <div className="fd__headtext">
              <DialogTitle className="fd__title wh-title">
                {isEditing ? 'Edit webhook' : 'New webhook'}
              </DialogTitle>
              <DialogDescription className="fd__lede wh-lede">
                {isEditing
                  ? 'Change where events go and what triggers them.'
                  : 'Send events to an endpoint you control.'}
              </DialogDescription>
            </div>
            <DialogClose type="button" className="fd__close wh-close" aria-label="Close">
              <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </DialogClose>
          </header>

          {newSecret ? (
            <div className="fd__body wh-secret-body">
              <div className="wh-secret">
                <div className="wh-secret__head">
                  <span className="wh-secret__title">Signing secret</span>
                  <span className="wh-secret__tag">Shown once</span>
                </div>
                <p className="wh-secret__note">
                  Copy it now. It will not be shown again.
                </p>
                <div className="wh-secret__row">
                  <code className="wh-secret__code">{newSecret}</code>
                  <button
                    type="button"
                    className="fd-btn fd-btn--quiet fd-btn--sm"
                    onClick={copySecret}
                  >
                    {secretCopied ? (
                      <Check className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    )}
                    {secretCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <button
                  type="button"
                  className="fd-btn fd-btn--primary wh-secret__done"
                  onClick={handleDone}
                >
                  Done, I saved it
                </button>
              </div>
            </div>
          ) : (
            <div className="fd__body wh-body">
              <div className="fd-field wh-field">
                <span className="fd-label wh-label" id="wh-delivery-label">
                  Delivery
                </span>
                <div
                  className="wh-types"
                  role="group"
                  aria-labelledby="wh-delivery-label"
                >
                  {WEBHOOK_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      className="wh-type"
                      aria-pressed={type === t.value}
                      onClick={() => setType(t.value)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wh-row">
                <div className="fd-field wh-field">
                  <label className="fd-label wh-label" htmlFor="wh-name">
                    Name
                  </label>
                  <input
                    id="wh-name"
                    ref={nameInputRef}
                    className="fd-input wh-input"
                    placeholder="Slack notifications"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>

                <div className="fd-field wh-field">
                  <label className="fd-label wh-label" htmlFor="wh-url">
                    {urlLabel}
                  </label>
                  <input
                    id="wh-url"
                    className="fd-input wh-url"
                    type="url"
                    inputMode="url"
                    placeholder={urlPlaceholder}
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    required
                    aria-required="true"
                  />
                  {type !== 'custom' && (
                    <p className="fd-help-single wh-help">
                      {type === 'discord'
                        ? 'Discord: channel settings, Integrations, Webhooks.'
                        : 'Slack: Apps, Incoming Webhooks.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="fd-field wh-field">
                <label className="fd-label wh-label" htmlFor="wh-desc">
                  Description <span className="wh-optional">(optional)</span>
                </label>
                <textarea
                  id="wh-desc"
                  className="fd-textarea wh-desc"
                  placeholder="What is this webhook used for?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {isEditing && (
                <div className="wh-active">
                  <div className="wh-active__text">
                    <span className="wh-active__title">Active</span>
                    <span className="wh-active__note">Pause or resume this webhook.</span>
                  </div>
                  <Switch
                    className="wh-switch"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    aria-label="Webhook active"
                  />
                </div>
              )}

              <div className="wh-events-block">
                <div className="wh-events-head">
                  <span className="fd-label wh-label" id="wh-events-label">
                    Events
                  </span>
                  <span className="wh-counter" aria-live="polite">
                    {events.length} selected
                    {events.length === 0 ? ' · pick at least one' : ''}
                  </span>
                </div>
                <div
                  className="wh-events"
                  role="group"
                  aria-labelledby="wh-events-label"
                >
                  {EVENT_CATEGORIES.map(category => {
                    const catEvents = ALL_EVENTS.filter(e => e.category === category);
                    const allSelected = catEvents.every(e => events.includes(e.value));

                    return (
                      <div
                        key={category}
                        className="wh-event-group"
                        role="group"
                        aria-labelledby={`wh-cat-${category}`}
                      >
                        <div className="wh-event-group__head">
                          <span className="wh-event-group__name" id={`wh-cat-${category}`}>
                            {categoryLabel(category)}
                          </span>
                          <button
                            type="button"
                            className="wh-event-all"
                            onClick={() => toggleCategory(category)}
                            aria-label={`${allSelected ? 'Clear' : 'Select'} all ${categoryLabel(category)} events`}
                          >
                            {allSelected ? 'Clear' : 'Select all'}
                          </button>
                        </div>
                        <div className="wh-event-list">
                          {catEvents.map(event => (
                            <label key={event.value} className="wh-event">
                              <input
                                type="checkbox"
                                checked={events.includes(event.value)}
                                onChange={() => toggleEvent(event.value)}
                              />
                              <span>{event.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="fd-field wh-field">
                <span className="fd-label wh-label">
                  Boards <span className="wh-optional">(optional)</span>
                </span>
                <p className="fd-help-single wh-help">Leave empty for every board.</p>
                {boardsLoading ? (
                  <p className="fd-help-single wh-help">Loading boards…</p>
                ) : boards.length === 0 ? (
                  <p className="fd-help-single wh-help">No boards in this organization yet.</p>
                ) : (
                  <div className="wh-boards">
                    {boards.map(board => (
                      <label key={board.id} className="wh-board">
                        <input
                          type="checkbox"
                          checked={boardIds.includes(board.id)}
                          onChange={() => {
                            setBoardIds(prev =>
                              prev.includes(board.id)
                                ? prev.filter(id => id !== board.id)
                                : [...prev, board.id]
                            );
                          }}
                        />
                        <span>{board.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!newSecret && (
            <footer className="fd__foot wh-foot">
              <button
                type="button"
                className="fd-btn fd-btn--quiet"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fd-btn fd-btn--primary fd-btn--commit"
                onClick={handleSubmit}
                disabled={saving}
                aria-busy={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />
                    Saving…
                  </>
                ) : isEditing ? (
                  'Save changes'
                ) : (
                  'Create webhook'
                )}
              </button>
            </footer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
