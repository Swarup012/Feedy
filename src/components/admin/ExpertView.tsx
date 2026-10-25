'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/context/OrganizationContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  Bot,
  AlertTriangle,
  RefreshCw,
  FileText,
  Users,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';

/* ======================================================
   Types
====================================================== */

export type ExpertRange = '7d' | '30d' | '90d';

interface TopSeverePost {
  id: string;
  title: string;
  severity: string;
  upvotes: number;
  comment_count: number;
  board_id: string;
  created_at: string;
}

interface ClassificationTrend {
  classification: string;
  thisPeriodCount: number;
  lastPeriodCount: number;
  delta: number;
  direction: 'up' | 'down' | 'flat';
}

interface AutopilotStats {
  ingested: number;
  approved: number;
  rejected: number;
  pending: number;
  approvalRate: number | null;
  byPlatform: Record<string, number>;
  byStatus: Record<string, number>;
}

interface CustomerToWatch {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userExternalId: string | null;
  postId: string;
  postTitle: string;
  severity: string;
  upvotes: number;
  comment_count: number;
}

interface ExpertStats {
  range: ExpertRange;
  topSeverePosts: TopSeverePost[];
  classificationTrends: ClassificationTrend[];
  autopilot: AutopilotStats;
  customersToWatch: CustomerToWatch[];
  cached?: boolean;
}

/* ======================================================
   Constants
====================================================== */

const RANGES: { value: ExpertRange; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

const RANGE_DAYS: Record<ExpertRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

const SUMMARY_CARD_LABELS = ['High-severity posts', 'Pending review', 'Ingested by Autopilot', 'Approval rate'];

const SEVERITY_CONFIG: Record<string, { variant: 'destructive' | 'warning' | 'secondary'; label: string }> = {
  high: { variant: 'destructive', label: 'HIGH' },
  medium: { variant: 'warning', label: 'MED' },
  low: { variant: 'secondary', label: 'LOW' },
};

const SEVERITY_DOT: Record<string, string> = {
  high: 'bg-destructive',
  medium: 'bg-warning',
  low: 'bg-muted-foreground/50',
};

const EMPTY_AUTOPILOT: AutopilotStats = {
  ingested: 0,
  approved: 0,
  rejected: 0,
  pending: 0,
  approvalRate: null,
  byPlatform: {},
  byStatus: {},
};

/* ======================================================
   Small helpers
====================================================== */

function humanize(key: string) {
  return (key || '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

/**
 * Format an ISO timestamp as an explicit UTC date, never local time.
 * e.g. "Oct 14, 09:00 UTC". Returns null when the input is missing or invalid.
 */
export function formatGeneratedAt(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date);
  return `${formatted} UTC`;
}

/**
 * Briefing caption. Built ONLY from the briefing's own stored range and
 * generated_at — never from the selected 7d/30d/90d range. Missing parts
 * are omitted; an empty string means no caption.
 */
export function buildBriefingCaption(range?: string | null, generatedAt?: string | null): string {
  const parts: string[] = [];
  if (range === '7d') parts.push('Last 7 days · updated daily');
  const generated = formatGeneratedAt(generatedAt);
  if (generated) parts.push(`Generated ${generated}`);
  return parts.join(' · ');
}

/**
 * High-severity post count for the summary card. The API caps the list at 5,
 * so 5 or more renders as "5+".
 */
export function highSeverityCountLabel(count: number): string {
  return count >= 5 ? '5+' : String(count);
}

/** Approval rate display: null (no decisions yet) renders as an em dash. */
export function approvalRateLabel(rate: number | null): string {
  return rate === null ? '—' : `${rate}%`;
}

/* ======================================================
   Skeleton
====================================================== */

function ExpertSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      {/* ponytail: h-32 straddles briefing (~106px) vs no-briefing (~146px);
          gate on weekly_briefing presence if this ±22px shift ever matters */}
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-[108px] rounded-xl" />
        <Skeleton className="h-[108px] rounded-xl" />
        <Skeleton className="h-[108px] rounded-xl" />
        <Skeleton className="h-[108px] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

/* ======================================================
   Panel components
====================================================== */

function PanelHeader({ icon: Icon, title, description, iconColor }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${iconColor || 'bg-primary/10 text-primary'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <CardTitle className="text-[15px] font-medium tracking-tight text-foreground">
          {title}
        </CardTitle>
        <CardDescription className="text-[13px] mt-0.5 text-muted-foreground">
          {description}
        </CardDescription>
      </div>
    </div>
  );
}

/* Card — one number for the summary row */
function SummaryCard({ label, value, sub, subTone = 'muted' }: {
  label: string;
  value: string;
  sub: string;
  subTone?: 'muted' | 'success';
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold text-foreground leading-none">{value}</p>
      <p className={`text-xs ${subTone === 'success' ? 'font-medium text-success' : 'text-muted-foreground'}`}>
        {sub}
      </p>
    </div>
  );
}

/* Panel — AI Briefing (full-width hero) */
function BriefingPanel({ summary, briefingRange, generatedAt }: {
  summary: string | null;
  briefingRange?: string | null;
  generatedAt?: string | null;
}) {
  const caption = buildBriefingCaption(briefingRange, generatedAt);

  if (!summary) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">No briefing yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your first briefing will appear after the next daily run.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                AI Briefing
              </span>
              {caption && (
                <span className="text-xs text-muted-foreground">{caption}</span>
              )}
            </div>
            <p className="text-sm text-foreground leading-relaxed mt-1.5">{summary}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* Neutral placeholder shown in place of good-news empty states when the request failed */
function LoadFailedNote() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <p className="text-sm font-medium text-muted-foreground">Couldn&apos;t load data</p>
    </div>
  );
}

/* Panel — Needs Attention (high-severity posts) */
function NeedsAttentionPanel({ posts, rangeDays }: { posts: TopSeverePost[]; rangeDays: number }) {
  const router = useRouter();

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mb-2.5">
          <CheckCircle2 className="h-5 w-5 text-success" />
        </div>
        <p className="text-sm font-semibold text-foreground">All clear</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
          No high-severity posts in the last {rangeDays} days. They will show up
          here as soon as one appears.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((p) => (
        <button
          key={p.id}
          onClick={() => router.push(`/admin/feedback?post=${p.id}`)}
          className="w-full flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-left hover:bg-accent/60 transition-colors"
        >
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${SEVERITY_DOT[p.severity] || 'bg-muted-foreground/50'}`}
            aria-hidden="true"
          />
          <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
            {p.title}
          </span>
          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
            {p.upvotes + p.comment_count}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        </button>
      ))}
    </div>
  );
}

/* Panel — Trending Themes (classification trends) */
function TrendingThemesPanel({ trends }: { trends: ClassificationTrend[] }) {
  if (trends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-medium text-foreground">No trends yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
          Classification trends will appear once posts are categorized.
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...trends.map((t) => t.thisPeriodCount), 1);

  return (
    <div className="space-y-3.5">
      {trends.map((t) => {
        const chipClass =
          t.direction === 'up'
            ? 'bg-success/10 text-success'
            : t.direction === 'down'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-muted text-muted-foreground';
        const deltaLabel =
          t.direction === 'up' ? `+${t.delta}` : t.direction === 'down' ? `${t.delta}` : '0';

        return (
          <div key={t.classification} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
                {humanize(t.classification)}
              </span>
              <span className="text-sm font-semibold text-foreground w-8 text-right tabular-nums">
                {t.thisPeriodCount}
              </span>
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${chipClass}`}>
                {deltaLabel}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max((t.thisPeriodCount / maxCount) * 100, 3)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Panel — Autopilot Pipeline Health */
function AutopilotPipelinePanel({
  autopilot,
  loadFailed,
}: {
  autopilot: AutopilotStats;
  loadFailed: boolean;
}) {
  const router = useRouter();

  const decided = autopilot.approved + autopilot.pending + autopilot.rejected;
  const tiles = [
    { label: 'Ingested', value: autopilot.ingested, tone: 'text-foreground' },
    { label: 'Pending review', value: autopilot.pending, tone: 'text-warning' },
    { label: 'Approved', value: autopilot.approved, tone: 'text-success' },
    { label: 'Rejected', value: autopilot.rejected, tone: 'text-foreground' },
  ];

  return (
    <div className="space-y-4">
      {loadFailed ? (
        <LoadFailedNote />
      ) : (
        <>
          {decided > 0 && (
            <div
              className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`Pipeline: ${autopilot.approved} approved, ${autopilot.pending} pending, ${autopilot.rejected} rejected`}
            >
              <div className="bg-success" style={{ width: `${(autopilot.approved / decided) * 100}%` }} />
              <div className="bg-warning" style={{ width: `${(autopilot.pending / decided) * 100}%` }} />
              <div className="bg-destructive" style={{ width: `${(autopilot.rejected / decided) * 100}%` }} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-lg bg-muted/50 px-3 py-3 text-center">
                <div className={`text-2xl font-bold ${t.tone}`}>{t.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{t.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => router.push('/admin/autopilot')}
      >
        <Bot className="h-3.5 w-3.5 mr-1.5" />
        Review queue
      </Button>
    </div>
  );
}

/* Panel — Customers to Watch (table) */
function CustomersToWatchPanel({ customers }: { customers: CustomerToWatch[] }) {
  const router = useRouter();

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-medium text-foreground">No customers to watch</p>
        <p className="text-xs text-muted-foreground mt-1">
          End users with high-severity posts will appear here.
        </p>
      </div>
    );
  }

  const columns = 'grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto_auto] gap-3 items-center';

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[440px]">
        <div className={`${columns} px-1 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border`}>
          <span>Customer</span>
          <span>Top post</span>
          <span className="text-center">Severity</span>
          <span className="text-right">Engagement</span>
          <span className="w-4" aria-hidden="true" />
        </div>
        {customers.map((c) => {
          const name = c.userName || c.userEmail || c.userExternalId || 'Anonymous';
          return (
            <button
              key={c.userId}
              onClick={() => router.push('/admin/users')}
              className={`${columns} w-full px-1 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0">
                  {getInitials(name)}
                </span>
                <span className="min-w-0 text-sm font-medium text-foreground truncate">
                  {name}
                </span>
              </span>
              <span className="min-w-0 text-sm text-muted-foreground truncate">
                {c.postTitle}
              </span>
              <Badge
                variant={SEVERITY_CONFIG[c.severity]?.variant || 'secondary'}
                className="text-[10px] px-1.5 py-0 shrink-0"
              >
                {SEVERITY_CONFIG[c.severity]?.label || c.severity}
              </Badge>
              <span className="text-xs text-muted-foreground text-right shrink-0 tabular-nums">
                {c.upvotes + c.comment_count}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ======================================================
   Expert View — main component
====================================================== */

interface ExpertViewProps {
  organizationId?: string;
}

export function ExpertView({ organizationId }: ExpertViewProps) {
  const { organization } = useOrganization();
  const router = useRouter();
  const [range, setRange] = useState<ExpertRange>('30d');
  const [stats, setStats] = useState<ExpertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (r: ExpertRange, showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/dashboard/expert-stats', { params: { range: r } });
      setStats(res.data?.data || res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load expert stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  if (loading && !stats) {
    return <ExpertSkeleton />;
  }

  const rangeDays = RANGE_DAYS[range];
  const briefing = organization?.weekly_briefing;
  const loadFailed = stats === null;
  const highSeverityCount = stats?.topSeverePosts?.length ?? 0;
  const autopilot = stats?.autopilot ?? EMPTY_AUTOPILOT;

  return (
    <div className="flex flex-col">
      {/* Range pills + refresh */}
      <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={range === r.value}
              onClick={() => setRange(r.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                range === r.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 shrink-0"
          onClick={() => load(range, true)}
          disabled={refreshing}
          title="Refresh"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-300 shrink-0 mb-4">
          {error} — showing last known data if available.
        </div>
      )}

      <div className="grid gap-4">
        {/* Row 1: AI Briefing (full-width) */}
        <BriefingPanel
          summary={briefing?.summary ?? null}
          briefingRange={briefing?.range}
          generatedAt={briefing?.generated_at}
        />

        {/* Row 2: summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loadFailed ? (
            SUMMARY_CARD_LABELS.map((label) => (
              <SummaryCard key={label} label={label} value="—" sub="Couldn't load" subTone="muted" />
            ))
          ) : (
            <>
              <SummaryCard
                label="High-severity posts"
                value={highSeverityCountLabel(highSeverityCount)}
                sub={highSeverityCount === 0 ? 'Nothing urgent' : `High-severity in the last ${rangeDays} days`}
                subTone={highSeverityCount === 0 ? 'success' : 'muted'}
              />
              <SummaryCard
                label="Pending review"
                value={String(autopilot.pending)}
                sub={autopilot.pending === 0 ? 'Queue is clear' : 'Waiting for your action'}
                subTone={autopilot.pending === 0 ? 'success' : 'muted'}
              />
              <SummaryCard
                label="Ingested by Autopilot"
                value={String(autopilot.ingested)}
                sub={`In the last ${rangeDays} days`}
              />
              <SummaryCard
                label="Approval rate"
                value={approvalRateLabel(autopilot.approvalRate)}
                sub={
                  autopilot.approvalRate === null
                    ? 'No decisions yet'
                    : `${autopilot.approved} approved · ${autopilot.rejected} rejected`
                }
              />
            </>
          )}
        </div>

        {/* Row 3: Needs attention + Autopilot pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          <Card className="flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={AlertTriangle}
                title="Needs attention"
                description="High-severity posts, most engaged first"
                iconColor="bg-destructive/10 text-destructive"
              />
            </CardHeader>
            <CardContent className="pt-0 flex-1">
              {loadFailed ? (
                <LoadFailedNote />
              ) : (
                <NeedsAttentionPanel posts={stats?.topSeverePosts || []} rangeDays={rangeDays} />
              )}
            </CardContent>
            <div className="px-6 pb-6 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/feedback')}
              >
                View all feedback
              </Button>
            </div>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={Bot}
                title="Autopilot pipeline"
                description={`Ingestion and review, last ${rangeDays} days`}
                iconColor="bg-progress/10 text-progress"
              />
            </CardHeader>
            <CardContent className="pt-0 flex-1">
              <AutopilotPipelinePanel autopilot={autopilot} loadFailed={loadFailed} />
            </CardContent>
          </Card>
        </div>

        {/* Row 4: Trending themes + Customers to watch */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
          <Card className="flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={TrendingUp}
                title="Trending themes"
                description="Posts by classification vs previous period"
                iconColor="bg-primary/10 text-primary"
              />
            </CardHeader>
            <CardContent className="pt-0 flex-1">
              <TrendingThemesPanel trends={stats?.classificationTrends || []} />
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={Users}
                title="Customers to watch"
                description="End users with the most severe posts"
                iconColor="bg-warning/10 text-warning"
              />
            </CardHeader>
            <CardContent className="pt-0 flex-1">
              {loadFailed ? (
                <LoadFailedNote />
              ) : (
                <CustomersToWatchPanel customers={stats?.customersToWatch || []} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
