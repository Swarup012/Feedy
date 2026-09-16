'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PaidFeatureGate } from '@/components/PaidFeatureGate';
import { useOrganization } from '@/context/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { isPlanUpgradeRequired } from '@/lib/api';
import { resolvePlan } from '@/config/plans';
import api from '@/lib/api';
import { boardService, type Board } from '@/services/boardService';
import {
  autopilotService,
  type AutopilotSuggestion,
  type AutopilotSuggestionStatus,
  type AutopilotSettings,
} from '@/services/autopilotService';
import { intercomService } from '@/services/intercomService';
import { discordService } from '@/services/discordService';
import { slackService } from '@/services/slackService';
import { githubService } from '@/services/githubService';
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
import { INTEGRATION_BRAND_COLORS, type IntegrationProvider } from '@/components/admin/integration-brands';

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

const INTEGRATION_PROVIDERS: {
  key: IntegrationProvider;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  startConnect: (orgId: string) => void;
}[] = [
  {
    key: 'discord',
    name: 'Discord',
    icon: ({ className }) => <img src="/images/icons/discord.svg" alt="Discord" className={className} />,
    startConnect: (orgId) => discordService.startConnect(orgId),
  },
  {
    key: 'intercom',
    name: 'Intercom',
    icon: ({ className }) => <img src="/images/icons/intercom.svg" alt="Intercom" className={className} />,
    startConnect: (orgId) => intercomService.startConnect(orgId),
  },
  {
    key: 'slack',
    name: 'Slack',
    icon: ({ className }) => <img src="/images/icons/slack-new.svg" alt="Slack" className={className} />,
    startConnect: (orgId) => slackService.startConnect(orgId),
  },
  {
    key: 'github',
    name: 'GitHub',
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    startConnect: (orgId) => githubService.startConnect(orgId),
  },
];

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
  const [connectedProviders, setConnectedProviders] = useState<Set<IntegrationProvider>>(new Set());
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);

  const currentPlan = resolvePlan(organization);
  const isStarter = currentPlan === 'starter';

  const [rawText, setRawText] = useState('');
  const [rawAuthor, setRawAuthor] = useState('');
  const [rawBoardId, setRawBoardId] = useState('');
  const [trackedUsers, setTrackedUsers] = useState<{ id: string; display_name: string | null; email: string | null }[]>([]);
  const [submittingRaw, setSubmittingRaw] = useState(false);

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

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      setLoadingIntegrations(true);
      try {
        const [intercomRes, discordRes, slackRes, githubRes] = await Promise.all([
          intercomService.getStatus(orgId).catch(() => null),
          discordService.getStatus(orgId).catch(() => null),
          slackService.getStatus(orgId).catch(() => null),
          githubService.getStatus(orgId).catch(() => null),
        ]);
        const connected = new Set<IntegrationProvider>();
        if (intercomRes?.data?.status === 'active') connected.add('intercom');
        if (discordRes?.data?.status === 'active') connected.add('discord');
        if (slackRes?.data?.status === 'active') connected.add('slack');
        if (githubRes?.data?.status === 'active') connected.add('github');
        setConnectedProviders(connected);
      } catch {
        // Non-fatal — worst case we show the empty state
      } finally {
        setLoadingIntegrations(false);
      }
    })();
  }, [orgId]);

  // Fetch tracked users for the username dropdown
  useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        const billingPeriod = new Date().toISOString().slice(0, 7);
        const res = await api.get(`/api/organizations/${orgId}/tracked-users`, {
          params: { billing_period: billingPeriod, limit: 100 },
        });
        const users = res.data?.data?.users || res.data?.users || [];
        setTrackedUsers(users);
      } catch {
        // Non-fatal
      }
    })();
  }, [orgId]);

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

  const handleSubmitRaw = async () => {
    if (!orgId || !rawText.trim()) return;
    if (!rawBoardId) {
      toast({ title: 'Select a board', description: 'Choose which board to submit this feedback to.', variant: 'destructive' });
      return;
    }
    setSubmittingRaw(true);
    try {
      const metadata: { submitter_name?: string } = {};
      if (rawAuthor.trim()) {
        metadata.submitter_name = rawAuthor.trim();
      }
      const res = await autopilotService.ingest(orgId, rawText, metadata, rawBoardId);
      if (res.data?.discarded) {
        toast({ title: 'Not feedback', description: res.data.reason || 'Text did not contain actionable feedback.', variant: 'destructive' });
      } else {
        toast({ title: 'Post created', description: 'Feedback has been posted to the selected board.' });
        setRawText('');
        setRawAuthor('');
        setRawBoardId('');
        await loadSuggestions();
      }
    } catch (err: any) {
      toast({
        title: 'Submit failed',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setSubmittingRaw(false);
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

  const hasConnectedIntegrations = connectedProviders.size > 0;
  const starterLimitReached = isStarter && connectedProviders.size >= 1;

  if (!loadingIntegrations && !hasConnectedIntegrations) {
    return (
      <PaidFeatureGate featureName="Autopilot">
      <div className={`${WIDE_CONTAINER} h-full flex flex-col py-6 bg-background`}>
        <header className="shrink-0 mb-6">
          <h1 className="font-switzer text-xl font-semibold tracking-tight">Get Started with Autopilot</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect your support tools and let Autopilot find feedback for you 🧠.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
            {INTEGRATION_PROVIDERS.map((provider) => {
              const Icon = provider.icon;
              return (
                <button
                  key={provider.key}
                  type="button"
                  onClick={() => provider.startConnect(orgId)}
                  className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                >
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${INTEGRATION_BRAND_COLORS[provider.key]}15` }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {provider.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </header>
      </div>
      </PaidFeatureGate>
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
              Approve manually or enable automatic review.
            </p>
          </div>
          <Link href="/admin/organization?tab=integrations">
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Connect apps
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-[1.5fr_1fr] gap-6 items-start overflow-hidden">
        {/* Left: Queue (scrollable) */}
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

        {/* Right: Raw text submission */}
        <section className="flex flex-col gap-4 rounded-xl border bg-card p-5">
          <div>
            <h2 className="text-sm font-semibold">Submit Feedback</h2>
            <p className="text-xs text-muted-foreground mt-1">Paste raw text and submit as feedback from a tracked user.</p>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste your feedback text here..."
            className="flex min-h-[120px] w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />

          <div className="flex gap-2">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-medium text-muted-foreground">Author</label>
              <input
                type="text"
                value={rawAuthor}
                onChange={(e) => setRawAuthor(e.target.value)}
                placeholder="Tracked user or custom..."
                className="flex h-9 w-full rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                list="tracked-users-list"
              />
              <datalist id="tracked-users-list">
                {trackedUsers.map((u) => (
                  <option key={u.id} value={u.display_name || u.email || ''}>{u.display_name || u.email || ''}</option>
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-medium text-muted-foreground">Board</label>
              <Select value={rawBoardId} onValueChange={setRawBoardId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select board…" />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {rawAuthor.trim() ? `Posting as "${rawAuthor.trim()}"` : 'Leave empty to post as yourself'}
          </p>

          <Button
            size="sm"
            onClick={handleSubmitRaw}
            disabled={!rawText.trim() || !rawBoardId || submittingRaw}
            className="w-full"
          >
            {submittingRaw ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit
          </Button>
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
