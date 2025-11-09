"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ArrowUp, MessageSquare, Loader2 } from "lucide-react";
import { Post } from "@/services/postService";
import { Board } from "@/services/boardService";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { PostsListSkeleton } from "./PostsListSkeleton";

interface PostsListProps {
  posts: Post[];
  selectedPost: Post | null;
  loading: boolean;
  currentBoard: Board | null;
  onPostSelect: (post: Post) => void;
  onCreatePost: () => void;
  onSearchChange: (search: string) => void;
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

export function PostsList({
  posts,
  selectedPost,
  loading,
  currentBoard,
  onPostSelect,
  onCreatePost,
  onSearchChange,
}: PostsListProps) {
  return (
    <div className="flex-1 flex flex-col bg-white border-r">
      {/* Header */}
      <div className="p-4 border-b space-y-3 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <div>
            {currentBoard && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentBoard.icon}</span>
                <h1 className="text-xl font-bold">{currentBoard.name}</h1>
              </div>
            )}
          </div>
          <Button onClick={onCreatePost}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search posts..."
            className="pl-10"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Posts List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <PostsListSkeleton />
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="font-semibold text-lg mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-4">Be the first to create a post!</p>
            <Button onClick={onCreatePost}>
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => onPostSelect(post)}
                className={cn(
                  "w-full text-left p-4 hover:bg-gray-50 transition-colors",
                  selectedPost?.id === post.id &&
                    "bg-blue-50 border-l-4 border-blue-500",
                )}
              >
                <div className="space-y-2">
                  {/* Title */}
                  <h3 className="font-semibold text-sm line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Description */}
                  {post.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {post.description}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", STATUS_COLORS[post.status])}
                    >
                      {STATUS_LABELS[post.status]}
                    </Badge>

                    <div className="flex items-center gap-1">
                      <ArrowUp className="h-3 w-3" />
                      <span>{post.upvotes}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{post.comment_count}</span>
                    </div>

                    <span>
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Author */}
                  {post.author && (
                    <p className="text-xs text-gray-500">
                      by {post.author.name}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
