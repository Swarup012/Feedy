"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PostDetailsSkeleton } from "./PostsListSkeleton";
import AddToRoadmapModal from "@/components/roadmap/AddToRoadmapModal";
import { CompletionChangelogDialog } from "./CompletionChangelogDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowUp,
  MessageSquare,
  ExternalLink,
  Trash2,
  Send,
  Loader2,
  Eye,
  Edit2,
  Pencil,
  Heart,
  Reply,
} from "lucide-react";
import { Post, Comment, postService } from "@/services/postService";
import { Board } from "@/services/boardService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/context/OrganizationContext";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { usePostRealtime } from "@/hooks/usePostRealtime";

// 🔥 GLOBAL cache for comments (persists across post switches!)
const commentsCache: Record<string, Comment[]> = {};

interface PostDetailsProps {
  post: Post | null;
  currentBoard: Board | null;
  boards?: Board[]; // Optional: array of all boards for fallback
  onPostUpdated: (post: Post) => void;
  onPostDeleted: (postId: string) => void;
  onAuthRequired?: () => void; // Optional callback for when auth is required
}

const STATUS_OPTIONS = [
  {
    value: "open",
    label: "Open",
    color: "bg-gray-100 text-gray-800",
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
    value: "under-review",
    label: "In Review",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "closed",
    label: "Closed",
    color: "bg-red-100 text-red-800",
  },
];

// Recursive CommentItem component
interface CommentItemProps {
  comment: Comment;
  user: any;
  depth: number;
  replyingTo: string | null;
  replyContent: string;
  submittingComment: boolean;
  setReplyingTo: (id: string | null) => void;
  setReplyContent: (content: string) => void;
  handleToggleCommentLike: (commentId: string) => void;
  handleDeleteComment: (commentId: string) => void;
  handleReply: (parentId: string) => void;
}

function CommentItem({
  comment,
  user,
  depth,
  replyingTo,
  replyContent,
  submittingComment,
  setReplyingTo,
  setReplyContent,
  handleToggleCommentLike,
  handleDeleteComment,
  handleReply,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const maxDepth = 5; // Maximum nesting level for visual indentation
  const indentClass = depth > 0 ? `ml-${Math.min(depth * 8, maxDepth * 8)}` : "";
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className={depth > 0 ? "ml-8 mt-2" : ""}>
      <div
        className={cn(
          "flex gap-3 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors",
          comment.is_admin && "bg-blue-50/30 dark:bg-blue-900/10",
        )}
      >
        {/* Avatar */}
        <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
          <AvatarImage src={comment.author?.avatar_url || ""} alt={comment.author?.name || "User"} />
          <AvatarFallback className="text-xs">
            {comment.author?.name?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Name, Badge, Time, Delete */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-sm text-foreground">
              {comment.author?.name}
            </span>
            {comment.is_admin && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                Admin
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
              })}
            </span>
            <div className="ml-auto">
              {(user?.id === comment.author_id ||
                user?.organization_role === "admin" ||
                user?.organization_role === "owner") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteComment(comment.id)}
                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Comment Text */}
          <p className="text-sm text-foreground whitespace-pre-wrap mb-2 leading-relaxed">
            {comment.content}
          </p>

          {/* Actions: Like, Reply, Show Replies */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleCommentLike(comment.id)}
              className={cn(
                "h-7 px-2 gap-1.5 hover:bg-red-50 dark:hover:bg-red-900/20",
                comment.user_has_liked && "text-red-500 hover:text-red-600"
              )}
            >
              <Heart 
                className={cn(
                  "h-3.5 w-3.5",
                  comment.user_has_liked && "fill-current"
                )}
              />
              <span className="text-xs font-medium">
                {comment.like_count || 0}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(comment.id)}
              className="h-7 px-2 gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600"
            >
              <Reply className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Reply</span>
            </Button>
            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="h-7 px-2 gap-1.5 text-primary hover:bg-primary/10"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">
                  {showReplies ? 'Hide' : 'Show'} {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reply input */}
      {replyingTo === comment.id && (
        <div className="ml-8 mt-2 space-y-2">
          <Textarea
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={2}
            className="resize-none text-sm dark:bg-card dark:border-border dark:text-white"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleReply(comment.id)}
              disabled={!replyContent.trim() || submittingComment}
              size="sm"
            >
              {submittingComment ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Replying...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-3 w-3" />
                  Reply
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setReplyingTo(null);
                setReplyContent("");
              }}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Render nested replies recursively (only if showReplies is true) */}
      {hasReplies && showReplies && (
        <div className="mt-2 space-y-2">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              user={user}
              depth={depth + 1}
              replyingTo={replyingTo}
              replyContent={replyContent}
              submittingComment={submittingComment}
              setReplyingTo={setReplyingTo}
              setReplyContent={setReplyContent}
              handleToggleCommentLike={handleToggleCommentLike}
              handleDeleteComment={handleDeleteComment}
              handleReply={handleReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PostDetails({
  post,
  currentBoard,
  boards,
  onPostUpdated,
  onPostDeleted,
  onAuthRequired,
}: PostDetailsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
  });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showChangelogDialog, setShowChangelogDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // Real-time Socket.io updates
  usePostRealtime({
    postId: post?.id || '',
    onCommentNew: (comment) => {
      console.log('💬 [PostDetails] Real-time: New comment received', comment);
      
      setComments((prev) => {
        // Check if comment already exists (avoid duplicates)
        const exists = prev.some(c => c.id === comment.id);
        if (exists) {
          console.log('💬 [PostDetails] Comment already exists, skipping duplicate');
          return prev;
        }
        
        console.log('💬 [PostDetails] Adding comment to state');
        const updated = [...prev, comment];
        
        // Update cache
        if (post?.id && commentsCache[post.id]) {
          commentsCache[post.id] = updated;
          console.log('✅ Added comment to cache');
        }
        
        return updated;
      });
    },
    onCommentDeleted: (commentId) => {
      console.log('🗑️ [PostDetails] Real-time: Comment deleted', commentId);
      setComments((prev) => {
        const updated = prev.filter((c) => c.id !== commentId);
        
        // Update cache
        if (post?.id && commentsCache[post.id]) {
          commentsCache[post.id] = updated;
          console.log('✅ Deleted comment from cache');
        }
        
        return updated;
      });
    },
    onPostUpvoted: (data) => {
      console.log('⬆️ [PostDetails] Real-time: Post upvoted', data);
      if (post) {
        onPostUpdated({ ...post, upvotes: data.upvoteCount });
      }
    },
    onCommentCountChanged: (commentCount) => {
      console.log('💬 [PostDetails] Real-time: Comment count changed to', commentCount);
      if (post) {
        onPostUpdated({ ...post, comment_count: commentCount });
      }
    },
  });

  // Helper function to organize comments into a tree structure
  const organizeComments = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create a map of all comments with empty replies array
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into tree structure
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies!.push(commentWithReplies);
        } else {
          // If parent not found, treat as root comment
          rootComments.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  // Fetch comments when post changes
  useEffect(() => {
    if (post) {
      // 🚀 Check cache first
      if (commentsCache[post.id]) {
        console.log('⚡ Comments cache HIT for post:', post.id, commentsCache[post.id].length, 'comments');
        setComments(commentsCache[post.id]);
        setLoadingPost(false);
        
        // Background refresh (silent update) - use public endpoint for guests
        const refreshMethod = user ? postService.getComments : postService.getPublicPostComments;
        refreshMethod(post.id)
          .then(response => {
            commentsCache[post.id] = response.data.comments;
            setComments(response.data.comments);
            console.log('🔄 Comments background refresh complete');
          })
          .catch(err => console.log('⚠️ Comments background refresh failed:', err));
      } else {
        console.log('📡 Comments cache MISS - Fetching for post:', post.id);
        setLoadingPost(true);
        fetchComments().finally(() => setLoadingPost(false));
      }
    }
  }, [post?.id]);

  const fetchComments = async () => {
    if (!post) return;

    try {
      setLoadingComments(true);
      // Use public endpoint for guests, authenticated endpoint for logged-in users
      const fetchMethod = user ? postService.getComments : postService.getPublicPostComments;
      const response = await fetchMethod(post.id);
      commentsCache[post.id] = response.data.comments; // Cache it
      setComments(response.data.comments);
      console.log('💾 Cached comments for post:', post.id, response.data.comments.length);
    } catch (error: any) {
      console.error('❌ Error fetching comments:', error);
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

    // If changing to "completed", show changelog dialog first
    if (newStatus === "completed" && post.status !== "completed") {
      setPendingStatus(newStatus);
      setShowChangelogDialog(true);
      return;
    }

    // Otherwise, update status directly
    await updatePostStatus(newStatus);
  };

  // Update post status (called directly or after changelog dialog)
  const updatePostStatus = async (newStatus: string) => {
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

  // Handle changelog created (after completion)
  const handleChangelogCreated = async (changelogId: string) => {
    if (!pendingStatus) return;
    
    // Update the post status now
    await updatePostStatus(pendingStatus);
    setPendingStatus(null);
    
    toast({
      title: "Success!",
      description: "Post marked as completed and changelog published",
    });
  };

  // Handle skip changelog
  const handleSkipChangelog = async () => {
    if (!pendingStatus) return;
    
    // Still update the post status
    await updatePostStatus(pendingStatus);
    setPendingStatus(null);
  };

  // Handle upvote toggle
  const handleUpvote = async () => {
    if (!post) return;

    // Check if user is authenticated
    if (!user && onAuthRequired) {
      onAuthRequired();
      return;
    }

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

    // Check if user is authenticated
    if (!user && onAuthRequired) {
      onAuthRequired();
      return;
    }

    try {
      setSubmittingComment(true);
      await postService.addComment(post.id, newComment);
      setNewComment("");

      // Don't manually add comment - let real-time Socket.io handle it
      // This prevents duplicate comments when the socket event fires

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
      
      // Don't manually remove comment - let real-time Socket.io handle it
      // This prevents issues when the socket event fires

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

  // Handle toggle comment like
  const handleToggleCommentLike = async (commentId: string) => {
    if (!post) return;

    // Check if user is authenticated
    if (!user && onAuthRequired) {
      onAuthRequired();
      return;
    }

    try {
      const response = await postService.toggleCommentLike(post.id, commentId);
      
      // Update comment in the list
      const updatedComments = comments.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            user_has_liked: response.data.liked,
            like_count: response.data.liked ? (c.like_count || 0) + 1 : (c.like_count || 0) - 1,
          };
        }
        return c;
      });
      
      setComments(updatedComments);
      
      // Update cache
      if (commentsCache[post.id]) {
        commentsCache[post.id] = updatedComments;
        console.log('✅ Updated comment like in cache');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to toggle like",
        variant: "destructive",
      });
    }
  };

  // Handle reply to comment
  const handleReply = async (parentId: string) => {
    if (!post || !replyContent.trim()) return;

    // Check if user is authenticated
    if (!user && onAuthRequired) {
      onAuthRequired();
      return;
    }

    try {
      setSubmittingComment(true);
      await postService.addComment(post.id, replyContent, parentId);
      setReplyContent("");
      setReplyingTo(null);

      // Don't manually add reply - let real-time Socket.io handle it
      // This prevents duplicate comments when the socket event fires

      toast({
        title: "Success",
        description: "Reply added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add reply",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
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

  // Open edit dialog
  const openEditDialog = () => {
    if (!post) return;
    setEditFormData({
      title: post.title,
      description: post.description || '',
    });
    setShowEditDialog(true);
  };

  // Handle edit post
  const handleEditPost = async () => {
    if (!post) return;

    if (!editFormData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await postService.updatePost(post.id, {
        title: editFormData.title,
        description: editFormData.description,
      });
      onPostUpdated(response.data.post);
      setShowEditDialog(false);
      toast({
        title: "Success",
        description: "Post updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update post",
        variant: "destructive",
      });
    }
  };

  // Get public link - Links to individual public post page
  const getPublicLink = () => {
    // Safety check: only run on client side
    if (typeof window === 'undefined') {
      return "";
    }
    
    if (!post) {
      return "";
    }
    
    try {
      // Strategy 1: Use currentBoard.slug with post.id
      if (currentBoard && currentBoard.slug && post.id) {
        const link = `${window.location.origin}/board/${currentBoard.slug}/${post.id}`;
        return link;
      }
      
      // Strategy 2: Find board from boards array using post.board_id
      if (Array.isArray(boards) && boards.length > 0 && post.board_id && post.id) {
        const board = boards.find((b: any) => b && b.id === post.board_id);
        if (board && board.slug) {
          const link = `${window.location.origin}/board/${board.slug}/${post.id}`;
          return link;
        }
      }
      
      // Strategy 3: Extract slug from current URL
      const pathSegments = window.location.pathname.split('/');
      const slugIndex = pathSegments.indexOf('boards');
      if (slugIndex !== -1 && pathSegments[slugIndex + 1] && post.id) {
        const urlSlug = pathSegments[slugIndex + 1];
        const link = `${window.location.origin}/board/${urlSlug}/${post.id}`;
        return link;
      }
    } catch (error) {
      console.error('Error generating public link:', error);
    }
    
    return "";
  };

  // Show skeleton while loading
  if (loadingPost && post) {
    return (
      <div className="flex-1 border-l border-gray-200 dark:border-border bg-gray-50 dark:bg-background flex">
        <div className="flex-1 bg-white dark:bg-background">
          <PostDetailsSkeleton />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex-1 border-l border-gray-200 dark:border-border bg-gray-50 dark:bg-background flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p>Select a post to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 border-l border-gray-200 dark:border-border bg-gray-50 dark:bg-background flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Main Content - Left Side */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ height: '100%' }}>
        {/* Post Header with Upvote */}
        <div className="bg-white dark:bg-background p-6 border-b border-gray-200 dark:border-border flex-shrink-0 overflow-y-auto" style={{ maxHeight: 'calc(40vh - 64px)' }}>
          <div className="flex gap-4">
            {/* Upvote Button - Left Side */}
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUpvote}
                disabled={upvoting}
                className={cn(
                  "h-8 w-8 p-0 rounded-md",
                  upvoted ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{post.upvotes}</span>
            </div>

            {/* Post Title and Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{post.title}</h1>
                {(user?.organization_role === "admin" || user?.organization_role === "owner" || post.author?.id === user?.id) && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={openEditDialog}
                      className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeletePost}
                      className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Author and Time */}
              {post.author && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.author.avatar_url || ""} />
                    <AvatarFallback>{post.author.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{post.author.name || "Unknown"}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  {(user?.organization_role === "admin" || user?.organization_role === "owner" || post.author?.id === user?.id) && (
                    <>
                      <span>·</span>
                      <button
                        onClick={() => {/* Edit post inline */}}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit Post
                      </button>
                      <span>·</span>
                      <button
                        onClick={() => {/* Reply to post */}}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Reply
                      </button>
                      <span>·</span>
                      <button
                        onClick={handleDeletePost}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete Post
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Description */}
              {post.description && (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mt-3">
                  {post.description}
                </p>
              )}

              {/* Images Gallery */}
              {post.images && post.images.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Attachments ({post.images.length})
                  </p>
                  <div className={cn(
                    "grid gap-3",
                    post.images.length === 1 && "grid-cols-1 max-w-md",
                    post.images.length === 2 && "grid-cols-2",
                    post.images.length >= 3 && "grid-cols-3"
                  )}>
                    {post.images.map((url, index) => (
                      <div
                        key={index}
                        className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(url, '_blank')}
                      >
                        <img
                          src={url}
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Feed Section */}
        <div className="flex-1 flex flex-col bg-white dark:bg-background min-h-0">
          <div className="p-3 border-b border-gray-200 dark:border-border flex items-center justify-between flex-shrink-0 bg-white dark:bg-background">
            <h3 className="font-semibold text-base text-gray-900 dark:text-white">Activity Feed</h3>
            <Select defaultValue="all">
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="comments">Comments Only</SelectItem>
                <SelectItem value="status">Status Changes</SelectItem>
              </SelectContent>
            </Select>
          </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {loadingComments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            organizeComments(comments).map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                user={user}
                depth={0}
                replyingTo={replyingTo}
                replyContent={replyContent}
                submittingComment={submittingComment}
                setReplyingTo={setReplyingTo}
                setReplyContent={setReplyContent}
                handleToggleCommentLike={handleToggleCommentLike}
                handleDeleteComment={handleDeleteComment}
                handleReply={handleReply}
              />
            ))
          )}
        </div>

        {/* Add Comment - Sticky at bottom */}
        <div className="p-3 border-t-2 border-gray-300 dark:border-border bg-white dark:bg-card flex-shrink-0 shadow-lg">
          <div className="flex gap-2 items-end">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={1}
              className="resize-none dark:bg-card dark:border-border dark:text-white flex-1"
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || submittingComment}
              size="sm"
              className="shrink-0"
            >
              {submittingComment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        </div>
        {/* End of Activity Feed Section */}
      </div>
      {/* End of Main Content */}

      {/* Details Sidebar - Right Side */}
      <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-y-auto min-h-screen">
        <div className="p-6 space-y-6">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Details</h3>

          <div className="space-y-4">
            {/* Public Link */}
            <div>
              <label className="text-sm font-bold text-gray-900 dark:text-white block mb-3">
                🔗 Public Board Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={getPublicLink()}
                  readOnly
                  placeholder="Loading link..."
                  className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 truncate text-primary font-medium"
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
                  className="flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(getPublicLink())}
                  className="flex-shrink-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Board */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Board</label>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {currentBoard?.name || post.board?.name || "—"}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Status</label>
              {(user?.organization_role === "admin" || user?.organization_role === "owner") ? (
                <Select value={post.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {STATUS_OPTIONS.find(s => s.value === post.status)?.label || post.status}
                </div>
              )}
            </div>

            {/* Owner - Placeholder */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Owner</label>
              <div className="text-sm text-gray-500 dark:text-gray-400">{post.author?.name || "Unknown"}</div>
            </div>

            {/* Estimated - Placeholder */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Estimated</label>
              <div className="text-sm text-gray-500 dark:text-gray-400">Comming soon</div>
            </div>

            {/* Category */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Category</label>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {post.category || currentBoard?.category || "N/A"}
              </div>
            </div>

            {/* Add to Roadmap Button */}
            {(user?.organization_role === "admin" || user?.organization_role === "owner") && (
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Roadmap</label>
                <Button
                  onClick={() => setShowRoadmapModal(true)}
                  variant="outline"
                  className="w-full justify-start gap-2 dark:border-border dark:hover:bg-gray-800"
                  size="sm"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  Add to Roadmap
                </Button>
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Tags</label>
            <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Comming soon</button>
          </div>

          {/* Voter Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">{post.upvotes} Voter{post.upvotes !== 1 ? 's' : ''}</label>
              <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Comming soon</button>
            </div>
          </div>
        </div>
      </div>
      {/* End of Details Sidebar */}

      {/* Edit Post Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="dark:bg-background dark:border-border">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit Post</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Update the title and description of this post
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title" className="dark:text-gray-300">Title *</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Enter post title"
                className="mt-1 dark:bg-card dark:border-border dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="dark:text-gray-300">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Enter post description"
                rows={6}
                className="mt-1 dark:bg-card dark:border-border dark:text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="dark:bg-card dark:border-border dark:text-white dark:hover:bg-gray-700">
              Cancel
            </Button>
            <Button onClick={handleEditPost}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Roadmap Modal */}
      <AddToRoadmapModal
        isOpen={showRoadmapModal}
        onClose={() => setShowRoadmapModal(false)}
        postId={post.id}
        postTitle={post.title}
        organizationId={organization?.id || ''}
      />

      {/* Completion Changelog Dialog */}
      <CompletionChangelogDialog
        open={showChangelogDialog}
        onOpenChange={setShowChangelogDialog}
        postTitle={post.title}
        postDescription={post.description}
        postId={post.id}
        onChangelogCreated={handleChangelogCreated}
        onSkip={handleSkipChangelog}
      />
    </div>
  );
}
