"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PostDetailsSkeleton } from "./PostsListSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  ArrowUp,
  MessageSquare,
  ExternalLink,
  Trash2,
  Send,
  Loader2,
  Eye,
} from "lucide-react";
import { Post, Comment, postService } from "@/services/postService";
import { Board } from "@/services/boardService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface PostDetailsProps {
  post: Post | null;
  currentBoard: Board | null;
  onPostUpdated: (post: Post) => void;
  onPostDeleted: (postId: string) => void;
}

const STATUS_OPTIONS = [
  { value: "open", label: "Open", color: "bg-gray-100 text-gray-800" },
  {
    value: "under-review",
    label: "Under Review",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "planned",
    label: "Planned",
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "in-progress",
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-green-100 text-green-800",
  },
  { value: "closed", label: "Closed", color: "bg-red-100 text-red-800" },
];

export function PostDetails({
  post,
  currentBoard,
  onPostUpdated,
  onPostDeleted,
}: PostDetailsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  // Fetch comments when post changes
  useEffect(() => {
    if (post) {
      setLoadingPost(true);
      fetchComments().finally(() => setLoadingPost(false));
    }
  }, [post?.id]);

  const fetchComments = async () => {
    if (!post) return;

    try {
      setLoadingComments(true);
      const response = await postService.getComments(post.id);
      setComments(response.data.comments);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setLoadingComments(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!post) return;

    try {
      const response = await postService.updatePostStatus(post.id, newStatus);
      onPostUpdated(response.data.post);
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  // Handle upvote toggle
  const handleUpvote = async () => {
    if (!post) return;

    try {
      setUpvoting(true);
      const response = await postService.toggleUpvote(post.id);
      setUpvoted(response.data.upvoted);

      // Update post upvotes count
      const updatedPost = {
        ...post,
        upvotes: response.data.upvoted ? post.upvotes + 1 : post.upvotes - 1,
      };
      onPostUpdated(updatedPost);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to toggle upvote",
        variant: "destructive",
      });
    } finally {
      setUpvoting(false);
    }
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!post || !newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await postService.addComment(post.id, newComment);
      setComments([...comments, response.data.comment]);
      setNewComment("");

      // Update comment count
      onPostUpdated({ ...post, comment_count: post.comment_count + 1 });

      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;

    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await postService.deleteComment(post.id, commentId);
      setComments(comments.filter((c) => c.id !== commentId));

      // Update comment count
      onPostUpdated({ ...post, comment_count: post.comment_count - 1 });

      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  // Handle delete post
  const handleDeletePost = async () => {
    if (!post) return;

    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone.",
      )
    )
      return;

    try {
      await postService.deletePost(post.id);
      onPostDeleted(post.id);
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  // Get public link
  const getPublicLink = () => {
    if (!post || !currentBoard) return "";
    return `${window.location.origin}/board/${currentBoard.slug}/${post.id}`;
  };

  // Show skeleton while loading
  if (loadingPost && post) {
    return (
      <div className="w-96 border-l bg-white flex flex-col">
        <PostDetailsSkeleton />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-96 border-l bg-white flex items-center justify-center p-6">
        <div className="text-center text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Select a post to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 border-l bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-bold text-lg line-clamp-3">{post.title}</h2>
          {user?.role === "admin" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeletePost}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Upvote Button */}
        <Button
          variant={upvoted ? "default" : "outline"}
          size="sm"
          onClick={handleUpvote}
          disabled={upvoting}
          className="w-full"
        >
          <ArrowUp className="mr-2 h-4 w-4" />
          {upvoted ? "Upvoted" : "Upvote"} ({post.upvotes})
        </Button>
      </div>

      {/* Description */}
      {post.description && (
        <div className="p-4 border-b">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {post.description}
          </p>
        </div>
      )}

      {/* Meta Info */}
      <div className="p-4 border-b space-y-3">
        {/* Public Link */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">
            Public Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={getPublicLink()}
              readOnly
              className="flex-1 text-xs bg-gray-50 border rounded px-2 py-1"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(getPublicLink());
                toast({
                  title: "Copied!",
                  description: "Link copied to clipboard",
                });
              }}
              title="Copy link"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                window.open(getPublicLink());
              }}
              title="public view"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status Dropdown */}
        {user?.role === "admin" && (
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Status
            </label>
            <Select value={post.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", status.color)}>
                        {status.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Author */}
        {post.author && (
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Posted by
            </label>
            <p className="text-sm">{post.author.name}</p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments ({post.comment_count})
          </h3>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingComments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
              <Card
                key={comment.id}
                className={cn(
                  "p-3",
                  comment.is_admin && "bg-blue-50 border-blue-200",
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-sm flex items-center gap-2">
                      {comment.author?.name}
                      {comment.is_admin && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {(user?.id === comment.author_id ||
                    user?.role === "admin") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </Card>
            ))
          )}
        </div>

        {/* Add Comment */}
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || submittingComment}
              className="w-full"
              size="sm"
            >
              {submittingComment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
