'use client';

import { useEffect, useState } from 'react';
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
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2 shrink-0">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        <div className="rounded-xl bg-[#14181f] p-4 space-y-3">
          <Skeleton className="h-4 w-36 bg-slate-700" />
          <Skeleton className="h-24 w-full bg-slate-700" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        <div className="rounded-xl bg-[#fdf6ec] p-4 space-y-3">
          <Skeleton className="h-4 w-36 bg-amber-200/50" />
          <Skeleton className="h-24 w-full bg-amber-200/50" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   Panel components
====================================================== */

function PanelHeader({ icon: Icon, title, description, right, iconColor }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  right?: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2 shrink-0">
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
        <div
          key={e.cluster_key}
          className="flex items-center gap-2 rounded-lg bg-red-50/70 dark:bg-red-950/20 px-3 py-2.5"
        >
          <span className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">
            {e.label}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-900/50 dark:text-red-400">
              HIGH
            </span>
            <span className="text-[11px] text-muted-foreground w-6 text-right">
              {e.postCount}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* Panel 2 — Feedback source breakdown (donut + legend) — dark variant */
function SourcePanel({ breakdown }: { breakdown: SourceBreakdown }) {
  const [showPlatform, setShowPlatform] = useState(false);
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
  const total = breakdown.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sourceData.length > 0 ? sourceData : [{ name: 'empty', value: 1, color: '#2a3441' }]}
                dataKey="value"
                nameKey="name"
                innerRadius={38}
                outerRadius={56}
                paddingAngle={2}
                strokeWidth={0}
              >
                {(sourceData.length > 0 ? sourceData : [{ name: 'empty', value: 1, color: '#2a3441' }]).map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
              {sourceData.length > 0 && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#14181f',
                    border: '1px solid #2a3441',
                    borderRadius: '8px',
                    fontSize: 12,
                    color: '#e2e8f0',
                  }}
                  formatter={(value: number) => [`${value} posts`, '']}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {sourceData.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="flex-1 min-w-0 text-xs text-slate-300 truncate">{s.name}</span>
              <span className="text-xs font-medium text-white">{s.value}</span>
              <span className="text-[11px] text-slate-400 w-10 text-right">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-700 mt-1">
            <span className="text-xs font-semibold text-white">Total</span>
            <span className="ml-auto text-xs font-semibold text-white">{total}</span>
          </div>
        </div>
      </div>

      {platformData.length > 0 && (
        <div className="pt-2 border-t border-slate-700">
          <button
            onClick={() => setShowPlatform(!showPlatform)}
            className="flex items-center justify-between w-full text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5"
          >
            <span>Autopilot by platform</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showPlatform ? 'rotate-180' : ''}`} />
          </button>
          {showPlatform && (
            <div className="space-y-2 mt-2">
              {platformData.map((p) => (
                <div key={p.name} className="flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
                  <span className="flex-1 text-xs text-slate-300">{p.name}</span>
                  <span className="text-xs font-medium text-white">{p.value}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Panel 3 — Autopilot performance */
function AutopilotPanel({ autopilot }: { autopilot: AutopilotStats }) {
  const decided = autopilot.approved + autopilot.rejected;
  const rate = autopilot.approvalRate;
  const gaugeColor = '#10b981';
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
            <span className="text-lg font-bold text-foreground leading-none">{rate ?? '–'}%</span>
            <span className="text-[9px] text-muted-foreground mt-0.5">Approval rate</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-muted-foreground">Approved</span>
            <span className="ml-auto font-semibold text-emerald-600 dark:text-emerald-400">{autopilot.approved}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
            <span className="text-muted-foreground">Rejected</span>
            <span className="ml-auto font-semibold text-red-600 dark:text-red-400">{autopilot.rejected}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-gray-400 shrink-0" />
            <span className="text-muted-foreground">Pending</span>
            <span className="ml-auto font-semibold text-muted-foreground">{autopilot.pending}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0" />
            <span className="text-muted-foreground">Decided</span>
            <span className="ml-auto font-semibold text-foreground">{decided}</span>
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

  const hasTrending = (stats?.clusterTrends?.trending?.rising?.length ?? 0) > 0
    || (stats?.clusterTrends?.trending?.shrinking?.length ?? 0) > 0;

  const rangeLabel = RANGES.find((r) => r.value === range)?.label || range;

  return (
    <div className="flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-end gap-2 mb-4 shrink-0">
        {/* Range dropdown */}
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
        {/* Row 1: Trending (wide) + Needs Attention */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          {/* Trending — wide, gradient background */}
          <div className="relative flex flex-col rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #eef4fb 0%, #f4f8fc 50%, #eef2f9 100%)' }}>
            <div className="relative z-10 flex flex-col">
              <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Gauge className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-foreground">Trending</h3>
                    <p className="text-[13px] text-muted-foreground">Week-over-week growth by AI-grouped theme</p>
                  </div>
                </div>
                {hasTrending && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Keep going! 🚀
                  </span>
                )}
              </div>
              <div className="px-5 pb-5">
                <ClusterTrendsPanel trends={stats?.clusterTrends?.trending || { weeks: [], rising: [], shrinking: [] }} />
              </div>
            </div>
          </div>

          {/* Needs Attention — standard card with View all link */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={AlertTriangle}
                title="Needs Attention"
                description="High-severity clusters by impact score"
                iconColor="bg-red-100 text-red-600"
                right={
                  <span className="text-xs text-primary hover:underline cursor-pointer mt-1">View all →</span>
                }
              />
            </CardHeader>
            <CardContent className="pt-0">
              <NeedsAttentionPanel entries={stats?.clusterTrends?.needsAttention || []} />
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Feedback Source (dark) + Autopilot Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Feedback Source — dark variant */}
          <div className="flex flex-col rounded-xl overflow-hidden bg-[#14181f]">
            <div className="px-5 pt-5 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-white">Feedback Source</h3>
                  <p className="text-[13px] text-slate-400">Volume by where feedback arrives</p>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5">
              <SourcePanel
                breakdown={stats?.sourceBreakdown || { bySource: {}, byPlatform: {}, total: 0 }}
              />
            </div>
          </div>

          {/* Autopilot Performance — standard card */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={Bot}
                title="Autopilot Performance"
                description="Approval rate and platform volume"
                iconColor="bg-indigo-100 text-indigo-600"
              />
            </CardHeader>
            <CardContent className="pt-0">
              <AutopilotPanel autopilot={stats?.autopilot || { approved: 0, rejected: 0, pending: 0, approvalRate: null, byPlatform: {}, byStatus: {} }} />
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Time to Resolution (amber tint) + Engagement vs Resolution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Time to Resolution — amber tinted */}
          <div className="flex flex-col rounded-xl overflow-hidden" style={{ background: '#fdf6ec' }}>
            <div className="px-5 pt-5 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-foreground">Time to Resolution</h3>
                  <p className="text-[13px] text-muted-foreground">Created → Done, overall and by board</p>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5">
              <VelocityPanel
                velocity={stats?.timeToResolution || { count: 0, overallAvgDays: null, byBoard: [], column: null }}
              />
            </div>
          </div>

          {/* Engagement vs Resolution — standard card with View all link */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <PanelHeader
                icon={AlertTriangle}
                title="Engagement vs Resolution"
                description="Loud themes that aren't shipping"
                iconColor="bg-blue-100 text-blue-600"
                right={
                  <span className="text-xs text-primary hover:underline cursor-pointer mt-1">View all →</span>
                }
              />
            </CardHeader>
            <CardContent className="pt-0">
              <GapPanel gap={stats?.engagementGap || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
