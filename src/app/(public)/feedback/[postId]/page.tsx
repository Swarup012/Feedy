"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { postService, Post, Comment } from "@/services/postService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowBigUp,
  MessageSquare,
  Calendar,
  User,
  Loader2,
  ThumbsUp,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TokenManager } from "@/lib/tokenManager";
import { saveReturnUrl } from "@/lib/returnUrl";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Helper to get subdomain for multi-tenancy
const getSubdomain = () => {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  
  // Handle production domains (e.g., acme.faddy.site)
  if (parts.length >= 3 && !hostname.includes("localhost")) {
    const subdomain = parts[0];
    if (subdomain === "www" || subdomain === "api" || subdomain === "admin") {
      return null;
    }
    return subdomain;
  }
  
  // Handle development (localhost with subdomain simulation)
  if (hostname.includes("localhost") && parts.length > 1 && parts[0] !== "localhost") {
    return parts[0];
  }
  
  return null;
};

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // State
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
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
      toast({
        title: "Error",
        description: "Failed to load post details",
        variant: "destructive",
      });
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

  // Handle upvote
  const handleUpvote = async () => {
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

      // Call API using public route (requires auth)
      const token = TokenManager.getAccessToken();
      const subdomain = getSubdomain();
      const response = await fetch(`${API_URL}/api/public/posts/${postId}/upvote`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...(subdomain && { 'x-subdomain': subdomain }),
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

      // Call API using public route (requires auth)
      const token = TokenManager.getAccessToken();
      const subdomain = getSubdomain();
      const response = await fetch(`${API_URL}/api/public/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...(subdomain && { 'x-subdomain': subdomain }),
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
      // Call API using public route (requires auth)
      const token = TokenManager.getAccessToken();
      const subdomain = getSubdomain();
      const response = await fetch(`${API_URL}/api/public/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...(subdomain && { 'x-subdomain': subdomain }),
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
      const token = TokenManager.getAccessToken();
      const subdomain = getSubdomain();
      const response = await fetch(`${API_URL}/api/public/posts/${postId}/comments/${commentId}/like`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...(subdomain && { 'x-subdomain': subdomain }),
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
        className={`${depth > 0 ? "ml-8 border-l-2 border-muted pl-4" : ""}`}
      >
        <div className="py-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {comment.author?.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              {/* Author and time */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">
                  {comment.author?.name || "Anonymous"}
                </span>
                {comment.is_admin && (
                  <Badge variant="default" className="text-xs">
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
                  <p className="text-sm whitespace-pre-wrap">
                    {comment.content}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <button
                      onClick={() => handleCommentLike(comment.id)}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span>{comment.like_count || 0}</span>
                    </button>

                    {isAuthenticated && (
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="hover:text-primary transition-colors"
                      >
                        Reply
                      </button>
                    )}

                    {hasReplies && (
                      <button
                        onClick={() => toggleCommentCollapse(comment.id)}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
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
                        placeholder="Write a reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={!replyContent.trim()}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent("");
                          }}
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
                  className="text-xs text-primary hover:underline"
                >
                  Show {comment.replies!.length} replies
                </button>
              )}
            </div>
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
      open: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      "under-review":
        "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      planned: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
      "in-progress": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
      completed: "bg-green-500/10 text-green-700 dark:text-green-400",
      closed: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    };
    return colors[status] || colors.open;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-switzer font-medium">Post Not Found</h2>
          <p className="text-muted-foreground">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push("/feedback")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feedback
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/feedback")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feedback
        </Button>

        {/* Post content */}
        <Card>
          <CardHeader>
            <div className="flex gap-6">
              {/* Large upvote button */}
              <div className="flex flex-col items-center">
                <Button
                  variant={isUpvoted ? "default" : "outline"}
                  size="lg"
                  onClick={handleUpvote}
                  disabled={isUpvoting}
                  className="w-16 h-16 flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform"
                >
                  {isUpvoting ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <ArrowBigUp
                        className={`h-6 w-6 ${isUpvoted ? "fill-current" : ""}`}
                      />
                      <span className="text-sm font-switzer font-medium">{post.upvotes}</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Post details */}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getStatusColor(post.status)}>
                      {post.status.replace("-", " ")}
                    </Badge>
                    {post.board && (
                      <Badge variant="outline" className="gap-1">
                        <span>{post.board.icon}</span>
                        {post.board.name}
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-3xl font-switzer font-medium">{post.title}</h1>
                </div>

                {post.description && (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {post.description}
                  </p>
                )}

                {/* Meta info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{post.author?.name || "Anonymous"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.comment_count} comments</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Comments section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <h2 className="text-xl font-semibold">
                Comments ({comments.length})
              </h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add comment form */}
            {isAuthenticated ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Post Comment
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground mb-3">
                  Please log in to comment
                </p>
                <Button onClick={() => { saveReturnUrl(); router.push("/login"); }}>Log In</Button>
              </div>
            )}

            <Separator />

            {/* Comments list */}
            {comments.length > 0 ? (
              <div className="space-y-0 divide-y">
                {comments.map((comment) => renderComment(comment))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
