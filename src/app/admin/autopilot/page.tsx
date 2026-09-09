'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PaidFeatureGate } from '@/components/PaidFeatureGate';
import { useOrganization } from '@/context/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { isPlanUpgradeRequired } from '@/lib/api';
import { boardService, type Board } from '@/services/boardService';
import {
  autopilotService,
  type AutopilotSuggestion,
  type AutopilotSuggestionStatus,
  type AutopilotSettings,
} from '@/services/autopilotService';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Check,
  Loader2,
  X,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { WIDE_CONTAINER } from '@/lib/layout-constants';

type StatusFilter = AutopilotSuggestionStatus | 'all';

const TAB_LIST: { key: StatusFilter; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const SOURCE_DOT: Record<string, string> = {
  intercom: 'bg-indigo-500',
  github: 'bg-slate-500',
  discord: 'bg-violet-500',
};

const EMPTY_MESSAGES: Record<StatusFilter, { bold: string; muted: string }> = {
  pending: { bold: 'Nothing pending', muted: 'Submit text on the left to get started.' },
  approved: { bold: 'Nothing approved yet', muted: 'Approved drafts will show up here.' },
  rejected: { bold: 'Nothing dismissed yet', muted: 'Dismissed drafts will show up here.' },
  all: { bold: 'No suggestions yet', muted: 'Submit text on the left to get started.' },
};

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
      const res = await autopilotService.listSuggestions(orgId, 'all');
      setSuggestions(res.data?.suggestions || []);
    } catch (err: any) {
      if (!isPlanUpgradeRequired(err)) {
        toast({
          title: 'Failed to load suggestions',
          description: err?.response?.data?.message || err.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoadingList(false);
    }
  }, [orgId, toast]);

  const filteredSuggestions = statusFilter === 'all'
    ? suggestions
    : suggestions.filter((s) => s.status === statusFilter);

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

  const empty = EMPTY_MESSAGES[statusFilter] || EMPTY_MESSAGES.all;

  return (
    <PaidFeatureGate featureName="Autopilot">
    <div className={`${WIDE_CONTAINER} h-full flex flex-col py-6 bg-background`}>
      {/* Header */}
      <header className="shrink-0 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-switzer text-lg font-semibold tracking-tight">Autopilot</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste raw text from chats, emails, or reviews. AI detects feedback and queues a draft for your approval.
            </p>
          </div>
          <Link href="/admin/organization?tab=integrations">
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Connect apps
            </Button>
          </Link>
        </div>
        <div className="mt-5 h-px w-full bg-border" />
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 gap-0 items-start overflow-hidden">
        {/* Right: Queue (scrollable) */}
        <section className="overflow-y-auto max-h-[calc(100vh-10rem)]">
          {/* Tabs */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="flex items-center gap-0">
              {TAB_LIST.map((tab) => {
                const isActive = statusFilter === tab.key;
                const count = tab.key === 'all'
                  ? suggestions.length
                  : suggestions.filter((s) => s.status === tab.key).length;
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground/70'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">{count}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List */}
          <div className="mt-4">
            {loadingList ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSuggestions.length === 0 ? (
              <div className="py-12">
                <p className="text-sm font-semibold">{empty.bold}</p>
                <p className="mt-1 text-xs text-muted-foreground">{empty.muted}</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filteredSuggestions.map((s) => {
                  const busy = actionId === s.id;
                  const isPending = s.status === 'pending';
                  const dotColor = SOURCE_DOT[s.source || ''] || 'bg-slate-400';
                  return (
                    <li key={s.id} className="group py-4">
                      <div className="flex items-start gap-3">
                        {/* Dot */}
                        <span className={`mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full ${dotColor}`} />

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {s.source && (
                              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                {s.source}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-0.5 text-sm font-semibold leading-snug">
                            {s.suggested_title || 'Untitled suggestion'}
                          </h3>
                          {s.suggested_body && (
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-1">
                              {s.suggested_body}
                            </p>
                          )}
                          {s.possible_duplicate_post_id && (
                            <Link
                              href={`/admin/feedback?post=${s.possible_duplicate_post_id}`}
                              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              Possible duplicate
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}

                          {/* Source text expandable */}
                          <details className="mt-2 text-xs text-muted-foreground">
                            <summary className="cursor-pointer select-none hover:text-foreground transition-colors">
                              View source text
                            </summary>
                            <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/50 border p-3 font-mono text-[11px] leading-relaxed">
                              {s.source_text}
                            </pre>
                          </details>

                          {/* Board select + actions (pending only) */}
                          {isPending && (
                            <div className="mt-3 flex flex-wrap items-center gap-2.5">
                              <Select
                                value={approveBoardById[s.id] || ''}
                                onValueChange={(v) =>
                                  setApproveBoardById((prev) => ({ ...prev, [s.id]: v }))
                                }
                                disabled={busy || boards.length === 0}
                              >
                                <SelectTrigger className="w-[200px] h-8 text-xs">
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
                            </div>
                          )}
                        </div>

                        {/* Timestamp + row actions */}
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                            {formatDate(s.created_at)}
                          </span>
                          <div className="flex items-center gap-3">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleReject(s)}
                                  disabled={busy}
                                  className="text-xs text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
                                >
                                  Dismiss
                                </button>
                                <button
                                  onClick={() => handleApprove(s)}
                                  disabled={busy || !approveBoardById[s.id]}
                                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50"
                                >
                                  {busy ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    'Approve'
                                  )}
                                </button>
                              </>
                            ) : s.status === 'approved' ? (
                              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                                <Check className="h-3 w-3" />
                                Approved
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                <X className="h-3 w-3" />
                                Dismissed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
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
