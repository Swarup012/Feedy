"use client";

import { Post } from "@/services/postService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUp, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface FeedbackCardProps {
  feedback: Post;
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

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (feedback.board) {
      // Navigate to post detail page (you can create this later)
      router.push(`/feedback/${feedback.board.slug}/${feedback.id}`);
    }
  };

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{feedback.title}</h3>
              {feedback.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {feedback.description}
                </p>
              )}
            </div>

            {/* Upvote Button */}
            <Button
              variant="outline"
              size="sm"
              className="flex-col h-auto px-3 py-2"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement upvote (requires authentication)
              }}
            >
              <ArrowUp className="h-4 w-4 mb-1" />
              <span className="text-xs font-semibold">{feedback.upvotes}</span>
            </Button>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
            {/* Board Badge */}
            {feedback.board && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: feedback.board.color + "20",
                  color: feedback.board.color,
                }}
              >
                <span>{feedback.board.icon}</span>
                <span>{feedback.board.name}</span>
              </div>
            )}

            {/* Status Badge */}
            <Badge
              variant="secondary"
              className={cn("text-xs", STATUS_COLORS[feedback.status])}
            >
              {STATUS_LABELS[feedback.status]}
            </Badge>

            {/* Comments */}
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{feedback.comment_count} comments</span>
            </div>

            {/* Time */}
            <span className="ml-auto">
              {formatDistanceToNow(new Date(feedback.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Author */}
          {feedback.author && (
            <div className="text-xs text-gray-500 pt-2 border-t">
              Posted by {feedback.author.name}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
