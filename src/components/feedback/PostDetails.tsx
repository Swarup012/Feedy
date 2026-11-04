"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowUp,
  ArrowLeft,
  MessageSquare,
  ExternalLink,
  Trash2,
  Send,
  Loader2,
  Eye,
  Edit2,
  Heart,
  Reply,
  BotMessageSquare,
  GitMerge,
} from "lucide-react";
import { Post, Comment, postService, getPostAuthorDisplayName, isAutopilotPost, getSourcePlatformBadgeStyle } from "@/services/postService";
import { Board } from "@/services/boardService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/context/OrganizationContext";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { usePostRealtime } from "@/hooks/usePostRealtime";
import { PostRevenueLine } from "./PostRevenueLine";
import api from "@/lib/api";
import { useIsCustomHost } from "@/context/CustomHostContext";
import "./post-details.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://faddy.site";

// 🔥 GLOBAL cache for comments (persists across post switches!)
const commentsCache: Record<string, Comment[]> = {};

// 🔥 GLOBAL cache for merged history (folded-away sibling reports)
const mergedHistoryCache: Record<string, Post[]> = {};

// Provider icons — lifted verbatim from
// src/app/admin/settings/integrations/page.tsx:55-65
const DiscordIcon = ({ className }: { className?: string }) => (
  <img src="/images/icons/discord.svg" alt="Discord" className={className} />
);

const IntercomIcon = ({ className }: { className?: string }) => (
  <img src="/images/icons/intercom.svg" alt="Intercom" className={className} />
);

const SlackIcon = ({ className }: { className?: string }) => (
  <img src="/images/icons/slack-new.svg" alt="Slack" className={className} />
);

const SOURCE_PLATFORM_ICONS: Record<string, typeof DiscordIcon> = {
  discord: DiscordIcon,
  intercom: IntercomIcon,
  slack: SlackIcon,
};

interface PostDetailsProps {
  post: Post | null;
  currentBoard: Board | null;
  boards?: Board[]; // Optional: array of all boards for fallback
  onPostUpdated: (post: Post) => void;
  onPostDeleted: (postId: string) => void;
  onAuthRequired?: () => void; // Optional callback for when auth is required
  onBack?: () => void;
  isMobile?: boolean;
  className?: string; // Optional: override container classes (e.g. for Sheet usage)
}

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "planned", label: "Planned" },
  { value: "in-progress", label: "In Progress" },
  { value: "under-review", label: "Under Review" },
  { value: "completed", label: "Completed" },
  { value: "closed", label: "Closed" },
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
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div>
      <div className={cn("pd__cmt", comment.is_admin && "pd__cmt--admin")}>
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.author?.avatar_url || undefined} alt={comment.author?.name || "User"} />
          <AvatarFallback className="text-xs">
            {comment.author?.name?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        {/* Comment content */}
        <div className="pd__cmt-body">
          <div className="pd__cmt-head">
            <span className="pd__cmt-name">{comment.author?.name}</span>
            {comment.is_admin && <span className="pd__tag">Admin</span>}
            <span className="pd__cmt-when">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
              })}
            </span>
            {(user?.id === comment.author_id ||
              user?.organization_role === "admin" ||
              user?.organization_role === "owner") && (
              <button
                type="button"
                className="pd__icon-btn pd__icon-btn--danger pd__cmt-del"
                onClick={() => handleDeleteComment(comment.id)}
                aria-label="Delete comment"
              >
                <Trash2 aria-hidden="true" />
              </button>
            )}
          </div>

          <p className="pd__cmt-text">{comment.content}</p>

          <div className="pd__cmt-actions">
            <button
              type="button"
              onClick={() => handleToggleCommentLike(comment.id)}
              className={cn("pd__act pd__act--like", comment.user_has_liked && "is-liked")}
              aria-label={comment.user_has_liked ? "Remove like" : "Like comment"}
            >
              <Heart aria-hidden="true" />
              <span>{comment.like_count || 0}</span>
            </button>
            <button
              type="button"
              onClick={() => setReplyingTo(comment.id)}
              className="pd__act"
            >
              <Reply aria-hidden="true" />
              Reply
            </button>
            {hasReplies && (
              <button
                type="button"
                onClick={() => setShowReplies(!showReplies)}
                className="pd__act"
              >
                <MessageSquare aria-hidden="true" />
                {showReplies ? 'Hide' : 'Show'} {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply input */}
      {replyingTo === comment.id && (
        <div className="pd__replybox">
          <div className="pd__replybox-field">
            <Textarea
              placeholder="Write a reply…"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              autoFocus
              aria-label="Write a reply"
              className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm px-3.5 pt-3 pb-1"
            />
            <div className="pd__replybox-actions">
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
                className="h-8 gap-1.5"
              >
                {submittingComment ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    Replying…
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3" aria-hidden="true" />
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
        <div className="pd__replies">
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
  onBack,
  isMobile,
  className,
}: PostDetailsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isCustomHost = useIsCustomHost();
  const { organization } = useOrganization();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [mergedHistory, setMergedHistory] = useState<Post[]>([]);
  const [loadingMergedHistory, setLoadingMergedHistory] = useState(false);
  // Which post the mergedHistory array belongs to (same masking reason).
  const [mergedFor, setMergedFor] = useState<string | null>(null);
  // Which post the currently-held comments belong to. The thread header and
  // rail paint instantly from props; the comments block shows a skeleton
  // until the list for THIS post has arrived (module cache or fetch).
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
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
  const [editingCategory, setEditingCategory] = useState(false);
  const [categoryValue, setCategoryValue] = useState("");
  const [labels, setLabels] = useState<{ id: string; name: string }[]>([]);

  const defaultCategories = [
    { id: "1", name: "Feature Request" },
    { id: "2", name: "Bug Report" },
    { id: "3", name: "General Feedback" },
  ];

  const predefinedCategories = labels.length > 0 ? labels : defaultCategories;
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [confirmDeleteComment, setConfirmDeleteComment] = useState<string | null>(null);
  const [confirmDeletePost, setConfirmDeletePost] = useState(false);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

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
      setComments((prev) => {
        const exists = prev.some(c => c.id === comment.id);
        if (exists) return prev;
        
        const updated = [...prev, comment];
        if (post?.id && commentsCache[post.id]) {
          commentsCache[post.id] = updated;
        }
        return updated;
      });
    },
    onCommentDeleted: (commentId) => {
      setComments((prev) => {
        const updated = prev.filter((c) => c.id !== commentId);
        if (post?.id && commentsCache[post.id]) {
          commentsCache[post.id] = updated;
        }
        return updated;
      });
    },
    onPostUpvoted: (data) => {
      if (post) {
        onPostUpdated({ ...post, upvotes: data.upvoteCount });
      }
    },
    onCommentCountChanged: (commentCount) => {
      if (post) {
        onPostUpdated({ ...post, comment_count: commentCount });
      }
    },
  });

  // Organize comments into a tree structure (memoized)
  const organizedComments = useMemo(() => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies!.push(commentWithReplies);
        } else {
          rootComments.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  }, [comments]);

  // Fetch comments when post changes
  useEffect(() => {
    if (post) {
      if (commentsCache[post.id]) {
        setComments(commentsCache[post.id]);
        setCommentsFor(post.id);

        const refreshMethod = user ? postService.getComments : postService.getPublicPostComments;
        refreshMethod(post.id)
          .then(response => {
            commentsCache[post.id] = response.data.comments;
            setComments(response.data.comments);
          })
          .catch(() => {});
      } else {
        fetchComments();
      }
    }
  }, [post?.id]);

  // Fetch merged history when post changes — session-only: folded siblings
  // come from /api/posts/:id/merged-history, which is not a public endpoint,
  // so logged-out visitors (all custom-host visitors) never see the section.
  useEffect(() => {
    if (post && user) {
      if (mergedHistoryCache[post.id]) {
        setMergedHistory(mergedHistoryCache[post.id]);
        setMergedFor(post.id);

        postService
          .getFoldedPosts(post.id)
          .then((response) => {
            mergedHistoryCache[post.id] = response.data.posts;
            setMergedHistory(response.data.posts);
          })
          .catch(() => {});
      } else {
        fetchMergedHistory();
      }
    }
  }, [post?.id, user]);

  // Fetch labels from API when organization is available
  useEffect(() => {
    if (!organization?.id) return;

    let cancelled = false;
    api
      .get(`/api/organizations/${organization.id}/labels`)
      .then((res) => {
        if (!cancelled && res.data?.data?.labels?.length) {
          setLabels(res.data.data.labels);
        }
      })
      .catch(() => {
        // Fall back to defaults on error
      });

    return () => {
      cancelled = true;
    };
  }, [organization?.id]);

  const fetchComments = async () => {
    if (!post) return;
    const postId = post.id;

    try {
      setLoadingComments(true);
      const fetchMethod = user ? postService.getComments : postService.getPublicPostComments;
      const response = await fetchMethod(postId);
      commentsCache[postId] = response.data.comments;
      setComments(response.data.comments);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      // Unmask the comments block (skeleton → list/empty state) once the
      // load for this post settles, success or not — same as the old gate.
      setCommentsFor(postId);
      setLoadingComments(false);
    }
  };

  const fetchMergedHistory = async () => {
    if (!post || !user) return;
    const postId = post.id;

    try {
      setLoadingMergedHistory(true);
      const response = await postService.getFoldedPosts(postId);
      mergedHistoryCache[postId] = response.data.posts;
      setMergedHistory(response.data.posts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load merged reports",
        variant: "destructive",
      });
    } finally {
      setMergedFor(postId);
      setLoadingMergedHistory(false);
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
        description: "Status updated",
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

    // Custom hosts are read-only by design — no session there; the vote
    // affordance is a login link on the main app, never a POST.
    if (isCustomHost) {
      window.location.href = `${APP_URL}/login`;
      return;
    }

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

    if (isCustomHost) {
      window.location.href = `${APP_URL}/login`;
      return;
    }

    // Check if user is authenticated
    if (!user && onAuthRequired) {
      onAuthRequired();
      return;
    }

    try {
      setSubmittingComment(true);
      await postService.addComment(post.id, newComment);
      setNewComment("");
      if (commentTextareaRef.current) {
        commentTextareaRef.current.style.height = "auto";
      }

      // Don't manually add comment - let real-time Socket.io handle it
      // This prevents duplicate comments when the socket event fires

      toast({
      title: "Comment added",
      description: "Your reply has been posted.",
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

    setConfirmDeleteComment(commentId);
  };

  const executeDeleteComment = async (commentId: string) => {
    if (!post) return;

    try {
      await postService.deleteComment(post.id, commentId);
      
      // Don't manually remove comment - let real-time Socket.io handle it
      // This prevents issues when the socket event fires

      toast({
        title: "Comment deleted",
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

    if (isCustomHost) {
      window.location.href = `${APP_URL}/login`;
      return;
    }

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

    if (isCustomHost) {
      window.location.href = `${APP_URL}/login`;
      return;
    }

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
        title: "Reply added",
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

    setConfirmDeletePost(true);
  };

  const executeDeletePost = async () => {
    if (!post) return;

    try {
      await postService.deletePost(post.id);
      onPostDeleted(post.id);
      toast({
        title: "Post deleted",
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
        title: "Post updated",
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
        title: "Category updated",
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

    // Canonical post URL — the board slug is not part of the path (legacy
    // /board/<slug>/<postId> links 307 here on custom hosts).
    return post.id ? `${window.location.origin}/feedback/${post.id}` : "";
  };

  if (!post) {
    return (
      <div className={cn("pd", className)}>
        <p className="pd__notsel">Select a post to view details</p>
      </div>
    );
  }

  const commentCount = comments.length;
  // Comments held in state are for a previous post until this post's load
  // settles — skeleton in the comments block, neutral heading, never a
  // stale count or another post's list.
  const commentsPending = commentsFor !== post.id;
  const userInitial =
    user?.name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <div className={cn("pd", className)}>
      {/* Thread: post, folded reports and comments as one continuous document */}
      <div className="pd__thread">
        <div className="pd__scroll">
          {/* Mobile back button */}
          {isMobile && (
            <div className="pd__back md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="gap-1.5"
                aria-label="Back to posts list"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Button>
            </div>
          )}
          <div className="pd__head">
            {/* Upvote */}
            <div className="pd__vote">
              <button
                type="button"
                onClick={handleUpvote}
                disabled={upvoting}
                className={cn("pd__vote-btn", upvoted && "is-upvoted")}
                aria-label={upvoted ? "Remove upvote" : "Upvote post"}
              >
                <ArrowUp aria-hidden="true" />
              </button>
              <span className="pd__vote-count">{post.upvotes}</span>
            </div>

            <div className="pd__head-body">
              <div className="pd__title-row">
                <h1 className="pd__title">{post.title}</h1>
                {(user?.organization_role === "admin" || user?.organization_role === "owner" || post.author?.id === user?.id) && (
                  <div className="pd__tools">
                    <button
                      type="button"
                      className="pd__icon-btn"
                      onClick={openEditDialog}
                      aria-label="Edit post"
                    >
                      <Edit2 aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="pd__icon-btn pd__icon-btn--danger"
                      onClick={handleDeletePost}
                      aria-label="Delete post"
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              {/* Author and time — widget posts use external_author or org_end_user;
                  Posts with source_platform show the original submitter + platform badge */}
              <div className="pd__byline">
                {(isAutopilotPost(post) || post.source_platform) ? (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        <BotMessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="pd__author-name">{getPostAuthorDisplayName(post)}</span>
                    {post.source_platform && (
                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${getSourcePlatformBadgeStyle(post.source_platform)}`}>
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
                    <span className="pd__author-name">{getPostAuthorDisplayName(post)}</span>
                    {(post.external_author || post.org_end_user) && (
                      <span className="pd__tag">via Widget</span>
                    )}
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="pd__when">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              </div>

              {post.description && (
                <p className="pd__desc">{post.description}</p>
              )}

              {/* Attachments */}
              {post.images && post.images.length > 0 && (
                <div className="pd__attach">
                  <p className="pd__attach-caption">Attachments ({post.images.length})</p>
                  <div className={cn(
                    "pd__attach-grid",
                    post.images.length === 1 && "pd__attach-grid--1",
                    post.images.length === 2 && "pd__attach-grid--2",
                  )}>
                    {post.images.map((url, index) => (
                      <button
                        key={index}
                        type="button"
                        className="pd__attach-item"
                        onClick={() => window.open(url, '_blank')}
                        aria-label={`Open attachment ${index + 1} in new tab`}
                      >
                        <img
                          src={url}
                          alt={`Attachment ${index + 1}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Merged history — reports folded into this post (read-only) */}
          {mergedFor === post.id && mergedHistory.length > 0 && (
            <div className="pd__fold">
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="pd__fold-trigger">
                  <GitMerge aria-hidden="true" />
                  <span>
                    {mergedHistory.length} similar report
                    {mergedHistory.length === 1 ? "" : "s"} merged into this
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pd__fold-body">
                    {mergedHistory.map((item) => {
                      const SourceIcon = SOURCE_PLATFORM_ICONS[item.source_platform ?? ""];
                      return (
                        <div key={item.id} className="pd__merged-item">
                          <span className="pd__merged-icon">
                            {SourceIcon && <SourceIcon className="h-4 w-4" />}
                          </span>
                          <div className="pd__cmt-body">
                            <p className="pd__merged-text">{item.description}</p>
                            <span className="pd__merged-when">
                              {formatDistanceToNow(new Date(item.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Comments — continuous with the post, no barrier between them */}
          <div className="pd__comments">
            <div className="pd__comments-head">
              <MessageSquare aria-hidden="true" />
              <h2>
                {commentCount === 0 || commentsPending
                  ? "Comments"
                  : `${commentCount} ${commentCount === 1 ? "comment" : "comments"}`}
              </h2>
            </div>

            {commentsPending || loadingComments ? (
              <div className="space-y-4 pt-2" aria-busy="true">
                <span className="sr-only">Loading comments</span>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="pd__empty">
                <p className="pd__empty-title">No comments yet</p>
                <p className="pd__empty-note">
                  Start the conversation with the team or customer.
                </p>
              </div>
            ) : (
              <div className="pd__thread-list">
                {organizedComments.map((comment) => (
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

        {/* Comment composer — pinned under the thread */}
        <div className="pd__composer">
          <div className="pd__composer-row">
            <Avatar className="h-9 w-9 flex-shrink-0 mt-1">
              <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || "You"} />
              <AvatarFallback className="text-sm font-semibold">
                {userInitial}
              </AvatarFallback>
            </Avatar>

            <textarea
              ref={commentTextareaRef}
              placeholder={user ? "Post your reply" : "Sign in to leave a comment"}
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                autoResizeComment();
              }}
              onFocus={() => {
                if (!user && onAuthRequired && !isCustomHost) onAuthRequired();
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              rows={1}
              disabled={!user && !onAuthRequired}
              aria-label="Write a comment"
              className="pd__composer-input"
            />

            {newComment.length > 0 && (
              <span
                className={cn(
                  "pd__count",
                  newComment.length > 480 && "pd__count--warn"
                )}
              >
                {newComment.length}
              </span>
            )}
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || submittingComment}
              size="sm"
              className="pd__send h-9 px-4 font-semibold"
            >
              {submittingComment ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                "Reply"
              )}
            </Button>
          </div>
        </div>
      </div>
      {/* End of Main Content */}

      {/* Rail — field ledger (hidden on mobile) */}
      <aside className="pd__rail">
        <div className="pd__rail-inner">
          <h3 className="pd__rail-title">Details</h3>

          {/* Public Link */}
          <div className="pd__field">
            <label htmlFor="public-link" className="pd__field-label">
              Public link
            </label>
            <div className="pd__link-row">
              <input
                id="public-link"
                type="text"
                value={getPublicLink()}
                readOnly
                placeholder="Loading link…"
                className="pd__link"
              />
              <button
                type="button"
                className="pd__link-btn"
                onClick={() => {
                  navigator.clipboard.writeText(getPublicLink());
                  toast({
                    title: "Copied!",
                    description: "Link copied to clipboard",
                  });
                }}
                aria-label="Copy public link"
              >
                <ExternalLink aria-hidden="true" />
              </button>
              <button
                type="button"
                className="pd__link-btn"
                onClick={() => window.open(getPublicLink())}
                aria-label="Open public link in new tab"
              >
                <Eye aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Board */}
          <div className="pd__field">
            <span className="pd__field-label">Board</span>
            <span className="pd__field-value">
              {currentBoard?.name || post.board?.name || "—"}
            </span>
          </div>

          {/* Status */}
          <div className="pd__field">
            <label htmlFor="post-status" className="pd__field-label">Status</label>
            {(user?.organization_role === "admin" || user?.organization_role === "owner") ? (
              <Select value={post.status} onValueChange={handleStatusChange}>
                <SelectTrigger id="post-status" className="w-full">
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
              <span className="pd__field-value">
                {STATUS_OPTIONS.find(s => s.value === post.status)?.label || post.status}
              </span>
            )}
          </div>

          {/* Owner */}
          <div className="pd__field">
            <span className="pd__field-label">Owner</span>
            <div className="pd__byline">
              {(isAutopilotPost(post) || post.source_platform) ? (
                <>
                  <span className="pd__field-value pd__field-value--quiet">{getPostAuthorDisplayName(post)}</span>
                  {post.source_platform && (
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${getSourcePlatformBadgeStyle(post.source_platform)}`}>
                      {post.source_platform}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="pd__field-value pd__field-value--quiet">{getPostAuthorDisplayName(post)}</span>
                  {(post.external_author || post.org_end_user) && (
                    <span className="pd__tag">via Widget</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Known MRR (Phase 3) — admin-only; the component itself never
              fires the revenue request for non-admins or Free plans */}
          {post?.id && <PostRevenueLine postId={post.id} />}

          {/* User Attributes (Widget SDK Context) — owner/admin only; API
              also strips these fields for other roles (post.service.js
              sanitizeExternalAuthorEmbeds) */}
          {(user?.organization_role === "admin" || user?.organization_role === "owner") &&
            (post.org_end_user?.custom_fields || post.external_author?.context) &&
            Object.keys(post.org_end_user?.custom_fields || post.external_author?.context || {}).length > 0 && (
            <div className="pd__field">
              <span className="pd__field-label">User Attributes</span>
              <div className="pd__attrs">
                {Object.entries(post.org_end_user?.custom_fields || post.external_author?.context || {}).map(([key, val]) => (
                  <div key={key} className="pd__attr">
                    <span className="pd__attr-key">{key}</span>
                    <span className="pd__attr-val">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated — placeholder, stated as a fact, not a fake control */}
          <div className="pd__field">
            <span className="pd__field-label">Estimated completion</span>
            <p className="pd__soon">Coming soon</p>
          </div>

          {/* Category — editable */}
          <div className="pd__field">
            <label htmlFor="post-category" className="pd__field-label">Category</label>
            {(user?.organization_role === "admin" || user?.organization_role === "owner") ? (
              editingCategory ? (
                <div className="pd__field pd__field--tight">
                  <Select
                    value={showCustomCategory ? "custom" : categoryValue}
                    onValueChange={handleCategorySelectChange}
                  >
                    <SelectTrigger id="post-category" className="w-full">
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
                    <div className="pd__link-row">
                      <Input
                        id="custom-category-input"
                        placeholder="Enter custom category"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        maxLength={100}
                        className="text-sm flex-1 min-w-0"
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
                  {!showCustomCategory && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingCategory(false);
                        setShowCustomCategory(false);
                        setCustomCategory("");
                      }}
                      className="self-start px-0 text-sm"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(true);
                    setCategoryValue(post.category || "");
                  }}
                  className="pd__edit-value"
                  aria-label="Edit category"
                >
                  {post.category || currentBoard?.category || (
                    <span className="pd__field-value--quiet">Add category</span>
                  )}
                </button>
              )
            ) : (
              <span className="pd__field-value">
                {post.category || currentBoard?.category || "No category"}
              </span>
            )}
          </div>

          {/* Add to Roadmap */}
          {(user?.organization_role === "admin" || user?.organization_role === "owner") && (
            <div className="pd__field">
              <span className="pd__field-label">Roadmap</span>
              <Button
                onClick={() => setShowRoadmapModal(true)}
                variant="outline"
                size="sm"
                className="pd__roadmap-btn h-9"
              >
                <svg
                  aria-hidden="true"
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

          {/* Facts the product does not have yet — quiet text, never buttons */}
          <div className="pd__field">
            <span className="pd__field-label">Tags</span>
            <p className="pd__soon">Coming soon</p>
          </div>

          <div className="pd__field">
            <span className="pd__field-label">
              {post.upvotes} Upvote{post.upvotes !== 1 ? 's' : ''}
            </span>
            <p className="pd__soon">Coming soon</p>
          </div>
        </div>
      </aside>

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

      {/* Confirm: Delete Comment */}
      <ConfirmDialog
        open={confirmDeleteComment !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteComment(null); }}
        title="Delete comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteComment) executeDeleteComment(confirmDeleteComment);
          setConfirmDeleteComment(null);
        }}
      />

      {/* Confirm: Delete Post */}
      <ConfirmDialog
        open={confirmDeletePost}
        onOpenChange={setConfirmDeletePost}
        title="Delete post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={executeDeletePost}
      />
    </div>
  );
}
