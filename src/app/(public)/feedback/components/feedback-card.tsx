"use client";

import {
  Post,
  getPostAuthorDisplayName,
  isWidgetPost,
  getSourcePlatformBadgeStyle,
} from "@/services/postService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUp, MessageSquare, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconDisplay } from "@/components/ui/icon-picker";

interface FeedbackCardProps {
  feedback: Post;
  onUpvote?: (postId: string) => Promise<void>;
  isUpvoted?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-secondary text-secondary-foreground",
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

  return (
    <div
      role="link"
      tabIndex={0}
      className="group flex cursor-pointer gap-4 rounded-lg border border-border bg-card p-5 transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Large Upvote Button */}
      <div className="flex items-start">
        <Button
          size="sm"
          className={cn(
            "flex h-auto min-w-[56px] flex-col gap-1.5 rounded-lg border px-2.5 py-2.5 transition-transform motion-reduce:transition-none",
            isUpvoted
              ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
              : "border-border bg-secondary text-secondary-foreground hover:border-primary/40",
          )}
          onClick={handleUpvote}
          disabled={isVoting}
        >
          <ArrowUp className={cn("h-4 w-4", isUpvoted && "fill-current")} />
          <span className="font-headline text-base font-semibold tabular-nums">
            {feedback.upvotes}
          </span>
        </Button>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-3">
        {/* Title and Trending Badge */}
        <div className="flex items-start gap-2">
          <h3 className="flex-1 font-headline text-[17px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {feedback.title}
          </h3>
          {isTrending() && (
            <Badge
              variant="secondary"
              className="flex shrink-0 items-center gap-1 border border-warning/30 bg-warning/15 text-foreground"
            >
              <TrendingUp className="h-3 w-3" />
              Trending
            </Badge>
          )}
        </div>

        {/* Description */}
        {feedback.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-foreground">
            {feedback.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {/* Status Badge */}
          <Badge
            variant="secondary"
            className={cn(
              "font-headline text-xs font-medium",
              STATUS_COLORS[feedback.status],
            )}
          >
            {STATUS_LABELS[feedback.status]}
          </Badge>

          {/* Board Badge */}
          {feedback.board && (
            <div
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
              style={{
                backgroundColor: feedback.board.color + "15",
                color: feedback.board.color,
              }}
            >
              <IconDisplay iconName={feedback.board.icon} className="h-3 w-3" />
              <span>{feedback.board.name}</span>
            </div>
          )}

          {/* Comments */}
          <div className="flex items-center gap-1.5 transition-colors hover:text-primary">
            <MessageSquare className="h-4 w-4" />
            <span className="font-headline font-medium tabular-nums">
              {feedback.comment_count}
            </span>
          </div>

          {/* Author & Time */}
          <span className="ml-auto flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
            {(feedback.author ||
              feedback.external_author ||
              feedback.source_platform) && (
              <>
                <span className="font-medium text-foreground">
                  {getPostAuthorDisplayName(feedback)}
                </span>
                {feedback.source_platform && (
                  <span
                    className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getSourcePlatformBadgeStyle(feedback.source_platform)}`}
                  >
                    {feedback.source_platform}
                  </span>
                )}
                {isWidgetPost(feedback) && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    via Widget
                  </span>
                )}
              </>
            )}
            {formatDistanceToNow(new Date(feedback.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
