'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DollarSign,
  Info,
  Lock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';
import { formatMrr } from '@/lib/format-mrr';
import { UpgradeDialog } from '@/components/UpgradeDialog';

/* ======================================================
   Types
====================================================== */

export interface RevenueOverview {
  locked?: boolean;
  totalMrr?: number;
  accountsWithMrr?: number;
  coverage?: { customersWithMrr: number; customersTotal: number };
  byPlan?: Record<string, number>;
  mrrWithHighSeverity?: number;
  topPostsByMrr?: Array<{
    postId: string;
    title: string;
    mrr: number;
    customerCount: number;
    customersWithMrr: number;
  }>;
  currency?: string;
}

/* ======================================================
   Small helpers (exported for tests)
====================================================== */

/** Coverage tile sentence: "38 of 120". */
export function coverageLabel(coverage?: { customersWithMrr: number; customersTotal: number }): string {
  if (!coverage) return '—';
  return `${coverage.customersWithMrr} of ${coverage.customersTotal}`;
}

/** Top-post row sub-line: "$1,200/mo · 2 of 5 customers". */
export function topPostMeta(
  p: { mrr: number; customerCount: number; customersWithMrr: number },
  currency: string
): string {
  return `${formatMrr(p.mrr, currency)}/mo · ${p.customersWithMrr} of ${p.customerCount} customers`;
}

/** Token-colored bar palette (theme tokens, light/dark safe). */
const BAR_COLORS = ['bg-primary', 'bg-progress', 'bg-warning', 'bg-success', 'bg-muted-foreground/50'];

/* ======================================================
   Panel
====================================================== */

/**
 * Known-MRR panel for the Expert view. Fetches GET /api/dashboard/revenue
 * in its OWN effect, separately from expert-stats: it only mounts after the
 * dashboard has painted, so a slow or failing revenue call can never blank
 * the dashboard or hurt LCP. States: loading skeleton, failed (neutral),
 * locked (upgrade prompt, no numbers), empty (setup link), data.
 */
export function RevenuePanel() {
  const router = useRouter();
  const [data, setData] = useState<RevenueOverview | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/api/dashboard/revenue')
      .then((res) => {
        if (cancelled) return;
        setData(res.data?.data ?? res.data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currency = data?.currency || 'USD';
  const locked = data?.locked === true;
  const coverage = data?.coverage;
  const hasRevenueData = (coverage?.customersWithMrr ?? 0) > 0;
  const totalMrr = data?.totalMrr ?? 0;
  const coveragePct =
    coverage && coverage.customersTotal > 0
      ? Math.round((coverage.customersWithMrr / coverage.customersTotal) * 100)
      : 0;
  const byPlan = Object.entries(data?.byPlan || {});
  const maxPlanMrr = Math.max(1, ...byPlan.map(([, v]) => v));
  const topPosts = data?.topPostsByMrr || [];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center mt-0.5 shrink-0 bg-primary/10 text-primary">
            <DollarSign className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-[15px] font-medium tracking-tight text-foreground">
              Revenue
            </CardTitle>
            <CardDescription className="text-[13px] mt-0.5 text-muted-foreground">
              Known MRR across customers, plans and top posts
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : failed ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm font-medium text-muted-foreground">Couldn&apos;t load</p>
          </div>
        ) : locked ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2.5">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Revenue insights</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upgrade to Starter or Pro to use this feature.
            </p>
            <Button size="sm" className="gap-1.5 mt-3" onClick={() => setDialogOpen(true)}>
              <Sparkles className="w-3.5 h-3.5" />
              Upgrade
            </Button>
            <UpgradeDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              featureName="Revenue insights"
            />
          </div>
        ) : !hasRevenueData ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <DollarSign className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-foreground">No revenue data yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Send an MRR field with identify() so customers with revenue can
              be counted. Pick the field keys in Revenue data settings.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => router.push('/admin/organization?tab=general#revenue-data')}
            >
              Set up revenue data
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Stat tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        tabIndex={0}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground cursor-default"
                      >
                        Known MRR
                        <Info className="h-3 w-3" aria-hidden="true" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] text-xs">
                      Only customers with revenue data. Anonymous voters are not included.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
                  {formatMrr(data?.totalMrr ?? 0, currency)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground">ARR</p>
                <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
                  {formatMrr((data?.totalMrr ?? 0) * 12, currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Known MRR × 12</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  MRR with open high-severity feedback
                </p>
                <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
                  {formatMrr(data?.mrrWithHighSeverity ?? 0, currency)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground">Coverage</p>
                <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
                  {coverageLabel(coverage)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  customers have revenue data
                </p>
              </div>
            </div>

            {/* MRR by plan — simple token-colored bars */}
            {byPlan.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">MRR by plan</p>
                {byPlan.map(([plan, value], i) => (
                  <div key={plan} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs font-medium text-foreground truncate">
                      {plan}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                        style={{ width: `${Math.max(2, Math.round((value / maxPlanMrr) * 100))}%` }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {formatMrr(value, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Top 5 posts by MRR */}
            {topPosts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Top posts by MRR</p>
                <div className="space-y-1">
                  {topPosts.map((p) => (
                    <button
                      key={p.postId}
                      onClick={() => router.push(`/admin/feedback?post=${p.postId}`)}
                      className="w-full flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-left hover:bg-accent/60 transition-colors"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-foreground truncate">
                          {p.title}
                        </span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {topPostMeta(p, currency)}
                        </span>
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Single action */}
            <Button
              variant="outline"
              className="w-full h-9 gap-2 font-medium"
              onClick={() => router.push('/admin/feedback')}
            >
              View feedback
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
