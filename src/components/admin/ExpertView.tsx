'use client';

import { useEffect, useState } from 'react';
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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Globe,
  Bot,
  Clock,
  Gauge,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';

/* ======================================================
   Types (mirror the backend /api/dashboard/expert-stats)
====================================================== */

export type ExpertRange = '7d' | '30d' | '90d';

interface SourceBreakdown {
  bySource: Record<string, number>;
  byPlatform: Record<string, number>;
  total: number;
}

interface ClusterTrendEntry {
  cluster_key: string;
  label: string;
  current: number;
  previous: number;
  delta: number;
  pct: number;
}

interface TrendingData {
  weeks: string[];
  rising: ClusterTrendEntry[];
  shrinking: ClusterTrendEntry[];
}

interface NeedsAttentionEntry {
  cluster_key: string;
  label: string;
  severity: string;
  postCount: number;
  upvotes: number;
  comments: number;
  distinctUsers: number;
  impactScore: number;
}

interface ClusterTrends {
  trending: TrendingData;
  needsAttention: NeedsAttentionEntry[];
}

interface AutopilotStats {
  approved: number;
  rejected: number;
  pending: number;
  approvalRate: number | null;
  byPlatform: Record<string, number>;
  byStatus: Record<string, number>;
}

interface BoardVelocity {
  board_id: string;
  board_name: string;
  count: number;
  avgDays: number | null;
}

interface TimeToResolution {
  count: number;
  overallAvgDays: number | null;
  byBoard: BoardVelocity[];
  column: string | null;
}

interface EngagementGapEntry {
  cluster_key: string;
  label: string;
  postCount: number;
  upvotes: number;
  comments: number;
  engagement: number;
  resolvedCount: number;
  resolutionRate: number;
  gapScore: number;
}

interface ExpertStats {
  range: ExpertRange;
  sourceBreakdown: SourceBreakdown;
  clusterTrends: ClusterTrends;
  autopilot: AutopilotStats;
  timeToResolution: TimeToResolution;
  engagementGap: EngagementGapEntry[];
  cached?: boolean;
}

/* ======================================================
   Constants
====================================================== */

const SOURCE_META: Record<string, { label: string; color: string }> = {
  web: { label: 'Web Portal', color: '#3b82f6' },
  widget: { label: 'Widget', color: '#8b5cf6' },
  autopilot: { label: 'Autopilot', color: '#10b981' },
  api: { label: 'API', color: '#f59e0b' },
};

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  discord: { label: 'Discord', color: '#5865F2' },
  slack: { label: 'Slack', color: '#E01E5A' },
  intercom: { label: 'Intercom', color: '#1F8DED' },
};

const RANGES: { value: ExpertRange; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

/* ======================================================
   Small helpers
====================================================== */

function humanize(key: string) {
  return (key || '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function TrendChip({ value }: { value: number }) {
  const isUp = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        isUp
          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
          : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
      }`}
    >
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isUp ? '+' : ''}
      {value}%
    </span>
  );
}

/* ======================================================
   Skeleton
====================================================== */

function ExpertSkeleton() {
  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0">
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ======================================================
   Panel components
====================================================== */

function PanelHeader({ icon: Icon, title, description, right }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-2 shrink-0">
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5 shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
            {title}
          </CardTitle>
          <CardDescription className="text-[11px] mt-0.5 text-muted-foreground">
            {description}
          </CardDescription>
        </div>
      </div>
      {right}
    </div>
  );
}

/* Panel 1a — Cluster / theme trends (rising vs shrinking) */
function ClusterTrendsPanel({ trends }: { trends: TrendingData }) {
  const hasData = trends.rising.length > 0 || trends.shrinking.length > 0;
  return (
    <div className="space-y-3">
      {hasData ? (
        <>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-1.5">
              Rising
            </p>
            <div className="space-y-2">
              {trends.rising.map((t) => (
                <div key={`r-${t.cluster_key}`} className="flex items-center gap-2">
                  <span className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">
                    {t.label}
                  </span>
                  <TrendChip value={t.pct} />
                  <span className="text-[11px] text-muted-foreground w-8 text-right">
                    {t.current}
                  </span>
                </div>
              ))}
              {trends.rising.length === 0 && (
                <p className="text-[11px] text-muted-foreground">No clusters grew last week</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 mb-1.5">
              Shrinking
            </p>
            <div className="space-y-2">
              {trends.shrinking.map((t) => (
                <div key={`s-${t.cluster_key}`} className="flex items-center gap-2">
                  <span className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">
                    {t.label}
                  </span>
                  <TrendChip value={t.pct} />
                  <span className="text-[11px] text-muted-foreground w-8 text-right">
                    {t.current}
                  </span>
                </div>
              ))}
              {trends.shrinking.length === 0 && (
                <p className="text-[11px] text-muted-foreground">No clusters shrank last week</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Gauge className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium text-foreground">No theme movement yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
            Clusters with at least 2 posts this period will appear here with
            week-over-week growth.
          </p>
        </div>
      )}
    </div>
  );
}

/* Panel 1b — Needs Attention (high-severity clusters) */
function NeedsAttentionPanel({ entries }: { entries: NeedsAttentionEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-medium text-foreground">Nothing urgent right now</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
          High-severity clusters will appear here sorted by impact score.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div key={e.cluster_key} className="flex items-center gap-2">
          <span className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">
            {e.label}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
              HIGH
            </span>
            <span className="text-[11px] text-muted-foreground w-8 text-right">
              {e.postCount}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Panel 2 — Feedback source breakdown (donut + legend) */
function SourcePanel({ breakdown }: { breakdown: SourceBreakdown }) {
  const sourceData = Object.entries(breakdown.bySource).map(([key, value]) => ({
    name: SOURCE_META[key]?.label || humanize(key),
    value,
    color: SOURCE_META[key]?.color || '#94a3b8',
  }));
  const platformData = Object.entries(breakdown.byPlatform).map(([key, value]) => ({
    name: PLATFORM_META[key]?.label || humanize(key),
    value,
    color: PLATFORM_META[key]?.color || '#94a3b8',
  }));
  const hasAutopilot = breakdown.byPlatform && Object.keys(breakdown.byPlatform).length > 0;
  const total = breakdown.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sourceData}
                dataKey="value"
                nameKey="name"
                innerRadius={38}
                outerRadius={56}
                paddingAngle={2}
                strokeWidth={0}
              >
                {sourceData.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value} posts`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {sourceData.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="flex-1 min-w-0 text-xs text-muted-foreground truncate">{s.name}</span>
              <span className="text-xs font-medium text-foreground">{s.value}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1 border-t mt-1">
            <span className="text-xs font-semibold text-foreground">Total</span>
            <span className="ml-auto text-xs font-semibold text-foreground">{total}</span>
          </div>
        </div>
      </div>

      {hasAutopilot && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Autopilot by platform
          </p>
          <div className="flex flex-wrap gap-2">
            {platformData.map((p) => (
              <Badge key={p.name} variant="secondary" className="gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                {p.name} · {p.value}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Panel 3 — Autopilot performance */
function AutopilotPanel({ autopilot }: { autopilot: AutopilotStats }) {
  const decided = autopilot.approved + autopilot.rejected;
  const rate = autopilot.approvalRate;
  const gaugeColor = rate === null ? '#94a3b8' : rate >= 60 ? '#10b981' : rate >= 40 ? '#f59e0b' : '#ef4444';
  const platformData = Object.entries(autopilot.byPlatform).map(([key, value]) => ({
    name: PLATFORM_META[key]?.label || humanize(key),
    value,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={gaugeColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(rate ?? 0) * 2.64} 264`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-lg font-bold text-foreground leading-none">{rate ?? '–'}</span>
            <span className="text-[9px] text-muted-foreground mt-0.5">% appr.</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Approved</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{autopilot.approved}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Rejected</span>
            <span className="font-semibold text-red-600 dark:text-red-400">{autopilot.rejected}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Pending</span>
            <span className="font-semibold text-muted-foreground">{autopilot.pending}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Decided</span>
            <span className="font-semibold text-foreground">{decided}</span>
          </div>
        </div>
      </div>
      {platformData.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Volume by platform
          </p>
          <div className="space-y-1.5">
            {platformData.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-20 truncate">{p.name}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((p.value / Math.max(...platformData.map((x) => x.value), 1)) * 100, 100)}%`,
                      background: PLATFORM_META[p.name.toLowerCase()]?.color || '#10b981',
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium text-foreground w-6 text-right">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Panel 4 — Time to resolution */
function VelocityPanel({ velocity }: { velocity: TimeToResolution }) {
  const hasData = velocity.count > 0;
  return (
    <div className="space-y-3">
      {hasData ? (
        <>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground leading-none">
                {velocity.overallAvgDays !== null ? velocity.overallAvgDays : '–'}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">avg days to Done</div>
            </div>
            <div className="flex-1 text-[11px] text-muted-foreground leading-snug">
              Across <span className="font-semibold text-foreground">{velocity.count}</span> completed
              post{velocity.count === 1 ? '' : 's'} in range
            </div>
          </div>
          {velocity.byBoard.length > 0 && (
            <div className="pt-2 border-t space-y-1.5">
              {velocity.byBoard.slice(0, 4).map((b) => (
                <div key={b.board_id} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-28 truncate">
                    {b.board_name}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{
                        width: `${Math.min(
                          (b.avgDays ?? 0) / Math.max(...velocity.byBoard.map((x) => x.avgDays ?? 0), 1) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-foreground w-8 text-right">
                    {b.avgDays !== null ? `${b.avgDays}d` : '–'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium text-foreground">No resolved posts yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
            Once posts move to Done, we'll show average time from creation to completion.
          </p>
        </div>
      )}
    </div>
  );
}

/* Panel 5 — Engagement vs resolution gap */
function GapPanel({ gap }: { gap: EngagementGapEntry[] }) {
  if (gap.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertTriangle className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-medium text-foreground">Nothing flagged</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
          Clusters with high votes/comments but low resolution rates appear here.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {gap.map((g) => (
        <div key={g.cluster_key} className="flex items-center gap-2">
          <span className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">
            {g.label}
          </span>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0">
            <span className="flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3 text-amber-500" />
              {g.engagement}
            </span>
            <span className="w-12 text-right">
              <span className={g.resolutionRate >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                {g.resolutionRate}%
              </span>{' '}
              done
            </span>
          </div>
        </div>
      ))}
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

  return (
    <div className="h-full flex flex-col gap-4 min-h-0">
      {/* Range selector */}
      <div className="flex items-center justify-between shrink-0">
        <p className="text-xs text-muted-foreground">
          Deeper operational analytics for your organization
        </p>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-border bg-background p-1 shadow-sm">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  range === r.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
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
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-300 shrink-0">
          {error} — showing last known data if available.
        </div>
      )}

      <div className="flex-1 min-h-0 grid grid-rows-[1fr_auto] lg:grid-rows-[3fr_2fr] gap-4 overflow-hidden">
        {/* Top: cluster trends (35%) + needs attention (25%) + source (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 min-h-0">
          <Card className="lg:col-span-3 flex flex-col min-h-0">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={Gauge}
                title="Trending"
                description="Week-over-week growth by AI-grouped theme"
              />
            </CardHeader>
            <CardContent className="pt-0 flex-1 min-h-0 overflow-y-auto">
              <ClusterTrendsPanel trends={stats?.clusterTrends?.trending || { weeks: [], rising: [], shrinking: [] }} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-3 flex flex-col min-h-0">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={AlertTriangle}
                title="Needs Attention"
                description="High-severity clusters by impact score"
              />
            </CardHeader>
            <CardContent className="pt-0 flex-1 min-h-0 overflow-y-auto">
              <NeedsAttentionPanel entries={stats?.clusterTrends?.needsAttention || []} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-4 flex flex-col min-h-0">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={Globe}
                title="Feedback Source"
                description="Volume by where feedback arrives"
              />
            </CardHeader>
            <CardContent className="pt-0 flex-1 min-h-0 overflow-y-auto">
              <SourcePanel
                breakdown={stats?.sourceBreakdown || { bySource: {}, byPlatform: {}, total: 0 }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Bottom: autopilot + velocity + gap */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={Bot}
                title="Autopilot Performance"
                description="Approval rate and platform volume"
              />
            </CardHeader>
            <CardContent className="pt-0 flex-1 min-h-0 overflow-y-auto">
              <AutopilotPanel autopilot={stats?.autopilot || { approved: 0, rejected: 0, pending: 0, approvalRate: null, byPlatform: {}, byStatus: {} }} />
            </CardContent>
          </Card>
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={Clock}
                title="Time to Resolution"
                description="Created → Done, overall and by board"
              />
            </CardHeader>
            <CardContent className="pt-0 flex-1 min-h-0 overflow-y-auto">
              <VelocityPanel
                velocity={stats?.timeToResolution || { count: 0, overallAvgDays: null, byBoard: [], column: null }}
              />
            </CardContent>
          </Card>
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={AlertTriangle}
                title="Engagement vs Resolution"
                description="Loud themes that aren't shipping"
              />
            </CardHeader>
            <CardContent className="pt-0 flex-1 min-h-0 overflow-y-auto">
              <GapPanel gap={stats?.engagementGap || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
