"use client";

import { useState, useEffect, useRef } from "react";
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
  BotMessageSquare,
} from "lucide-react";
import { Post, Comment, postService, getPostAuthorDisplayName, isAutopilotPost, getSourcePlatformBadgeStyle } from "@/services/postService";
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
          "flex gap-3 py-3.5 -mx-1 px-1 rounded-lg hover:bg-muted/40 dark:hover:bg-muted/20 transition-colors",
          comment.is_admin && "bg-blue-50/40 dark:bg-blue-900/10",
        )}
      >
        {/* Avatar */}
        <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
          <AvatarImage src={comment.author?.avatar_url || undefined} alt={comment.author?.name || "User"} />
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
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive dark:hover:text-destructive"
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
        <div className="ml-8 mt-2 mb-2">
          <div className="rounded-xl border border-border bg-muted/30 dark:bg-muted/20 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15 focus-within:bg-background transition-shadow">
            <Textarea
              placeholder="Write a reply…"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              autoFocus
              className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent dark:text-white text-sm px-3.5 pt-3 pb-1"
            />
            <div className="flex items-center justify-end gap-2 px-3 pb-2.5 pt-1">
              <Button
                variant="ghost"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent("");
                }}
                size="sm"
                className="h-8"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleReply(comment.id)}
                disabled={!replyContent.trim() || submittingComment}
                size="sm"
                className="h-8 gap-1.5 rounded-lg"
              >
                {submittingComment ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Replying…
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    Reply
                  </>
                )}
              </Button>
            </div>
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
  const [composerFocused, setComposerFocused] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [categoryValue, setCategoryValue] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const predefinedCategories = [
    { id: "1", name: "Feature Request" },
    { id: "2", name: "Bug Report" },
    { id: "3", name: "General Feedback" },
  ];

  const autoResizeComment = () => {
    const el = commentTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

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
      setComposerFocused(false);
      if (commentTextareaRef.current) {
        commentTextareaRef.current.style.height = "auto";
      }

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

  // Handle category update
  const handleCategoryUpdate = async (newCategory: string) => {
    if (!post) return;

    try {
      const response = await postService.updatePost(post.id, {
        category: newCategory || undefined,
      });
      onPostUpdated(response.data.post);
      setEditingCategory(false);
      setShowCustomCategory(false);
      setCustomCategory("");
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    }
  };

  // Handle category select change
  const handleCategorySelectChange = (value: string) => {
    if (value === "custom") {
      setShowCustomCategory(true);
      setCategoryValue("custom");
    } else if (value === "none") {
      handleCategoryUpdate("");
    } else {
      setShowCustomCategory(false);
      setCategoryValue(value);
      handleCategoryUpdate(value);
    }
  };

  // Handle custom category save
  const handleCustomCategorySave = () => {
    if (customCategory.trim()) {
      handleCategoryUpdate(customCategory.trim());
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
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p>Select a post to view details</p>
        </div>
      </div>
    );
  }

  const commentCount = comments.length;
  const userInitial =
    user?.name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <div className="flex-1 border-l border-gray-200 dark:border-border bg-gray-50 dark:bg-background flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Main Content - Left Side: post + comments as one continuous thread */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-background" style={{ height: '100%' }}>
        {/* Unified scroll: post content flows directly into comments */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Post Header with Upvote */}
          <div className="px-6 pt-6 pb-5">
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
                    upvoted ? "text-primary bg-primary/10 dark:bg-primary/20" : "text-muted-foreground hover:bg-muted dark:hover:bg-muted/50"
                  )}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-foreground">{post.upvotes}</span>
              </div>

              {/* Post Title and Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{post.title}</h1>
                  {(user?.organization_role === "admin" || user?.organization_role === "owner" || post.author?.id === user?.id) && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={openEditDialog}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary dark:hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeletePost}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive dark:hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Author and time — widget posts use external_author or org_end_user;
                    Posts with source_platform show the original submitter + platform badge */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                  {(isAutopilotPost(post) || post.source_platform) ? (
                    <>
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          <BotMessageSquare className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {getPostAuthorDisplayName(post)}
                      </span>
                      {post.source_platform && (
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getSourcePlatformBadgeStyle(post.source_platform)}`}>
                          {post.source_platform}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={(post.author as { avatar_url?: string })?.avatar_url || undefined} />
                        <AvatarFallback>
                          {getPostAuthorDisplayName(post)[0]?.toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {getPostAuthorDisplayName(post)}
                      </span>
                      {(post.external_author || post.org_end_user) && (
                        <span className="inline-flex items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                          via Widget
                        </span>
                      )}
                    </>
                  )}
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>

                {/* Description */}
                {post.description && (
                  <p className="text-foreground/80 dark:text-foreground/70 leading-relaxed whitespace-pre-wrap mt-3">
                    {post.description}
                  </p>
                )}

                {/* Images Gallery */}
                {post.images && post.images.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
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

          {/* Comments — continuous with post, no Activity Feed barrier */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 mb-1 pt-1">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                {commentCount === 0
                  ? "Comments"
                  : `${commentCount} ${commentCount === 1 ? "comment" : "comments"}`}
              </h3>
            </div>

            {loadingComments ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted/60">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No comments yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start the conversation with the team or customer.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {organizeComments(comments).map((comment) => (
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
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment composer — Twitter-style */}
        <div className="flex-shrink-0 border-t border-border bg-white dark:bg-background px-4 py-3 sm:px-5">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0 mt-0.5">
              <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || "You"} />
              <AvatarFallback className="text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold">
                {userInitial}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <textarea
                ref={commentTextareaRef}
                placeholder={user ? "Post your reply" : "Sign in to leave a comment"}
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  autoResizeComment();
                }}
                onFocus={() => {
                  setComposerFocused(true);
                  if (!user && onAuthRequired) onAuthRequired();
                }}
                onBlur={() => {
                  if (!newComment.trim()) setComposerFocused(false);
                }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                rows={1}
                disabled={!user && !onAuthRequired}
                className={cn(
                  "w-full resize-none bg-transparent border-0 outline-none shadow-none focus-visible:ring-0",
                  "text-[17px] leading-6 text-foreground placeholder:text-muted-foreground/70",
                  "py-2 min-h-[40px] max-h-[200px] overflow-y-auto",
                  "disabled:cursor-not-allowed disabled:opacity-60"
                )}
              />

              {/* Action bar — expands when focused or has text (Twitter pattern) */}
              <div
                className={cn(
                  "flex items-center justify-end gap-3 transition-all duration-200",
                  composerFocused || newComment.trim()
                    ? "opacity-100 max-h-12 pt-2 mt-1 border-t border-border"
                    : "opacity-100 max-h-12 pt-1"
                )}
              >
                {newComment.length > 0 && (
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      newComment.length > 480 ? "text-amber-500" : "text-muted-foreground"
                    )}
                  >
                    {newComment.length}
                  </span>
                )}
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submittingComment}
                  size="sm"
                  className={cn(
                    "rounded-full h-9 px-4 font-bold text-[15px] shadow-none",
                    "bg-primary hover:bg-primary/90 text-primary-foreground",
                    "disabled:bg-primary/50 disabled:text-primary-foreground/80 disabled:opacity-100"
                  )}
                >
                  {submittingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Reply"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End of Main Content */}

      {/* Details Sidebar - Right Side */}
      <div className="w-80 bg-white dark:bg-card border-l border-gray-200 dark:border-border flex-shrink-0 overflow-y-auto min-h-screen">
        <div className="p-6 space-y-6">
          <h3 className="font-semibold text-lg text-foreground">Details</h3>

          <div className="space-y-4">
            {/* Public Link */}
            <div>
              <label className="text-sm font-bold text-foreground block mb-3">
                🔗 Public Board Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={getPublicLink()}
                  readOnly
                  placeholder="Loading link..."
                  className="flex-1 text-sm bg-gray-100 dark:bg-muted border-2 border-gray-300 dark:border-border rounded-lg px-4 py-3 truncate text-primary font-medium"
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
              <label className="text-sm text-muted-foreground block mb-2">Board</label>
              <div className="text-sm font-medium text-foreground">
                {currentBoard?.name || post.board?.name || "—"}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Status</label>
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
                <div className="text-sm font-medium text-foreground">
                  {STATUS_OPTIONS.find(s => s.value === post.status)?.label || post.status}
                </div>
              )}
            </div>

            {/* Owner - Placeholder */}
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Owner</label>
              <div className="text-sm text-muted-foreground">
                {(isAutopilotPost(post) || post.source_platform) ? (
                  <>
                    <span>{getPostAuthorDisplayName(post)}</span>
                    {post.source_platform && (
                      <span className={`ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getSourcePlatformBadgeStyle(post.source_platform)}`}>
                        {post.source_platform}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    {getPostAuthorDisplayName(post)}
                    {(post.external_author || post.org_end_user) && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary dark:bg-primary/20 dark:text-primary">
                        via Widget
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* User Attributes (Widget SDK Context) */}
            {(post.org_end_user?.custom_fields || post.external_author?.context) &&
              Object.keys(post.org_end_user?.custom_fields || post.external_author?.context || {}).length > 0 && (
              <div>
                <label className="text-sm text-muted-foreground block mb-3">User Attributes</label>
                <div className="flex flex-col gap-2">
                  {Object.entries(post.org_end_user?.custom_fields || post.external_author?.context || {}).map(([key, val]) => (
                    <div key={key} className="flex flex-col bg-gray-50 dark:bg-muted/50 rounded-md p-2 border border-gray-100 dark:border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{key}</span>
                      <span className="text-sm font-medium text-foreground break-words font-mono text-[13px]">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estimated - Placeholder */}
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Estimated</label>
              <div className="text-sm text-muted-foreground">Comming soon</div>
            </div>

            {/* Category — editable */}
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Category</label>
              {(user?.organization_role === "admin" || user?.organization_role === "owner") ? (
                editingCategory ? (
                  <div className="space-y-2">
                    <Select
                      value={showCustomCategory ? "custom" : categoryValue}
                      onValueChange={handleCategorySelectChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Category</SelectItem>
                        {predefinedCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom Category</SelectItem>
                      </SelectContent>
                    </Select>
                    {showCustomCategory && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter custom category"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          maxLength={100}
                          className="text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCustomCategorySave();
                            if (e.key === "Escape") {
                              setEditingCategory(false);
                              setShowCustomCategory(false);
                              setCustomCategory("");
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={handleCustomCategorySave}
                          disabled={!customCategory.trim()}
                          className="flex-shrink-0"
                        >
                          Save
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {!showCustomCategory && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCategory(false);
                            setShowCustomCategory(false);
                            setCustomCategory("");
                          }}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingCategory(true);
                      setCategoryValue(post.category || "");
                    }}
                    className="text-sm font-medium text-foreground hover:text-primary dark:hover:text-primary transition-colors text-left w-full"
                  >
                    {post.category || currentBoard?.category || (
                      <span className="text-muted-foreground italic">Add category</span>
                    )}
                  </button>
                )
              ) : (
                <div className="text-sm font-medium text-foreground">
                  {post.category || currentBoard?.category || "N/A"}
                </div>
              )}
            </div>

            {/* Add to Roadmap Button */}
            {(user?.organization_role === "admin" || user?.organization_role === "owner") && (
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Roadmap</label>
                <Button
                  onClick={() => setShowRoadmapModal(true)}
                  variant="outline"
                  className="w-full justify-start gap-2 dark:border-border dark:hover:bg-muted"
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
            <label className="text-sm text-muted-foreground block mb-2">Tags</label>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">Comming soon</button>
          </div>

          {/* Voter Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted-foreground">{post.upvotes} Voter{post.upvotes !== 1 ? 's' : ''}</label>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">Comming soon</button>
            </div>
          </div>
        </div>
      </div>
      {/* End of Details Sidebar */}

      {/* Edit Post Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="dark:bg-background dark:border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Post</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the title and description of this post
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title" className="text-foreground">Title *</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Enter post title"
                className="mt-1 dark:bg-card dark:border-border dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="text-foreground">Description</Label>
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
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="dark:bg-card dark:border-border dark:text-foreground dark:hover:bg-muted">
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
