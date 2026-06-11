'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sparkles, Tag, BarChart3, ChevronDown, ChevronUp, RefreshCw, AlertCircle } from 'lucide-react';
import { TokenManager } from '@/lib/tokenManager';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Cluster {
  cluster_key: string;
  label: string;
  summary: string | null;
  post_count: number;
  total_upvotes: number;
  priority_score: number;
  severity_level: 'low' | 'medium' | 'high' | 'critical';
  is_ai_generated: boolean;
}

interface ClusterInsightsProps {
  boardId: string;
  /** Optional: cap the visible clusters before "Show more" */
  initialVisible?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const CLUSTER_COLORS = [
  { bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700' },
  { bg: 'bg-sky-50',    border: 'border-sky-200',    dot: 'bg-sky-500',    badge: 'bg-sky-100 text-sky-700'    },
  { bg: 'bg-emerald-50',border: 'border-emerald-200',dot: 'bg-emerald-500',badge: 'bg-emerald-100 text-emerald-700'},
  { bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700'  },
  { bg: 'bg-rose-50',   border: 'border-rose-200',   dot: 'bg-rose-500',   badge: 'bg-rose-100 text-rose-700'   },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', dot: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700'},
  { bg: 'bg-teal-50',   border: 'border-teal-200',   dot: 'bg-teal-500',   badge: 'bg-teal-100 text-teal-700'   },
  { bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700'},
];

function getClusterColor(index: number) {
  return CLUSTER_COLORS[index % CLUSTER_COLORS.length];
}

function BarFill({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton loader
// ─────────────────────────────────────────────────────────────────────────────

function ClusterSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-gray-100 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single cluster card
// ─────────────────────────────────────────────────────────────────────────────

function ClusterCard({
  cluster,
  index,
  maxCount,
  sortOption,
}: {
  cluster: Cluster;
  index: number;
  maxCount: number;
  sortOption: SortOption;
}) {
  const color = getClusterColor(index);

  return (
    <div
      className={`
        rounded-xl border p-4 transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5
        ${color.bg} ${color.border}
      `}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${color.dot}`} />
          <h4 className="font-semibold text-sm text-gray-800 leading-snug truncate">
            {cluster.label}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {cluster.severity_level === 'critical' && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-red-700 uppercase">
              🚨 Critical
            </span>
          )}
          {cluster.severity_level === 'high' && (
            <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-orange-700 uppercase">
              High
            </span>
          )}
          {cluster.is_ai_generated && (
            <span
              className={`
                inline-flex items-center gap-1 rounded-full px-2 py-0.5
                text-[10px] font-semibold tracking-wide
                ${color.badge}
              `}
            >
              <Sparkles className="h-2.5 w-2.5" />
              AI
            </span>
          )}
          <span className="rounded-full bg-white/80 border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600" title="Total Posts">
            {cluster.post_count} {cluster.post_count === 1 ? 'post' : 'posts'}
          </span>
          <span className="rounded-full bg-white/80 border border-orange-200 px-2 py-0.5 text-[11px] font-medium text-orange-600 flex items-center gap-1" title="Total Upvotes">
            🔥 {cluster.total_upvotes}
          </span>
        </div>
      </div>

      {/* Summary */}
      {cluster.summary && (
        <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
          {cluster.summary}
        </p>
      )}

      {/* Progress bar uses dynamic max based on sort type */}
      <BarFill 
        value={
          sortOption === 'posts' ? cluster.post_count : 
          sortOption === 'upvotes' ? cluster.total_upvotes : 
          cluster.priority_score
        } 
        max={maxCount} 
      />

      {/* Cluster key (subtle, for devs) */}
      <p className="mt-1.5 text-[10px] font-mono text-gray-400">{cluster.cluster_key}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export type SortOption = 'priority' | 'upvotes' | 'posts';

export function ClusterInsights({
  boardId,
  initialVisible = 5,
}: ClusterInsightsProps) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('priority');

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchClusters = useCallback(
    async (showRefreshSpinner = false) => {
      if (showRefreshSpinner) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        // Get token fresh each call (mirrors how the axios client works)
        const token = TokenManager.getAccessToken();

        const res = await fetch(`${backendUrl}/api/clusters/boards/${boardId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to load clusters (${res.status})`);
        }

        const json = await res.json();
        setClusters(json.data?.clusters || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load cluster insights');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [boardId, backendUrl]
  );

  useEffect(() => {
    if (boardId) {
      fetchClusters();
    }
  }, [boardId, fetchClusters]);

  // Apply sorting
  const sortedClusters = [...clusters].sort((a, b) => {
    if (sortOption === 'upvotes') return b.total_upvotes - a.total_upvotes;
    if (sortOption === 'posts') return b.post_count - a.post_count;
    // Default: priority
    return b.priority_score - a.priority_score;
  });

  const visible = expanded ? sortedClusters : sortedClusters.slice(0, initialVisible);
  // Use priority score or upvotes to define the max bar size, depending on sort
  const maxCount = sortedClusters[0] 
    ? (sortOption === 'posts' ? sortedClusters[0].post_count : (sortOption === 'upvotes' ? sortedClusters[0].total_upvotes : sortedClusters[0].priority_score)) 
    : 1;
    
  const aiCount = clusters.filter((c) => c.is_ai_generated).length;

  // ── Render states ────────────────────────────────────────────────────────────

  return (
    <Card className="border border-gray-200 shadow-sm flex flex-col h-full">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-100">
              <BarChart3 className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-base">Cluster Insights</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                AI-grouped feedback topics for this board
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="h-8 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="priority">Sort: Priority</option>
              <option value="upvotes">Sort: Upvotes</option>
              <option value="posts">Sort: Post Count</option>
            </select>

            {/* Refresh button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700"
              onClick={() => fetchClusters(true)}
              disabled={refreshing || loading}
              title="Refresh clusters"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Stats pills */}
        {!loading && !error && clusters.length > 0 && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
              <Tag className="h-3 w-3" />
              {clusters.length} {clusters.length === 1 ? 'cluster' : 'clusters'}
            </span>
            {aiCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs text-violet-700 font-medium">
                <Sparkles className="h-3 w-3" />
                {aiCount} AI-labeled
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 flex-1 overflow-y-auto min-h-0">
        {/* Loading */}
        {loading && <ClusterSkeleton />}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-red-700 font-medium">Failed to load clusters</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-red-600 mt-1"
                onClick={() => fetchClusters()}
              >
                Try again
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && clusters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-gray-100 p-3 mb-3">
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No clusters yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
              Clusters will appear automatically as users submit feedback to this board.
            </p>
          </div>
        )}

        {/* Data Container */}
        {!loading && !error && clusters.length > 0 && (
          <div className="flex flex-col xl:flex-row gap-6">
            
            {/* Critical Alerts (Left Side) */}
            {clusters.filter(c => c.severity_level === 'critical').length > 0 && (
              <div className="xl:w-[45%] shrink-0 rounded-xl border border-red-200 bg-red-50/50 p-4 self-start">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <h3 className="font-semibold text-sm text-red-800">Critical Alerts</h3>
                </div>
                <div className="space-y-2.5">
                  {clusters.filter(c => c.severity_level === 'critical').map((cluster, i) => (
                    <ClusterCard
                      key={`critical-${cluster.cluster_key}`}
                      cluster={cluster}
                      index={i}
                      maxCount={maxCount}
                      sortOption={sortOption}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Cluster list (Right Side) */}
            <div className="flex-1 space-y-2.5 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-sm text-gray-800">All Topics</h3>
              </div>
              {visible.map((cluster, i) => (
                <ClusterCard
                  key={cluster.cluster_key}
                  cluster={cluster}
                  index={i}
                  maxCount={maxCount}
                  sortOption={sortOption}
                />
              ))}

              {/* Show more / less */}
              {clusters.length > initialVisible && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-1 text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => setExpanded((e) => !e)}
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5 mr-1" />
                      Show {clusters.length - initialVisible} more
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
