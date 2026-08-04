'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PaidFeatureGate } from '@/components/PaidFeatureGate';
import { useOrganization } from '@/context/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { boardService, type Board } from '@/services/boardService';
import {
  autopilotService,
  type AutopilotSuggestion,
  type AutopilotSuggestionStatus,
  type AutopilotSettings,
} from '@/services/autopilotService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bot,
  Check,
  Loader2,
  X,
  ExternalLink,
  Inbox,
  Sparkles,
} from 'lucide-react';

type StatusFilter = AutopilotSuggestionStatus | 'all';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function AutopilotPageInner() {
  const { organization, loading: orgLoading } = useOrganization();
  const { toast } = useToast();
  const orgId = organization?.id;

  const [ingestText, setIngestText] = useState('');
  const [ingesting, setIngesting] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [suggestions, setSuggestions] = useState<AutopilotSuggestion[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [boards, setBoards] = useState<Board[]>([]);
  const [approveBoardById, setApproveBoardById] = useState<Record<string, string>>({});
  const [actionId, setActionId] = useState<string | null>(null);

  const loadSuggestions = useCallback(async () => {
    if (!orgId) return;
    setLoadingList(true);
    try {
      const res = await autopilotService.listSuggestions(orgId, statusFilter);
      setSuggestions(res.data?.suggestions || []);
    } catch (err: any) {
      toast({
        title: 'Failed to load suggestions',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingList(false);
    }
  }, [orgId, statusFilter, toast]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  useEffect(() => {
    (async () => {
      try {
        const res = await boardService.getAllBoards();
        setBoards(res.data?.boards || []);
      } catch {
        // Boards needed only for approve — non-fatal
      }
    })();
  }, []);

  const handleIngest = async () => {
    if (!orgId || !ingestText.trim()) return;
    setIngesting(true);
    try {
      const res = await autopilotService.ingest(orgId, ingestText.trim());
      if (res.data?.discarded) {
        toast({
          title: 'No feedback detected',
          description: 'The text did not contain a feature request, bug, or product feedback.',
        });
      } else if (res.data?.automatic) {
        toast({
          title: 'Post Published',
          description: 'Automatic Mode is enabled. The suggestion was instantly published.',
        });
        setIngestText('');
        if (statusFilter === 'approved' || statusFilter === 'all') {
          await loadSuggestions();
        } else {
          setStatusFilter('approved');
        }
      } else {
        toast({
          title: 'Suggestion queued',
          description: 'A pending suggestion was created for review.',
        });
        setIngestText('');
        if (statusFilter === 'pending' || statusFilter === 'all') {
          await loadSuggestions();
        } else {
          setStatusFilter('pending');
        }
      }
    } catch (err: any) {
      toast({
        title: 'Ingest failed',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setIngesting(false);
    }
  };

  const handleApprove = async (suggestion: AutopilotSuggestion) => {
    if (!orgId) return;
    const boardId = approveBoardById[suggestion.id];
    if (!boardId) {
      toast({
        title: 'Select a board',
        description: 'Choose which board to publish this suggestion to.',
        variant: 'destructive',
      });
      return;
    }
    setActionId(suggestion.id);
    try {
      await autopilotService.approve(orgId, suggestion.id, boardId);
      toast({ title: 'Approved', description: 'Post created on the selected board.' });
      await loadSuggestions();
    } catch (err: any) {
      toast({
        title: 'Approve failed',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (suggestion: AutopilotSuggestion) => {
    if (!orgId) return;
    setActionId(suggestion.id);
    try {
      await autopilotService.reject(orgId, suggestion.id);
      toast({ title: 'Rejected', description: 'Suggestion marked as rejected.' });
      await loadSuggestions();
    } catch (err: any) {
      toast({
        title: 'Reject failed',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setActionId(null);
    }
  };

  if (orgLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        Select an organization to use Autopilot.
      </div>
    );
  }

  return (
    <PaidFeatureGate featureName="Autopilot">
    <div className="mx-auto h-full max-w-6xl overflow-y-auto px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="mb-6 space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-switzer text-lg font-semibold tracking-tight">Autopilot</h1>
            <p className="text-sm text-muted-foreground">
              Paste raw text from chats, emails, or reviews. AI detects feedback and queues a draft for your approval.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        {/* Left: Submit */}
        <section className="rounded-xl border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden lg:sticky lg:top-6">
          <div className="px-5 py-4 border-b bg-muted/30">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Submit feedback
            </div>
            <p className="text-xs text-muted-foreground mt-1">Paste a support chat, email, review, or any raw text.</p>
          </div>
          <div className="p-5 space-y-4">
            <Textarea
              value={ingestText}
              onChange={(e) => setIngestText(e.target.value)}
              placeholder="e.g. &quot;I wish the dashboard had a dark mode toggle...&quot;"
              className="min-h-[200px] resize-y text-sm leading-relaxed focus-visible:ring-0"
              disabled={ingesting}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {ingestText.trim() ? `${ingestText.trim().split(/\s+/).length} words` : 'Nothing to analyze yet'}
              </p>
              <Button onClick={handleIngest} disabled={ingesting || !ingestText.trim()} className="gap-2">
                {ingesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Run Autopilot
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Right: Review queue */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Review queue</h2>
              {!loadingList && suggestions.length > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{suggestions.length}</span>
              )}
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingList ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Inbox className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No {statusFilter === 'all' ? '' : statusFilter} suggestions yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Submit text on the left to get started
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {suggestions.map((s) => {
                const busy = actionId === s.id;
                const isPending = s.status === 'pending';
                return (
                  <li
                    key={s.id}
                    className="rounded-xl border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2.5">
                            <h3 className="font-switzer text-base font-semibold leading-snug">
                              {s.suggested_title || 'Untitled suggestion'}
                            </h3>
                            <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              s.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : s.status === 'rejected'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            }`}>
                              {s.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(s.created_at)}
                          </p>
                        </div>
                      </div>

                      {s.suggested_body && (
                        <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                          {s.suggested_body}
                        </p>
                      )}

                      <details className="mt-3 text-xs text-muted-foreground">
                        <summary className="cursor-pointer select-none hover:text-foreground transition-colors">
                          View source text
                        </summary>
                        <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/50 border p-3 font-mono text-[11px] leading-relaxed">
                          {s.source_text}
                        </pre>
                      </details>

                      {s.possible_duplicate_post_id && (
                        <Link
                          href={`/admin/feedback?post=${s.possible_duplicate_post_id}`}
                          className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-primary hover:underline"
                        >
                          Possible duplicate
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>

                    {isPending && (
                      <div className="border-t bg-muted/20 px-5 py-3.5 flex flex-wrap items-center gap-2.5">
                        <Select
                          value={approveBoardById[s.id] || ''}
                          onValueChange={(v) =>
                            setApproveBoardById((prev) => ({ ...prev, [s.id]: v }))
                          }
                          disabled={busy || boards.length === 0}
                        >
                          <SelectTrigger className="w-[200px] h-9 text-xs">
                            <SelectValue
                              placeholder={boards.length ? 'Select board…' : 'No boards'}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {boards.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 ml-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(s)}
                            disabled={busy}
                            className="gap-1.5 h-8"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(s)}
                            disabled={busy || !approveBoardById[s.id]}
                            className="gap-1.5 h-8"
                          >
                            {busy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Approve
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
    </PaidFeatureGate>
  );
}

export default function AutopilotPage() {
  return (
    <ProtectedRoute>
      <AutopilotPageInner />
    </ProtectedRoute>
  );
}
