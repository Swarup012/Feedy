"use client";

import {
  Post,
  getPostAuthorDisplayName,
  isWidgetPost,
} from "@/services/postService";
import { MessageSquare, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FeedbackCardProps {
  feedback: Post;
  onUpvote?: (postId: string) => Promise<void>;
  isUpvoted?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-muted text-muted-foreground",
  "under-review": "bg-primary/10 text-primary",
  planned: "bg-warning/15 text-foreground",
  "in-progress": "bg-progress/15 text-foreground",
  completed: "bg-success/15 text-foreground",
  closed: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  "under-review": "Under Review",
  planned: "Planned",
  "in-progress": "In Progress",
  completed: "Completed",
  closed: "Closed",
};

/**
 * Compact vote counts for the vote box: 999 → "999", 1000 → "1k",
 * 1234 → "1.2k", 1_200_000 → "1.2m". The full number stays in the
 * button's aria-label/title.
 */
export function formatVoteCount(count: number): string {
  if (count < 1000) return String(count);
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  })
    .format(count)
    .toLowerCase();
}

export function FeedbackCard({
  feedback,
  onUpvote,
  isUpvoted = false,
}: FeedbackCardProps) {
  const router = useRouter();
  const [isVoting, setIsVoting] = useState(false);

  // Check if post is trending (created in last 7 days with high engagement)
  const isTrending = () => {
    const daysOld =
      (Date.now() - new Date(feedback.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    const engagementScore = feedback.upvotes * 2 + feedback.comment_count * 3;
    return daysOld <= 7 && engagementScore > 10;
  };

  const handleClick = () => {
    router.push(`/feedback/${feedback.id}`);
  };

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpvote || isVoting) return;

    setIsVoting(true);
    try {
      await onUpvote(feedback.id);
    } catch (error) {
      console.error("Upvote error:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const showAuthor =
    feedback.author || feedback.external_author || feedback.source_platform;

  return (
    <div
      role="link"
      tabIndex={0}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none sm:gap-6 sm:p-5"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3 className="break-words font-headline text-xl font-medium leading-snug text-foreground sm:text-2xl">
          {feedback.title}
        </h3>

        {feedback.description && (
          <p className="truncate text-sm text-muted-foreground">
            {feedback.description}
          </p>
        )}

        {/* Status, board, comments */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
              STATUS_COLORS[feedback.status],
            )}
          >
            {STATUS_LABELS[feedback.status]}
          </span>

          {feedback.board && (
            <span className="inline-flex min-w-0 max-w-[10rem] items-center truncate rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {feedback.board.name}
            </span>
          )}

          <span className="inline-flex items-center gap-1 tabular-nums">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            {feedback.comment_count}
          </span>
        </div>

        {/* Author / source / trending */}
        {(showAuthor || isTrending()) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {showAuthor && (
              <>
                <span className="truncate">
                  by{" "}
                  <span className="font-medium text-foreground">
                    {getPostAuthorDisplayName(feedback)}
                  </span>
                </span>
                {feedback.source_platform && (
                  <span className="truncate capitalize">
                    · {feedback.source_platform}
                  </span>
                )}
                {isWidgetPost(feedback) && <span>· via Widget</span>}
              </>
            )}
            {isTrending() && (
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                Trending
              </span>
            )}
          </div>
        )}
      </div>

      {/* Vote */}
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <button
          type="button"
          aria-label={
            isUpvoted
              ? `Remove upvote, ${feedback.upvotes} votes`
              : `Upvote, ${feedback.upvotes} votes`
          }
          aria-pressed={isUpvoted}
          title={`${feedback.upvotes} votes`}
          disabled={isVoting}
          onClick={handleUpvote}
          className={cn(
            "group flex w-16 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none sm:w-20",
            isUpvoted
              ? "border-primary bg-primary/10 text-primary hover:bg-primary/15"
              : "border-border bg-card text-foreground hover:border-primary focus-visible:border-primary",
          )}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={cn(
              "h-6 w-7 fill-current transition-colors",
              !isUpvoted &&
                "text-vote-arrow-light dark:text-vote-arrow-dark group-hover:text-primary group-focus-visible:text-primary",
            )}
          >
            <path d="M12 4 24 20H0Z" />
          </svg>
          <span className="font-headline text-2xl font-bold leading-none tabular-nums">
            {formatVoteCount(feedback.upvotes)}
          </span>
        </button>

        <span className="w-16 text-center text-[11px] leading-tight text-muted-foreground sm:w-20">
          {formatDistanceToNow(new Date(feedback.created_at), {
            addSuffix: true,
          })}
        </span>
      </div>
    </div>
  );
}
