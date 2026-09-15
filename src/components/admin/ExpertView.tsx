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
  TrendingDown,
  Minus,
  Bot,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Users,
  ArrowRight,
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

const SEVERITY_CONFIG: Record<string, { variant: 'destructive' | 'warning' | 'secondary'; label: string }> = {
  high: { variant: 'destructive', label: 'HIGH' },
  medium: { variant: 'warning', label: 'MED' },
  low: { variant: 'secondary', label: 'LOW' },
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

function DirectionIcon({ direction }: { direction: 'up' | 'down' | 'flat' }) {
  if (direction === 'up') return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (direction === 'down') return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

/* ======================================================
   Skeleton
====================================================== */

function ExpertSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2 shrink-0">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
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

/* Panel — Weekly Briefing (full-width) */
function BriefingPanel({ summary }: { summary: string | null }) {
  if (!summary) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">No briefing yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your first briefing generates next Monday.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-sm text-foreground leading-relaxed">{summary}</p>
      </CardContent>
    </Card>
  );
}

/* Panel — Needs Attention (high-severity posts) */
function NeedsAttentionPanel({ posts }: { posts: TopSeverePost[] }) {
  const router = useRouter();

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-medium text-foreground">Nothing urgent</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
          High-severity posts will appear here.
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
          className="w-full flex items-center gap-2 rounded-lg bg-red-50/70 dark:bg-red-950/20 px-3 py-2.5 text-left hover:bg-red-100/70 dark:hover:bg-red-950/30 transition-colors"
        >
          <span className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">
            {p.title}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={SEVERITY_CONFIG[p.severity]?.variant || 'secondary'} className="text-[10px] px-1.5 py-0">
              {SEVERITY_CONFIG[p.severity]?.label || p.severity}
            </Badge>
            <span className="text-[11px] text-muted-foreground">{p.upvotes + p.comment_count}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
          </div>
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

  return (
    <div className="space-y-2">
      {trends.map((t) => (
        <div key={t.classification} className="flex items-center gap-2">
          <DirectionIcon direction={t.direction} />
          <span className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">
            {humanize(t.classification)}
          </span>
          <span className="text-[11px] text-muted-foreground w-8 text-right">
            {t.thisPeriodCount}
          </span>
          <span className={`text-[11px] w-10 text-right ${
            t.direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
            t.direction === 'down' ? 'text-red-600 dark:text-red-400' :
            'text-muted-foreground'
          }`}>
            {t.direction === 'up' ? '+' : ''}{t.delta}
          </span>
        </div>
      ))}
    </div>
  );
}

/* Panel — Autopilot Pipeline Health */
function AutopilotPipelinePanel({ autopilot }: { autopilot: AutopilotStats }) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
          <div className="text-2xl font-bold text-foreground">{autopilot.ingested}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Ingested</div>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{autopilot.pending}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Pending review</div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Approved: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{autopilot.approved}</span></span>
        <span>Rejected: <span className="font-semibold text-red-600 dark:text-red-400">{autopilot.rejected}</span></span>
      </div>
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

/* Panel — Customers to Watch (full-width table) */
function CustomersToWatchPanel({ customers }: { customers: CustomerToWatch[] }) {
  const router = useRouter();

  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">No customers to watch</p>
          <p className="text-xs text-muted-foreground mt-1">
            End users with high-severity posts will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <PanelHeader
          icon={Users}
          title="Customers to Watch"
          description="End users with the highest-severity posts"
          iconColor="bg-orange-100 text-orange-600"
        />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-lg border">
          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b">
            <span>Customer</span>
            <span>Post</span>
            <span className="text-center">Severity</span>
            <span className="text-right">Engagement</span>
          </div>
          {customers.map((c) => (
            <button
              key={c.userId}
              onClick={() => router.push('/admin/users')}
              className="w-full grid grid-cols-[1fr_1fr_auto_auto] gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0"
            >
              <span className="min-w-0 text-xs font-medium text-foreground truncate">
                {c.userName || c.userEmail || c.userExternalId || 'Anonymous'}
              </span>
              <span className="min-w-0 text-xs text-muted-foreground truncate">
                {c.postTitle}
              </span>
              <Badge variant={SEVERITY_CONFIG[c.severity]?.variant || 'secondary'} className="text-[10px] px-1.5 py-0 shrink-0">
                {SEVERITY_CONFIG[c.severity]?.label || c.severity}
              </Badge>
              <span className="text-[11px] text-muted-foreground text-right shrink-0">
                {c.upvotes + c.comment_count}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
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
  const [range, setRange] = useState<ExpertRange>('30d');
  const [stats, setStats] = useState<ExpertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);

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

  const rangeLabel = RANGES.find((r) => r.value === range)?.label || range;
  const briefingSummary = organization?.weekly_briefing?.summary ?? null;

  return (
    <div className="flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-end gap-2 mb-4 shrink-0">
        <div className="relative">
          <button
            onClick={() => setRangeOpen(!rangeOpen)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-accent transition-colors"
          >
            {rangeLabel}
            {rangeOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {rangeOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setRangeOpen(false)} />
              <div className="absolute right-0 mt-1 z-50 w-28 rounded-lg border border-border bg-background shadow-md overflow-hidden">
                {RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => { setRange(r.value); setRangeOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                      range === r.value
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
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
        {/* Row 1: Weekly Briefing (full-width) */}
        <BriefingPanel summary={briefingSummary} />

        {/* Row 2: Needs Attention + Trending Themes + Autopilot Pipeline (3-col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={AlertTriangle}
                title="Needs Attention"
                description="High-severity posts"
                iconColor="bg-red-100 text-red-600"
              />
            </CardHeader>
            <CardContent className="pt-0 flex-1">
              <NeedsAttentionPanel posts={stats?.topSeverePosts || []} />
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={TrendingUp}
                title="Trending Themes"
                description="Classification trends this period"
                iconColor="bg-blue-100 text-blue-600"
              />
            </CardHeader>
            <CardContent className="pt-0 flex-1">
              <TrendingThemesPanel trends={stats?.classificationTrends || []} />
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={Bot}
                title="Autopilot Pipeline"
                description="Ingestion and review status"
                iconColor="bg-indigo-100 text-indigo-600"
              />
            </CardHeader>
            <CardContent className="pt-0 flex-1">
              <AutopilotPipelinePanel autopilot={stats?.autopilot || { ingested: 0, approved: 0, rejected: 0, pending: 0, approvalRate: null, byPlatform: {}, byStatus: {} }} />
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Customers to Watch (full-width table) */}
        <CustomersToWatchPanel customers={stats?.customersToWatch || []} />
      </div>
    </div>
  );
}
