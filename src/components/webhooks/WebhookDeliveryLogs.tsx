'use client';

import { useState, useEffect, useCallback } from 'react';
import { webhookService, WebhookDelivery } from '@/services/webhookService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';

interface WebhookDeliveryLogsProps {
  webhookId: string;
}

function statusBadge(status: WebhookDelivery['status']) {
  switch (status) {
    case 'success':
      return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" />Success</Badge>;
    case 'failed':
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
    case 'retrying':
      return <Badge variant="warning" className="gap-1"><RefreshCw className="h-3 w-3" />Retrying</Badge>;
    default:
      return <Badge variant="pending" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
  }
}

function formatEventType(event: string) {
  return event.replace('.', ' › ').replace(/_/g, ' ');
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function WebhookDeliveryLogs({ webhookId }: WebhookDeliveryLogsProps) {
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await webhookService.listDeliveries(webhookId, {
        page,
        limit: 15,
        status: statusFilter || undefined,
      });
      setDeliveries(res.deliveries);
      setTotal(res.total);
    } catch {
      toast({ title: 'Failed to load delivery logs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [webhookId, page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleRetry = async (webhookId: string, deliveryId: string) => {
    setRetryingId(deliveryId);
    try {
      const result = await webhookService.retryDelivery(webhookId, deliveryId);
      toast({ title: result.success ? '✅ Retry successful' : '❌ Retry failed — will try again later' });
      load();
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || 'Retry failed', variant: 'destructive' });
    } finally {
      setRetryingId(null);
    }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-3">
      {/* Filter + Refresh */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2" role="group" aria-label="Filter by status">
          {(['', 'success', 'failed', 'retrying'] as const).map(s => (
            <button
              key={s}
              role="radio"
              aria-checked={statusFilter === s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={load} className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Delivery list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No deliveries yet</p>
          <p className="text-xs mt-1">Deliveries will appear here after webhook events are triggered.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {deliveries.map(d => (
            <div key={d.id} className="rounded-lg border border-border overflow-hidden">
              {/* Row summary */}
              <div
                role="button"
                tabIndex={0}
                aria-expanded={expandedId === d.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(expandedId === d.id ? null : d.id); } }}
              >
                <div className="shrink-0">{statusBadge(d.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground capitalize">
                    {formatEventType(d.event_type)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {timeAgo(d.created_at)}
                    {d.response_time_ms != null && ` · ${d.response_time_ms}ms`}
                    {d.attempt_number > 1 && ` · Attempt ${d.attempt_number}/${d.max_attempts}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {d.response_status && (
                    <Badge
                      variant={d.response_status >= 200 && d.response_status < 300 ? 'success' : 'destructive'}
                      className="text-xs font-mono px-2 py-0.5"
                    >
                      HTTP {d.response_status}
                    </Badge>
                  )}
                  {(d.status === 'failed') && d.attempt_number < d.max_attempts && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={e => { e.stopPropagation(); handleRetry(webhookId, d.id); }}
                      disabled={retryingId === d.id}
                    >
                      <RotateCcw className="h-3 w-3" />
                      {retryingId === d.id ? 'Retrying…' : 'Retry'}
                    </Button>
                  )}
                  {expandedId === d.id
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === d.id && (
                <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-3 text-xs font-mono">
                  {d.error_message && (
                    <div>
                      <div className="text-muted-foreground mb-1 font-sans font-medium text-xs">Error</div>
                      <div className="text-red-600 dark:text-red-400">{d.error_message}</div>
                    </div>
                  )}
                  {d.next_retry_at && (
                    <div>
                      <div className="text-muted-foreground mb-1 font-sans font-medium text-xs">Next Retry</div>
                      <div className="text-foreground">{new Date(d.next_retry_at).toLocaleString()}</div>
                    </div>
                  )}
                  {d.request_body && (
                    <div>
                      <div className="text-muted-foreground mb-1 font-sans font-medium text-xs">Request Body</div>
                      <pre className="text-foreground bg-background rounded p-2 overflow-x-auto text-xs max-h-48">
                        {JSON.stringify(d.request_body, null, 2)}
                      </pre>
                    </div>
                  )}
                  {d.response_body && (
                    <div>
                      <div className="text-muted-foreground mb-1 font-sans font-medium text-xs">Response Body</div>
                      <pre className="text-foreground bg-background rounded p-2 overflow-x-auto text-xs max-h-48">
                        {d.response_body}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">{total} deliveries total</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
