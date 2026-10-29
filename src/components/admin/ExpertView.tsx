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
  Bot,
  AlertTriangle,
  FileText,
  Users,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';
import { RevenuePanel } from '@/components/admin/RevenuePanel';

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

const SUMMARY_CARD_LABELS = ['High-severity posts', 'Pending review', 'Ingested by Smartflow', 'Approval rate'];

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
   Range pills — rendered in the page header, shared here
====================================================== */

export function RangePills({
  range,
  onChange,
}: {
  range: ExpertRange;
  onChange: (r: ExpertRange) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          aria-pressed={range === r.value}
          onClick={() => onChange(r.value)}
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
  );
}

/* ======================================================
   Skeleton
====================================================== */

function ExpertSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-[108px] rounded-xl" />
        <Skeleton className="h-[108px] rounded-xl" />
        <Skeleton className="h-[108px] rounded-xl" />
        <Skeleton className="h-[108px] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
      <Card className="flex flex-col">
        <CardContent className="flex flex-1 flex-col justify-center py-8 text-center">
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
    <Card className="flex flex-col border-primary/20 bg-primary/5">
      <CardContent className="flex flex-1 flex-col py-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            AI Briefing
          </span>
        </div>
        <p className="text-sm text-foreground leading-relaxed mt-3">{summary}</p>
        {caption && (
          <span className="mt-auto pt-4 text-xs text-muted-foreground">{caption}</span>
        )}
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
function NeedsAttentionPanel({ posts }: { posts: TopSeverePost[] }) {
  const router = useRouter();

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mb-2.5">
          <CheckCircle2 className="h-5 w-5 text-success" />
        </div>
        <p className="text-sm font-semibold text-foreground">All clear</p>
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

/* Panel — Autopilot Pipeline Health */
function AutopilotPipelinePanel({
  autopilot,
  loadFailed,
}: {
  autopilot: AutopilotStats;
  loadFailed: boolean;
}) {
  const router = useRouter();

  const tiles = [
    { label: 'Ingested', value: autopilot.ingested, tone: 'text-foreground' },
    { label: 'Pending review', value: autopilot.pending, tone: 'text-warning' },
    { label: 'Approved', value: autopilot.approved, tone: 'text-success' },
    { label: 'Rejected', value: autopilot.rejected, tone: 'text-foreground' },
  ];

  return (
    <div className="flex flex-1 flex-col gap-5">
      {loadFailed ? (
        <LoadFailedNote />
      ) : (
        <div className="grid grid-cols-4 divide-x divide-border">
          {tiles.map((t) => (
            <div key={t.label} className="px-2 text-center">
              <div className={`text-2xl font-bold tabular-nums ${t.tone}`}>{t.value}</div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">{t.label}</div>
            </div>
          ))}
        </div>
      )}
      <Button
        variant="outline"
        className="mt-auto w-full h-9 gap-2 font-medium"
        onClick={() => router.push('/admin/autopilot')}
      >
        <Bot className="h-4 w-4" />
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
  /* Controlled mode: range lives in the page header (RangePills).
     Omitted props keep the legacy standalone behavior (internal toolbar). */
  range?: ExpertRange;
  onRangeChange?: (r: ExpertRange) => void;
}

export function ExpertView({
  organizationId,
  range: rangeProp,
  onRangeChange,
}: ExpertViewProps) {
  const { organization } = useOrganization();
  const router = useRouter();
  const [internalRange, setInternalRange] = useState<ExpertRange>('30d');
  const controlled = rangeProp !== undefined;
  const range = rangeProp ?? internalRange;
  const [stats, setStats] = useState<ExpertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setRange = (r: ExpertRange) => {
    if (controlled) onRangeChange?.(r);
    else setInternalRange(r);
  };

  const load = async (r: ExpertRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/dashboard/expert-stats', { params: { range: r } });
      setStats(res.data?.data || res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load expert stats');
    } finally {
      setLoading(false);
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
      {/* Range pills — only when the header does not own them */}
      {!controlled && (
        <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
          <RangePills range={range} onChange={setRange} />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-300 shrink-0 mb-4">
          {error} — showing last known data if available.
        </div>
      )}

      <div className="grid gap-4">
        {/* Row 1: summary cards */}
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
                label="Ingested by Smartflow"
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

        {/* Row 2: AI Briefing + Needs attention */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BriefingPanel
            summary={briefing?.summary ?? null}
            briefingRange={briefing?.range}
            generatedAt={briefing?.generated_at}
          />

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
                <NeedsAttentionPanel posts={stats?.topSeverePosts || []} />
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
        </div>

        {/* Row 3: Autopilot pipeline + Customers to watch */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={Bot}
                title="Smartflow pipeline"
                description={`Ingestion and review, last ${rangeDays} days`}
                iconColor="bg-progress/10 text-progress"
              />
            </CardHeader>
            <CardContent className="pt-0 flex flex-col">
              <AutopilotPipelinePanel autopilot={autopilot} loadFailed={loadFailed} />
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

        {/* Row 4: Revenue — fetched separately (own effect, post-first-paint)
            so a slow/failing revenue call never blanks the dashboard */}
        <RevenuePanel />
      </div>
    </div>
  );
}
