"use client";

import { Post, getPostAuthorDisplayName, isWidgetPost, getSourcePlatformBadgeStyle } from "@/services/postService";
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
  open: "bg-gray-100 text-gray-800",
  "under-review": "bg-blue-100 text-blue-800",
  planned: "bg-purple-100 text-purple-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  closed: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  "under-review": "Under Review",
  planned: "Planned",
  "in-progress": "In Progress",
  completed: "Completed",
  closed: "Closed",
};

export function FeedbackCard({ feedback, onUpvote, isUpvoted = false }: FeedbackCardProps) {
  const router = useRouter();
  const [isVoting, setIsVoting] = useState(false);
  
  // Check if post is trending (created in last 7 days with high engagement)
  const isTrending = () => {
    const daysOld = (Date.now() - new Date(feedback.created_at).getTime()) / (1000 * 60 * 60 * 24);
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
      console.error('Upvote error:', error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex gap-4 p-5">
        {/* Large Upvote Button */}
        <div className="flex items-start">
          <Button
            variant={isUpvoted ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-col h-auto min-w-[56px] px-2.5 py-2.5 gap-1.5 rounded-lg",
              "hover:scale-105 transition-all",
              isUpvoted && "bg-primary text-primary-foreground shadow-sm"
            )}
            onClick={handleUpvote}
            disabled={isVoting}
          >
            <ArrowUp className={cn(
              "h-4 w-4",
              isUpvoted && "fill-current"
            )} />
            <span className="text-sm font-switzer font-semibold">{feedback.upvotes}</span>
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3 min-w-0">
          {/* Title and Trending Badge */}
          <div className="flex items-start gap-2">
            <h3 className="font-switzer font-semibold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors flex-1 leading-snug">
              {feedback.title}
            </h3>
            {isTrending() && (
              <Badge variant="secondary" className="bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 flex items-center gap-1 shrink-0">
                <TrendingUp className="h-3 w-3" />
                Trending
              </Badge>
            )}
          </div>

          {/* Description */}
          {feedback.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {feedback.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
            {/* Status Badge */}
            <Badge
              variant="secondary"
              className={cn("text-xs font-switzer font-medium", STATUS_COLORS[feedback.status])}
            >
              {STATUS_LABELS[feedback.status]}
            </Badge>

            {/* Board Badge */}
            {feedback.board && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-switzer font-medium"
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
            <div className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <MessageSquare className="h-4 w-4" />
              <span className="font-switzer font-medium">{feedback.comment_count}</span>
            </div>

            {/* Author & Time */}
            <span className="ml-auto text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1.5 flex-wrap justify-end">
              {(feedback.author || feedback.external_author || feedback.source_platform) && (
                <>
                  <span className="font-switzer font-medium text-slate-700 dark:text-slate-300">
                    {getPostAuthorDisplayName(feedback)}
                  </span>
                  {feedback.source_platform && (
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getSourcePlatformBadgeStyle(feedback.source_platform)}`}>
                      {feedback.source_platform}
                    </span>
                  )}
                  {isWidgetPost(feedback) && (
                    <span className="inline-flex items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                      via Widget
                    </span>
                  )}
                  <span>·</span>
                </>
              )}
              {formatDistanceToNow(new Date(feedback.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
