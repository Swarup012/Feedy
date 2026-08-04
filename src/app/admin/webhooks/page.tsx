'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { webhookService, Webhook } from '@/services/webhookService';
import { WebhookFormDialog } from '@/components/webhooks/WebhookFormDialog';
import { WebhookDeliveryLogs } from '@/components/webhooks/WebhookDeliveryLogs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Webhook as WebhookIcon,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  Key,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Zap,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function typeLabel(type: string) {
  return { custom: 'Custom', discord: 'Discord', slack: 'Slack' }[type] ?? type;
}

function typeBadgeColor(type: string) {
  return {
    custom:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    discord: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    slack:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }[type] ?? 'bg-muted text-muted-foreground';
}

function successRate(webhook: Webhook) {
  if (!webhook.total_deliveries) return null;
  const success = webhook.total_deliveries - webhook.failed_deliveries;
  return Math.round((success / webhook.total_deliveries) * 100);
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─────────────────────────────────────────────────────────────
// Webhook Card
// ─────────────────────────────────────────────────────────────

interface WebhookCardProps {
  webhook: Webhook;
  onEdit: (w: Webhook) => void;
  onDelete: (w: Webhook) => void;
  onTest: (w: Webhook) => void;
  onToggle: (w: Webhook) => void;
  onRegenerateKey: (w: Webhook) => void;
}

function WebhookCard({ webhook, onEdit, onDelete, onTest, onToggle, onRegenerateKey }: WebhookCardProps) {
  const [showLogs, setShowLogs] = useState(false);
  const rate = successRate(webhook);

  return (
    <div className={`rounded-xl border bg-card transition-all ${
      webhook.is_active ? 'border-border' : 'border-border/50 opacity-60'
    }`}>
      {/* Card Header */}
      <div className="flex items-start gap-4 p-5">
        {/* Status dot */}
        <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
          webhook.is_active ? 'bg-green-500 shadow-sm shadow-green-400' : 'bg-gray-400'
        }`} />

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground text-base leading-tight">{webhook.name}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadgeColor(webhook.type)}`}>
              {typeLabel(webhook.type)}
            </span>
            {webhook.is_verified && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground font-mono truncate">{webhook.url}</p>

          {webhook.description && (
            <p className="text-xs text-muted-foreground">{webhook.description}</p>
          )}

          {/* Event pills */}
          <div className="flex flex-wrap gap-1.5">
            {webhook.events.map(e => (
              <span key={e} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {e}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-0.5">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {webhook.total_deliveries} deliveries
            </span>
            {webhook.failed_deliveries > 0 && (
              <span className="flex items-center gap-1 text-red-500">
                <XCircle className="h-3 w-3" />
                {webhook.failed_deliveries} failed
              </span>
            )}
            {rate !== null && (
              <span className={rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-amber-600' : 'text-red-500'}>
                {rate}% success rate
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last triggered: {timeAgo(webhook.last_triggered_at)}
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active toggle */}
          <Switch
            checked={webhook.is_active}
            onCheckedChange={() => onToggle(webhook)}
            aria-label={webhook.is_active ? 'Disable webhook' : 'Enable webhook'}
          />

          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onTest(webhook)} className="gap-2">
                <Send className="h-4 w-4" /> Test Delivery
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(webhook)} className="gap-2">
                <Edit className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRegenerateKey(webhook)} className="gap-2">
                <Key className="h-4 w-4" /> Regenerate Secret
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(webhook)}
                className="gap-2 text-red-600 dark:text-red-400 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delivery Logs Toggle */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowLogs(v => !v)}
          className="w-full flex items-center justify-between px-5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <span>Delivery Logs</span>
          {showLogs ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {showLogs && (
          <div className="px-5 pb-5 pt-2">
            <WebhookDeliveryLogs webhookId={webhook.id} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Regenerate Secret Dialog
// ─────────────────────────────────────────────────────────────

interface RegenerateSecretDialogProps {
  open: boolean;
  webhookName: string;
  newSecret: string | null;
  onClose: () => void;
}

function RegenerateSecretDialog({ open, webhookName, newSecret, onClose }: RegenerateSecretDialogProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!newSecret) return;
    await navigator.clipboard.writeText(newSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AlertDialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>New Signing Secret — {webhookName}</AlertDialogTitle>
          <AlertDialogDescription>
            Your new signing secret is shown below. <strong>Save it now</strong> — it will not be shown again.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {newSecret && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3 space-y-2">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-md border px-3 py-2">
              <code className="text-xs font-mono flex-1 break-all select-all">{newSecret}</code>
              <Button size="sm" variant="ghost" onClick={copy} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Update your server to use this new secret for signature verification.
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>I&apos;ve saved my secret — Done</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function WebhooksPage() {
  const { toast } = useToast();

  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Webhook | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Regenerate secret
  const [regenSecret, setRegenSecret] = useState<string | null>(null);
  const [regenWebhookName, setRegenWebhookName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await webhookService.listWebhooks();
      setWebhooks(data);
    } catch {
      toast({ title: 'Failed to load webhooks', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (webhook: Webhook) => {
    setWebhooks(prev => {
      const idx = prev.findIndex(w => w.id === webhook.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = webhook;
        return next;
      }
      return [webhook, ...prev];
    });
  };

  const handleToggle = async (webhook: Webhook) => {
    try {
      const updated = await webhookService.updateWebhook(webhook.id, { is_active: !webhook.is_active });
      handleSaved(updated);
      toast({ title: updated.is_active ? '✅ Webhook enabled' : '⏸️ Webhook disabled' });
    } catch {
      toast({ title: 'Failed to update webhook', variant: 'destructive' });
    }
  };

  const handleTest = async (webhook: Webhook) => {
    setTestingId(webhook.id);
    try {
      const result = await webhookService.testWebhook(webhook.id);
      toast({
        title: result.success
          ? `✅ Test delivery successful (HTTP ${result.response_status})`
          : `❌ Test delivery failed — HTTP ${result.response_status ?? 'N/A'}`,
        description: result.error_message ?? undefined,
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (err: any) {
      toast({ title: 'Test failed', description: err?.response?.data?.message, variant: 'destructive' });
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await webhookService.deleteWebhook(deleteTarget.id);
      setWebhooks(prev => prev.filter(w => w.id !== deleteTarget.id));
      toast({ title: '🗑️ Webhook deleted' });
      setDeleteTarget(null);
    } catch {
      toast({ title: 'Failed to delete webhook', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleRegenerateKey = async (webhook: Webhook) => {
    try {
      const result = await webhookService.regenerateSecret(webhook.id);
      setRegenWebhookName(webhook.name);
      setRegenSecret(result.new_secret);
    } catch {
      toast({ title: 'Failed to regenerate secret', variant: 'destructive' });
    }
  };

  return (
    <ProtectedRoute allowedRoles={['owner', 'admin']}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-5 py-5 space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <WebhookIcon className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-semibold tracking-tight">Webhooks</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Send real-time HTTP notifications to external services when events happen in your organization.
            </p>
          </div>
          <Button onClick={() => { setEditingWebhook(null); setFormOpen(true); }} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Add Webhook
          </Button>
        </div>

        {/* Info bar */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
          <WebhookIcon className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <strong>Supported events:</strong> post.created, post.updated, post.status_changed, post.deleted, comment.created, vote.created, board.created, changelog.published.
            {' '}Webhooks are signed with HMAC-SHA256 — verify the <code className="font-mono text-xs bg-blue-100 dark:bg-blue-900/40 px-1 rounded">X-Faddy-Signature</code> header.
          </div>
        </div>

        {/* Webhook list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl border bg-card animate-pulse" />
            ))}
          </div>
        ) : webhooks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border flex flex-col items-center justify-center py-10 gap-4">
            <WebhookIcon className="h-8 w-8 text-muted-foreground/30" />
            <div className="text-center">
              <p className="font-medium text-foreground">No webhooks yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first webhook to start receiving real-time event notifications.</p>
            </div>
            <Button onClick={() => { setEditingWebhook(null); setFormOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Create your first webhook
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map(webhook => (
              <WebhookCard
                key={webhook.id}
                webhook={webhook}
                onEdit={w => { setEditingWebhook(w); setFormOpen(true); }}
                onDelete={setDeleteTarget}
                onTest={handleTest}
                onToggle={handleToggle}
                onRegenerateKey={handleRegenerateKey}
              />
            ))}
          </div>
        )}

        {/* Create / Edit Dialog */}
        <WebhookFormDialog
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditingWebhook(null); }}
          onSaved={handleSaved}
          existing={editingWebhook}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
                All delivery logs will be permanently removed. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? 'Deleting…' : 'Delete Webhook'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Regenerate Secret Dialog */}
        <RegenerateSecretDialog
          open={!!regenSecret}
          webhookName={regenWebhookName}
          newSecret={regenSecret}
          onClose={() => setRegenSecret(null)}
        />
      </div>
    </ProtectedRoute>
  );
}
