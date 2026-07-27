'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
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
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-8 overflow-y-auto px-4 py-8 sm:px-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="font-switzer text-2xl font-semibold tracking-tight">Feedback Autopilot</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Paste raw text from chats, emails, or reviews. AI detects feedback and queues a draft for
          your approval — nothing is published automatically.
        </p>
      </header>

      {/* Ingest */}
      <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Submit raw text
        </div>
        
        <Textarea
          value={ingestText}
          onChange={(e) => setIngestText(e.target.value)}
          placeholder="Paste a support chat export, email, review, or any raw text…"
          className="min-h-[140px] resize-y font-mono text-sm"
          disabled={ingesting}
        />
        <div className="flex justify-end">
          <Button onClick={handleIngest} disabled={ingesting || !ingestText.trim()}>
            {ingesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              'Run Autopilot'
            )}
          </Button>
        </div>
      </section>

      {/* Review queue */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Inbox className="h-4 w-4" />
            Review queue
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
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
          <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
            No {statusFilter === 'all' ? '' : statusFilter} suggestions yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {suggestions.map((s) => {
              const busy = actionId === s.id;
              const isPending = s.status === 'pending';
              return (
                <li
                  key={s.id}
                  className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <h2 className="font-switzer text-base font-semibold leading-snug">
                        {s.suggested_title || 'Untitled suggestion'}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(s.created_at)} ·{' '}
                        <span className="capitalize">{s.status}</span>
                      </p>
                    </div>
                  </div>

                  {s.suggested_body && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {s.suggested_body}
                    </p>
                  )}

                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer select-none hover:text-foreground">
                      View source text
                    </summary>
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted/60 p-3 font-mono">
                      {s.source_text}
                    </pre>
                  </details>

                  {s.possible_duplicate_post_id && (
                    <Link
                      href={`/admin/feedback?post=${s.possible_duplicate_post_id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Possible duplicate
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}

                  {isPending && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      <Select
                        value={approveBoardById[s.id] || ''}
                        onValueChange={(v) =>
                          setApproveBoardById((prev) => ({ ...prev, [s.id]: v }))
                        }
                        disabled={busy || boards.length === 0}
                      >
                        <SelectTrigger className="w-[220px]">
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
                      <Button
                        size="sm"
                        onClick={() => handleApprove(s)}
                        disabled={busy || !approveBoardById[s.id]}
                      >
                        {busy ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-1 h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(s)}
                        disabled={busy}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function AutopilotPage() {
  return (
    <ProtectedRoute>
      <AutopilotPageInner />
    </ProtectedRoute>
  );
}
