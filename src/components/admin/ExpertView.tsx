'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/context/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bot,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';
import { RevenuePanel } from '@/components/admin/RevenuePanel';
import '@/app/admin/admin.css';

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

const SEVERITY_CLASS: Record<string, string> = {
  high: 'queue__sev queue__sev--high',
  medium: 'queue__sev queue__sev--medium',
  low: 'queue__sev queue__sev--low',
};

const SEVERITY_LABEL: Record<string, string> = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
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
  if (range === '7d') parts.push('Last 7 days, updated daily');
  const generated = formatGeneratedAt(generatedAt);
  if (generated) parts.push(`Generated ${generated}`);
  return parts.join(', ');
}

/**
 * High-severity post count for the summary card. The API caps the list at 5,
 * so 5 or more renders as "5+".
 */
export function highSeverityCountLabel(count: number): string {
  return count >= 5 ? '5+' : String(count);
}

/** Approval rate display: null (no decisions yet) renders as "n/a". */
export function approvalRateLabel(rate: number | null): string {
  return rate === null ? 'n/a' : `${rate}%`;
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
    <div className="seg" role="group" aria-label="Date range">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          aria-pressed={range === r.value}
          onClick={() => onChange(r.value)}
          className="seg__btn"
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
    <div className="dash__stack">
      <div className="metrics" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="figure-cell">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-7 w-16 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        ))}
      </div>
      <div className="work" aria-hidden="true">
        <div className="panel">
          <div className="panel__head"><Skeleton className="h-5 w-40 rounded" /></div>
          <div className="panel__body panel__body--flush">
            <Skeleton className="h-12 w-full rounded-none" />
            <Skeleton className="h-12 w-full rounded-none" />
            <Skeleton className="h-12 w-full rounded-none" />
          </div>
        </div>
        <div className="rail">
          <div className="panel briefing"><div className="panel__body"><Skeleton className="h-24 w-full rounded" /></div></div>
          <div className="panel"><div className="panel__head"><Skeleton className="h-5 w-36 rounded" /></div><div className="panel__body"><Skeleton className="h-16 w-full rounded" /></div></div>
        </div>
      </div>
      <div className="lower" aria-hidden="true">
        <div className="panel"><div className="panel__head"><Skeleton className="h-5 w-40 rounded" /></div><Skeleton className="h-40 m-4 rounded" /></div>
        <div className="panel"><div className="panel__head"><Skeleton className="h-5 w-32 rounded" /></div><Skeleton className="h-40 m-4 rounded" /></div>
      </div>
    </div>
  );
}

/* ======================================================
   Figure strip — four stats, hairline parted
====================================================== */

function FigureCell({
  label,
  value,
  meta,
  metaTone = 'muted',
}: {
  label: string;
  value: string;
  meta: string;
  metaTone?: 'muted' | 'ok' | 'warn';
}) {
  const tone =
    metaTone === 'ok' ? 'figure-cell__meta is-ok' : metaTone === 'warn' ? 'figure-cell__meta is-warn' : 'figure-cell__meta';
  return (
    <div className="figure-cell">
      <span className="figure-cell__label">{label}</span>
      <span className="figure-cell__value num">{value}</span>
      <span className={tone}>{meta}</span>
    </div>
  );
}

/* ======================================================
   Briefing — quiet well
====================================================== */

function BriefingPanel({ summary, briefingRange, generatedAt }: {
  summary: string | null;
  briefingRange?: string | null;
  generatedAt?: string | null;
}) {
  const caption = buildBriefingCaption(briefingRange, generatedAt);

  if (!summary) {
    return (
      <section className="panel briefing" aria-labelledby="briefing-title">
        <div className="panel__head">
          <h2 className="panel__title" id="briefing-title">AI briefing</h2>
        </div>
        <div className="panel__body">
          <div className="state-empty">
            <p className="state-empty__title">No briefing yet</p>
            <p className="state-empty__note">
              Your first briefing will appear after the next daily run.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel briefing" aria-labelledby="briefing-title">
      <div className="panel__head">
        <h2 className="panel__title" id="briefing-title">AI briefing</h2>
      </div>
      <div className="panel__body briefing__body">
        <p className="briefing__text">{summary}</p>
        {caption && (
          <span className="briefing__caption">{caption}</span>
        )}
      </div>
    </section>
  );
}

/* Neutral placeholder shown in place of good-news empty states when the request failed */
function LoadFailedNote() {
  return (
    <div className="state-empty">
      <p className="state-empty__title">Couldn&apos;t load data</p>
    </div>
  );
}

/* ======================================================
   Needs-attention queue — the signature object
====================================================== */

function NeedsAttentionPanel({ posts }: { posts: TopSeverePost[] }) {
  const router = useRouter();

  if (posts.length === 0) {
    return (
      <div className="queue__empty">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
          <span className="queue__empty-title">All clear</span>
        </div>
      </div>
    );
  }

  return (
    <ul className="queue">
      {posts.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            onClick={() => router.push(`/admin/feedback?post=${p.id}`)}
            className="queue__row"
          >
            <span
              className={SEVERITY_CLASS[p.severity] || 'queue__sev queue__sev--low'}
            >
              {SEVERITY_LABEL[p.severity] || p.severity}
            </span>
            <span className="queue__title">{p.title}</span>
            <span className="queue__count num"><span className="visually-hidden">engagements </span>{p.upvotes + p.comment_count}</span>
            <ChevronRight className="queue__go h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ======================================================
   Smartflow pipeline — hairline figures
====================================================== */

function AutopilotPipelinePanel({
  autopilot,
  loadFailed,
}: {
  autopilot: AutopilotStats;
  loadFailed: boolean;
}) {
  const router = useRouter();

  const tiles = [
    { label: 'Ingested', value: autopilot.ingested, tone: '' },
    { label: 'Pending review', value: autopilot.pending, tone: 'is-warn' },
    { label: 'Approved', value: autopilot.approved, tone: 'is-ok' },
    { label: 'Rejected', value: autopilot.rejected, tone: '' },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      {loadFailed ? (
        <LoadFailedNote />
      ) : (
        <div className="pipeline">
          {tiles.map((t) => (
            <div key={t.label} className="pipeline__cell">
              <span className={`pipeline__value num ${t.tone}`}>{t.value}</span>
              <span className="pipeline__label">{t.label}</span>
            </div>
          ))}
        </div>
      )}
      <Button
        variant="outline"
        className="h-9 gap-2 font-medium self-start"
        onClick={() => router.push('/admin/autopilot')}
      >
        <Bot className="h-4 w-4" aria-hidden="true" />
        Review queue
      </Button>
    </div>
  );
}

/* ======================================================
   Customers to watch — data table
====================================================== */

function CustomersToWatchPanel({ customers }: { customers: CustomerToWatch[] }) {
  const router = useRouter();

  if (customers.length === 0) {
    return (
      <div className="state-empty">
        <p className="state-empty__title">No customers to watch</p>
        <p className="state-empty__note">
          End users with high-severity posts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Customer</th>
            <th scope="col" className="hidden sm:table-cell">Top post</th>
            <th scope="col">Severity</th>
            <th scope="col" className="num">Engagement</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => {
            const name = c.userName || c.userEmail || c.userExternalId || 'Anonymous';
            return (
              <tr key={c.userId}>
                <td>
                  <button
                    type="button"
                    onClick={() => router.push('/admin/users')}
                    className="link-quiet gap-2 max-w-full"
                  >
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                      {getInitials(name)}
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block min-w-0 text-sm font-medium text-foreground truncate">
                        {name}
                      </span>
                      <span className="block min-w-0 text-xs text-muted-foreground truncate sm:hidden">
                        {c.postTitle}
                      </span>
                    </span>
                  </button>
                </td>
                <td className="hidden sm:table-cell min-w-0 text-sm text-muted-foreground truncate max-w-[200px]">
                  {c.postTitle}
                </td>
                <td>
                  <span className={SEVERITY_CLASS[c.severity] || 'queue__sev queue__sev--low'}>
                    {SEVERITY_LABEL[c.severity] || c.severity}
                  </span>
                </td>
                <td className="num text-sm text-muted-foreground">
                  {c.upvotes + c.comment_count}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
    <div className="dash__stack">
      {!controlled && (
        <div className="flex items-center justify-between gap-3 shrink-0">
          <RangePills range={range} onChange={setRange} />
        </div>
      )}

      {error && (
        <p className="state-error" role="alert">
          Stats failed to refresh. Showing the last known data if available.
          {error ? ` (${error})` : ""}
        </p>
      )}

      {/* KPI band — scan first */}
      {loadFailed ? (
        <div className="metrics">
          {SUMMARY_CARD_LABELS.map((label) => (
            <FigureCell key={label} label={label} value="n/a" meta="Couldn't load" />
          ))}
        </div>
      ) : (
        <div className="metrics">
          <FigureCell
            label="High-severity posts"
            value={highSeverityCountLabel(highSeverityCount)}
            meta={highSeverityCount === 0 ? 'Nothing urgent' : `High-severity in the last ${rangeDays} days`}
            metaTone={highSeverityCount === 0 ? 'ok' : 'muted'}
          />
          <FigureCell
            label="Pending review"
            value={String(autopilot.pending)}
            meta={autopilot.pending === 0 ? 'Queue is clear' : 'Waiting for your action'}
            metaTone={autopilot.pending === 0 ? 'ok' : 'warn'}
          />
          <FigureCell
            label="Ingested by Smartflow"
            value={String(autopilot.ingested)}
            meta={`In the last ${rangeDays} days`}
          />
          <FigureCell
            label="Approval rate"
            value={approvalRateLabel(autopilot.approvalRate)}
            meta={
              autopilot.approvalRate === null
                ? 'No decisions yet'
                : `${autopilot.approved} approved, ${autopilot.rejected} rejected`
            }
          />
        </div>
      )}

      {/* Work: signature ledger | rail */}
      <div className="work">
        <section className="panel" aria-labelledby="attention-title">
          <div className="panel__head">
            <div>
              <h2 className="panel__title" id="attention-title">Needs attention</h2>
              <p className="panel__desc">High-severity posts, most engaged first</p>
            </div>
          </div>
          <div className="panel__body panel__body--flush">
            {loadFailed ? (
              <LoadFailedNote />
            ) : (
              <NeedsAttentionPanel posts={stats?.topSeverePosts || []} />
            )}
          </div>
          <div className="panel__foot">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/feedback')}
            >
              View all feedback
            </Button>
          </div>
        </section>

        <div className="rail">
          <BriefingPanel
            summary={briefing?.summary ?? null}
            briefingRange={briefing?.range}
            generatedAt={briefing?.generated_at}
          />

          <section className="panel" aria-labelledby="pipeline-title">
            <div className="panel__head">
              <div>
                <h2 className="panel__title" id="pipeline-title">Smartflow pipeline</h2>
                <p className="panel__desc">Ingestion and review, last {rangeDays} days</p>
              </div>
            </div>
            <div className="panel__body">
              <AutopilotPipelinePanel autopilot={autopilot} loadFailed={loadFailed} />
            </div>
          </section>
        </div>
      </div>

      {/* Lower data grid: customers | revenue */}
      <div className="lower">
        <section className="panel" aria-labelledby="customers-title">
          <div className="panel__head">
            <div>
              <h2 className="panel__title" id="customers-title">Customers to watch</h2>
              <p className="panel__desc">End users with the most severe posts</p>
            </div>
          </div>
          <div className="panel__body panel__body--flush">
            {loadFailed ? (
              <LoadFailedNote />
            ) : (
              <CustomersToWatchPanel customers={stats?.customersToWatch || []} />
            )}
          </div>
        </section>

        <RevenuePanel />
      </div>
    </div>
  );
}
