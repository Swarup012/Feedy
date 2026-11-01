'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Info,
  Lock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';
import { formatMrr } from '@/lib/format-mrr';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import '@/app/admin/admin.css';

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
  if (!coverage) return 'n/a';
  return `${coverage.customersWithMrr} of ${coverage.customersTotal}`;
}

/** Top-post row sub-line: "$1,200/mo (2 of 5 customers)". */
export function topPostMeta(
  p: { mrr: number; customerCount: number; customersWithMrr: number },
  currency: string
): string {
  return `${formatMrr(p.mrr, currency)}/mo (${p.customersWithMrr} of ${p.customerCount} customers)`;
}

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
  const byPlan = Object.entries(data?.byPlan || {}).sort((a, b) => b[1] - a[1]);
  const topPosts = data?.topPostsByMrr || [];
  const showHero = !loading && !failed && !locked && hasRevenueData;
  const planTone = (i: number) => (i < 7 ? `rev__seg-${i + 1}` : 'rev__seg-more');

  return (
    <section className="panel" aria-labelledby="revenue-title">
      <div className="panel__head">
        <div>
          <h2 className="panel__title" id="revenue-title">Revenue</h2>
          <p className="panel__desc">Known MRR across customers, plans and top posts</p>
        </div>
        {loading && (
          <div className="rev__hero" aria-hidden="true">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-7 w-28 rounded" />
          </div>
        )}
        {showHero && (
          <div className="rev__hero">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    className="rev__hero-label"
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
            <span className="rev__hero-value num">
              {formatMrr(data?.totalMrr ?? 0, currency)}
            </span>
          </div>
        )}
      </div>
      <div className="panel__body">
        {loading ? (
          <div className="rev" aria-hidden="true">
            <div className="rev__ledger-row">
              <Skeleton className="h-4 w-56 rounded" />
              <Skeleton className="h-5 w-20 rounded" />
            </div>
            <div className="rev__facts">
              <div className="rev__fact">
                <Skeleton className="h-3 w-8 rounded" />
                <Skeleton className="h-6 w-24 rounded" />
              </div>
              <div className="rev__fact">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-6 w-16 rounded" />
              </div>
            </div>
            <div className="rev__mix">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-44 rounded" />
            </div>
            <Skeleton className="h-24 rounded" />
          </div>
        ) : failed ? (
          <div className="state-empty">
            <p className="state-empty__title">Couldn&apos;t load</p>
          </div>
        ) : locked ? (
          <div className="state-empty">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <p className="state-empty__title">Revenue insights</p>
            </div>
            <p className="state-empty__note">
              Upgrade to Starter or Pro to use this feature.
            </p>
            <Button size="sm" className="gap-1.5 mt-3" onClick={() => setDialogOpen(true)}>
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Upgrade
            </Button>
            <UpgradeDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              featureName="Revenue insights"
            />
          </div>
        ) : !hasRevenueData ? (
          <div className="state-empty">
            <p className="state-empty__title">No revenue data yet</p>
            <p className="state-empty__note">
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
          <div className="rev">
            {/* Money at risk — the number that follows the hero */}
            <div className="rev__ledger-row">
              <span className="rev__ledger-label">
                MRR with open high-severity feedback
              </span>
              <span className="rev__ledger-value num">
                {formatMrr(data?.mrrWithHighSeverity ?? 0, currency)}
              </span>
            </div>

            {/* Supporting facts */}
            <div className="rev__facts">
              <div className="rev__fact">
                <span className="figure-cell__label">ARR</span>
                <span className="figure-cell__value num">
                  {formatMrr((data?.totalMrr ?? 0) * 12, currency)}
                </span>
                <span className="figure-cell__meta">Known MRR × 12</span>
              </div>
              <div className="rev__fact">
                <span className="figure-cell__label">Coverage</span>
                <span className="figure-cell__value num">
                  {coverageLabel(coverage)}
                </span>
                <span className="figure-cell__meta">
                  {coveragePct}% of customers have revenue data
                </span>
              </div>
            </div>

            {/* Plan mix — one parts-of-whole bar, legend carries the values */}
            {byPlan.length > 0 && (
              <div className="rev__mix">
                <p className="text-sm font-medium text-muted-foreground">MRR by plan</p>
                <div className="rev__stack" aria-hidden="true">
                  {byPlan.map(([plan, value], i) => (
                    <span
                      key={plan}
                      className={`rev__seg ${planTone(i)}`}
                      style={{ flexGrow: Math.max(value, 0), flexBasis: 0 }}
                    />
                  ))}
                </div>
                <ul className="rev__legend">
                  {byPlan.map(([plan, value], i) => (
                    <li key={plan}>
                      <span
                        className={`rev__swatch ${planTone(i)}`}
                        aria-hidden="true"
                      />
                      <span className="rev__legend-name">{plan}</span>
                      <span className="rev__legend-value num">
                        {formatMrr(value, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Top posts by MRR */}
            {topPosts.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Top posts by MRR</p>
                <ul className="queue">
                  {topPosts.map((p) => (
                    <li key={p.postId}>
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/feedback?post=${p.postId}`)}
                        className="queue__row"
                      >
                        <span className="queue__title flex-1">
                          {p.title}
                          <span className="block text-sm text-muted-foreground font-normal">
                            {topPostMeta(p, currency)}
                          </span>
                        </span>
                        <ChevronRight className="queue__go h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              variant="outline"
              className="h-9 gap-2 font-medium self-start"
              onClick={() => router.push('/admin/feedback')}
            >
              View feedback
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
