"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { postService, Post, Comment, getPostAuthorDisplayName, isWidgetPost, getSourcePlatformBadgeStyle } from "@/services/postService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { IconDisplay } from "@/components/ui/icon-picker";
import {
  ArrowLeft,
  ArrowBigUp,
  MessageSquare,
  Calendar,
  Loader2,
  ThumbsUp,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { saveReturnUrl } from "@/lib/returnUrl";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://faddy.site";

interface PostDetailClientProps {
  /** True on a Cloudflare-for-SaaS custom hostname (set server-side). */
  isCustomHost: boolean;
}

export default function PostDetailClient({ isCustomHost }: PostDetailClientProps) {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Custom hosts are read-only (design (d)): no session exists there, so
  // every write affordance is a link to log in on the main app instead.
  const loginOnMainApp = () => {
    window.location.href = `${APP_URL}/login`;
  };

  // State
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [collapsedComments, setCollapsedComments] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchPostData();
  }, [postId]);

  const fetchPostData = async () => {
    try {
      setLoading(true);

      // Fetch post details
      const postResponse = await postService.getPublicPost(postId);
      setPost(postResponse.data.post);

      // Fetch comments
      const commentsResponse = await postService.getPublicPostComments(postId);
      const commentsData = commentsResponse.data.comments;

      // Build threaded comment structure
      const threadedComments = buildCommentTree(commentsData);
      setComments(threadedComments);
    } catch (error: any) {
      console.error("Error fetching post:", error);
      setFetchError("Failed to load post details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Build threaded comment tree
  const buildCommentTree = (comments: Comment[]): Comment[] => {
    const commentMap: { [key: string]: Comment } = {};
    const rootComments: Comment[] = [];

    // Initialize map and replies array
    comments.forEach((comment) => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    // Build tree structure
    comments.forEach((comment) => {
      if (comment.parent_id) {
        const parent = commentMap[comment.parent_id];
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentMap[comment.id]);
        }
      } else {
        rootComments.push(commentMap[comment.id]);
      }
    });

    return rootComments;
  };

  // Handle upvote — same-origin POST through the public catch-all proxy
  const handleUpvote = async () => {
    if (isCustomHost) {
      loginOnMainApp();
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to upvote this post.",
        variant: "default",
      });
      saveReturnUrl();
      router.push("/login");
      return;
    }

    if (isUpvoting || !post) return;

    const wasUpvoted = isUpvoted;

    try {
      setIsUpvoting(true);

      // Optimistic update
      setIsUpvoted(!wasUpvoted);
      setPost({
        ...post,
        upvotes: wasUpvoted ? post.upvotes - 1 : post.upvotes + 1,
      });

      const response = await fetch(`/api/public/posts/${postId}/upvote`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Please log in to upvote");
        }
        throw new Error("Failed to upvote");
      }

      toast({
        title: "Success",
        description: wasUpvoted ? "Vote removed" : "Vote added",
      });
    } catch (error: any) {
      // Revert on error
      setIsUpvoted(wasUpvoted);
      setPost({
        ...post!,
        upvotes: wasUpvoted ? post!.upvotes + 1 : post!.upvotes - 1,
      });

      toast({
        title: "Login Required",
        description: error.message || "Please log in to upvote",
        variant: "destructive",
      });

      if (error.message?.includes("log in")) {
        saveReturnUrl();
        router.push("/login");
      }
    } finally {
      setIsUpvoting(false);
    }
  };

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (isCustomHost) {
      loginOnMainApp();
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to comment.",
        variant: "default",
      });
      saveReturnUrl();
      router.push("/login");
      return;
    }

    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);

      const response = await fetch(`/api/public/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Please log in to comment");
        }
        throw new Error("Failed to add comment");
      }

      // Refresh comments
      await fetchPostData();

      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Login Required",
        description: error.message || "Please log in to comment",
        variant: "destructive",
      });

      if (error.message?.includes("log in")) {
        saveReturnUrl();
        router.push("/login");
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle reply submission
  const handleSubmitReply = async (parentId: string) => {
    if (isCustomHost) {
      loginOnMainApp();
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to reply.",
        variant: "default",
      });
      router.push("/login");
      return;
    }

    if (!replyContent.trim()) return;

    try {
      const response = await fetch(`/api/public/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          content: replyContent.trim(),
          parent_id: parentId 
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Please log in to reply");
        }
        throw new Error("Failed to add reply");
      }

      // Refresh comments
      await fetchPostData();

      setReplyContent("");
      setReplyingTo(null);
      toast({
        title: "Success",
        description: "Reply added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Login Required",
        description: error.message || "Please log in to reply",
        variant: "destructive",
      });

      if (error.message?.includes("log in")) {
        router.push("/login");
      }
    }
  };

  // Handle comment like
  const handleCommentLike = async (commentId: string) => {
    if (isCustomHost) {
      loginOnMainApp();
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to like comments.",
        variant: "default",
      });
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`/api/public/posts/${postId}/comments/${commentId}/like`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Please log in to like comments");
        }
        throw new Error("Failed to like comment");
      }

      // Refresh comments to get updated like counts
      await fetchPostData();
    } catch (error: any) {
      toast({
        title: "Login Required",
        description: error.message || "Please log in to like comments",
        variant: "destructive",
      });

      if (error.message?.includes("log in")) {
        router.push("/login");
      }
    }
  };

  // Toggle comment collapse
  const toggleCommentCollapse = (commentId: string) => {
    setCollapsedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Render comment (recursive for threading)
  const renderComment = (comment: Comment, depth: number = 0) => {
    const isCollapsed = collapsedComments.has(comment.id);
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <div
        key={comment.id}
        className={`${depth > 0 ? "ml-5 border-l border-border pl-5 sm:ml-7 sm:pl-6" : ""}`}
      >
        <div className="flex items-start gap-3 py-5">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-secondary font-medium text-secondary-foreground">
              {comment.author?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-2">
            {/* Author and time */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-sm font-medium text-foreground">
                {comment.author?.name || "Anonymous"}
              </span>
              {comment.is_admin && (
                <Badge className="bg-primary/10 font-medium text-primary">
                  Admin
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {/* Comment content */}
            {!isCollapsed && (
              <>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {comment.content}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <button
                    onClick={() => handleCommentLike(comment.id)}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-primary motion-reduce:transition-none"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    <span className="tabular-nums">{comment.like_count || 0}</span>
                  </button>

                  {isAuthenticated && (
                    <button
                      onClick={() => setReplyingTo(comment.id)}
                      className="font-medium transition-colors hover:text-primary motion-reduce:transition-none"
                    >
                      Reply
                    </button>
                  )}

                  {hasReplies && (
                    <button
                      onClick={() => toggleCommentCollapse(comment.id)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-primary motion-reduce:transition-none"
                    >
                      {isCollapsed ? (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Show {comment.replies!.length} replies
                        </>
                      ) : (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Hide replies
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Reply form */}
                {replyingTo === comment.id && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Write a reply…"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[80px] border-border bg-background"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={!replyContent.trim()}
                        className="gap-1.5 transition-colors"
                      >
                        <Send className="h-3 w-3" />
                        Reply
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                        }}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {isCollapsed && hasReplies && (
              <button
                onClick={() => toggleCommentCollapse(comment.id)}
                className="whitespace-nowrap text-xs font-medium text-primary underline-offset-2 transition-colors hover:underline motion-reduce:transition-none"
              >
                Show {comment.replies!.length} replies
              </button>
            )}
          </div>
        </div>

        {/* Render replies */}
        {!isCollapsed && hasReplies && (
          <div className="space-y-0">
            {comment.replies!.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      open: "bg-secondary text-secondary-foreground",
      "under-review": "bg-primary/10 text-primary",
      planned: "bg-warning/15 text-foreground",
      "in-progress": "bg-progress/15 text-foreground",
      completed: "bg-success/15 text-foreground",
      closed: "bg-muted text-muted-foreground",
    };
    return colors[status] || colors.open;
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary motion-reduce:animate-none" />
          <p className="text-muted-foreground">Loading post…</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
        <div className="max-w-md space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <MessageSquare className="h-6 w-6 text-secondary-foreground" />
          </div>
          {fetchError && (
            <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">{fetchError}</p>
            </div>
          )}
          <h2 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
            Post Not Found
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            The post you’re looking for doesn’t exist or has been removed.
          </p>
          <Button onClick={() => router.push("/feedback")} className="gap-2 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Feedback
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-5xl px-4 py-8 sm:py-10">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/feedback")}
          className="-ml-2 mb-6 gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Feedback
        </Button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Main article */}
          <div className="space-y-8 lg:col-span-8">
            <article className="space-y-5">
              <div className="space-y-3">
                <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className={`border-0 font-medium capitalize ${getStatusColor(post.status)}`}>
                    {post.status.replace("-", " ")}
                  </Badge>
                  {post.board && (
                    <Badge variant="outline" className="gap-1.5 border-border font-medium">
                      <IconDisplay
                        iconName={post.board.icon}
                        className="h-3.5 w-3.5"
                        style={{ color: post.board.color }}
                      />
                      {post.board.name}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Meta line — gap-separated, no joiner */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-secondary text-[10px] font-medium text-secondary-foreground">
                      {(getPostAuthorDisplayName(post) || "U")[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">
                    {getPostAuthorDisplayName(post)}
                  </span>
                  {post.source_platform && (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getSourcePlatformBadgeStyle(post.source_platform)}`}>
                      {post.source_platform}
                    </span>
                  )}
                  {isWidgetPost(post) && (
                    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                      via Widget
                    </span>
                  )}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0" />
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="tabular-nums">{post.comment_count}</span>{" "}
                  {post.comment_count === 1 ? "comment" : "comments"}
                </span>
              </div>

              {post.description && (
                <p className="leading-relaxed whitespace-pre-wrap text-foreground">
                  {post.description}
                </p>
              )}
            </article>

            {/* Comments section */}
            <section className="space-y-2">
              <h2 className="font-headline mb-4 text-xl font-semibold tracking-tight text-foreground">
                <span className="tabular-nums">{comments.length}</span>{" "}
                {comments.length === 1 ? "comment" : "comments"}
              </h2>

              {comments.length > 0 ? (
                <div className="divide-y divide-border">
                  {comments.map((comment) => renderComment(comment))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    <MessageSquare className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    No comments yet. Be the first to share your thoughts.
                  </p>
                </div>
              )}

              {/* Add comment form (custom hosts: login link, read-only) */}
              <div className="pt-8">
                {isCustomHost ? (
                  <div className="rounded-lg border border-border bg-secondary/50 p-6 text-center">
                    <p className="mb-3 text-muted-foreground">
                      Log in on faddy.site to vote and comment.
                    </p>
                    <Button asChild className="transition-colors">
                      <a href={`${APP_URL}/login`}>Log in on faddy.site</a>
                    </Button>
                  </div>
                ) : isAuthenticated ? (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Share your thoughts…"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[100px] border-border bg-background"
                    />
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="gap-2 transition-colors"
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Post Comment
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-secondary/50 p-6 text-center">
                    <p className="mb-3 text-muted-foreground">
                      Please log in to comment.
                    </p>
                    <Button onClick={() => { saveReturnUrl(); router.push("/login"); }} className="transition-colors">
                      Log In
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Side rail */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-5 rounded-lg border border-border bg-card p-5">
              {/* Vote — big, confident (custom hosts: login link, read-only) */}
              {isCustomHost ? (
                <a
                  href={`${APP_URL}/login`}
                  title="Log in on faddy.site to vote"
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary px-4 py-3 transition-colors hover:bg-muted"
                >
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <ArrowBigUp className="h-5 w-5" />
                    Log in to vote
                  </span>
                  <span className="text-2xl font-semibold tabular-nums text-foreground">
                    {post.upvotes}
                  </span>
                </a>
              ) : (
                <Button
                  onClick={handleUpvote}
                  disabled={isUpvoting}
                  className={
                    isUpvoted
                      ? "flex h-auto w-full items-center justify-between gap-2 rounded-lg border border-primary bg-primary px-4 py-3 transition-colors hover:bg-primary/90"
                      : "flex h-auto w-full items-center justify-between gap-2 rounded-lg border border-border bg-secondary px-4 py-3 text-secondary-foreground transition-colors hover:bg-muted"
                  }
                >
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    {isUpvoting ? (
                      <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" />
                    ) : (
                      <ArrowBigUp
                        className={`h-5 w-5 ${isUpvoted ? "fill-current" : ""}`}
                      />
                    )}
                    {isUpvoted ? "Upvoted" : "Upvote"}
                  </span>
                  <span className="text-2xl font-semibold tabular-nums">
                    {post.upvotes}
                  </span>
                </Button>
              )}

              <Separator className="bg-border" />

              {/* Status */}
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary" className={`border-0 font-medium capitalize ${getStatusColor(post.status)}`}>
                  {post.status.replace("-", " ")}
                </Badge>
              </div>

              {/* Board */}
              {post.board && (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Board</span>
                  <Link
                    href={`/feedback/boards/${post.board.slug}`}
                    className="inline-flex min-w-0 items-center gap-2 font-medium text-foreground transition-colors hover:text-primary"
                  >
                    <IconDisplay
                      iconName={post.board.icon}
                      className="h-4 w-4 shrink-0"
                      style={{ color: post.board.color }}
                    />
                    <span className="truncate">{post.board.name}</span>
                  </Link>
                </div>
              )}

              {/* Created */}
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Submitted</span>
                <span>
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
