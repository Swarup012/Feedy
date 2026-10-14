import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCards } from "./StatCards";
import { PipelineCard } from "./PipelineCard";
import { RecentFeedbackTable } from "./RecentFeedbackTable";
import { UpdatesTimeline } from "./UpdatesTimeline";
import { TrendingBoards } from "./TrendingBoards";
import { FirstIdeaCta } from "./FirstIdeaCta";
import type { MyOverviewUpdate } from "@/hooks/useFeedbackData";
import type { Post } from "@/services/postService";

interface OverviewStats {
  myPosts: number;
  newThisMonth: number;
  votesReceived: number;
  votesThisWeek: number;
  pipeline: {
    open: number;
    underReview: number;
    planned: number;
    inProgress: number;
    shipped: number;
    closed: number;
  };
  shippedPercent: number;
}

/**
 * Overview tab content. Pure presentational — the page owns the hooks.
 *
 * State order matters:
 *  1. No org id yet OR loading → spinner (never the empty-state CTA:
 *     a member with posts must not see "Post your first idea" while
 *     the fetch is in flight).
 *  2. Error → message + Retry (refresh); still no CTA, since we don't
 *     know whether they have posts.
 *  3. Success with zero posts → FirstIdeaCta.
 *  4. Success with posts → stats + pipeline + recent + updates + trending.
 */
export function OverviewPanel({
  organizationId,
  isLoading,
  error,
  onRetry,
  stats,
  myPosts,
  updates,
  trendingPosts,
  onNewFeedback,
  onViewAll,
}: {
  organizationId: string | null | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  stats: OverviewStats | null;
  myPosts: Post[];
  updates: MyOverviewUpdate[];
  trendingPosts: Post[];
  onNewFeedback: () => void;
  onViewAll: () => void;
}) {
  if (!organizationId || isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <p className="text-sm text-muted-foreground">Couldn't load your overview</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (!stats || stats.myPosts === 0) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FirstIdeaCta onPostIdea={onNewFeedback} />
        </div>
        <TrendingBoards posts={trendingPosts} />
      </div>
    );
  }

  return (
    <>
      <StatCards stats={stats} />

      {/* Two-column: pipeline + recent (left), updates + trending (right) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <PipelineCard pipeline={stats.pipeline} />
          <RecentFeedbackTable posts={myPosts.slice(0, 5)} onViewAll={onViewAll} />
        </div>
        <div className="space-y-4">
          <UpdatesTimeline updates={updates} />
          <TrendingBoards posts={trendingPosts} />
        </div>
      </div>
    </>
  );
}
