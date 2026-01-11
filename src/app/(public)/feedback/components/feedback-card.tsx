"use client";

import { Post } from "@/services/postService";
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
    <Card
      className="hover:shadow-md transition-all duration-200 hover:border-primary/20 cursor-pointer group"
      onClick={handleClick}
    >
      <CardContent className="p-0">
        <div className="flex gap-4">
          {/* Large Upvote Button - Canny Style */}
          <div className="flex items-start p-4 pr-0">
            <Button
              variant={isUpvoted ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex-col h-auto min-w-[60px] px-3 py-3 gap-1",
                "hover:scale-105 transition-transform",
                isUpvoted && "bg-primary text-primary-foreground"
              )}
              onClick={handleUpvote}
              disabled={isVoting}
            >
              <ArrowUp className={cn(
                "h-5 w-5",
                isUpvoted && "fill-current"
              )} />
              <span className="text-sm font-bold">{feedback.upvotes}</span>
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 py-4 pr-4 space-y-3">
            {/* Title and Trending Badge */}
            <div className="flex items-start gap-2">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors flex-1">
                {feedback.title}
              </h3>
              {isTrending() && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Trending
                </Badge>
              )}
            </div>

            {/* Description */}
            {feedback.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {feedback.description}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              {/* Status Badge */}
              <Badge
                variant="secondary"
                className={cn("text-xs font-medium", STATUS_COLORS[feedback.status])}
              >
                {STATUS_LABELS[feedback.status]}
              </Badge>

              {/* Board Badge */}
              {feedback.board && (
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
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
                <span>{feedback.comment_count}</span>
              </div>

              {/* Author & Time */}
              <span className="ml-auto text-xs">
                {feedback.author && <span className="font-medium">{feedback.author.name}</span>}
                {feedback.author && " · "}
                {formatDistanceToNow(new Date(feedback.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
