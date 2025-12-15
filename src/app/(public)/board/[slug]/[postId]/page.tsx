'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { postService, Post, Comment } from '@/services/postService';
import { boardService, Board } from '@/services/boardService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePostRealtime } from '@/hooks/usePostRealtime';
import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  ArrowUp,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Send,
  Calendar,
  User,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  open: 'bg-gray-100 text-gray-800',
  'under-review': 'bg-blue-100 text-blue-800',
  planned: 'bg-purple-100 text-purple-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  closed: 'bg-red-100 text-red-800',
};

export default function PublicPostPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const boardSlug = params.slug as string;
  const postId = params.postId as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  // 🐛 Debug: Log when component mounts with postId
  useEffect(() => {
    console.log('🔍 [PostPage] Component mounted/updated with postId:', postId);
    const socket = getSocket();
    console.log('🔍 [PostPage] Socket status:', {
      exists: !!socket,
      connected: socket?.connected,
      id: socket?.id,
    });
  }, [postId]);

  // � Real-time Socket.io updates
  console.log('🎯 [PostPage] Calling usePostRealtime with postId:', postId);
  usePostRealtime({
    postId,
    onCommentNew: (comment) => {
      console.log('💬 [PostPage] Real-time: New comment received', comment);
      console.log('💬 [PostPage] Current comments before:', comments.length);
      console.log('💬 [PostPage] Comment author:', comment.author?.id, 'Current user:', user?.id);
      
      setComments((prev) => {
        // Check if comment already exists (avoid duplicates when current user adds comment)
        const exists = prev.some(c => c.id === comment.id);
        if (exists) {
          console.log('💬 [PostPage] Comment already exists, skipping duplicate');
          return prev;
        }
        
        console.log('💬 [PostPage] Adding comment to state. Prev length:', prev.length);
        const newComments = [...prev, comment];
        console.log('💬 [PostPage] New comments length:', newComments.length);
        return newComments;
      });
    },
    onCommentDeleted: (commentId) => {
      console.log('🗑️ [PostPage] Real-time: Comment deleted', commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    },
    onPostUpvoted: (data) => {
      console.log('⬆️ [PostPage] Real-time: Post upvoted', data);
      if (post) {
        setPost({ ...post, upvotes: data.upvoteCount });
      }
    },
    onCommentCountChanged: (commentCount) => {
      console.log('💬 [PostPage] Real-time: Comment count changed to', commentCount);
      if (post) {
        setPost({ ...post, comment_count: commentCount });
      }
    },
  });

  useEffect(() => {
    fetchData();
  }, [boardSlug, postId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch board (using public endpoint)
      const boardResponse = await boardService.getPublicBoardBySlug(boardSlug);
      setBoard(boardResponse.data.board);

      // Fetch post
      const postResponse = await postService.getPostById(postId);
      setPost(postResponse.data.post);

      // Fetch comments
      const commentsResponse = await postService.getComments(postId);
      setComments(commentsResponse.data.comments);

      // Check if user has upvoted (if authenticated)
      if (isAuthenticated) {
        // TODO: Add API endpoint to check if user has upvoted
        // For now, we'll assume not upvoted
        setUpvoted(false);
      }
    } catch (error: any) {
      console.error('Error fetching post:', error);
      toast({
        title: 'Error',
        description: 'Failed to load post. It may have been deleted.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to upvote posts',
        variant: 'destructive',
      });
      return;
    }

    if (!post) return;

    try {
      setUpvoting(true);
      const response = await postService.toggleUpvote(post.id);
      setUpvoted(response.data.upvoted);

      // Update post upvotes count
      setPost({
        ...post,
        upvotes: response.data.upvoted ? post.upvotes + 1 : post.upvotes - 1,
      });

      toast({
        title: response.data.upvoted ? 'Upvoted!' : 'Upvote removed',
        description: response.data.upvoted
          ? 'Thanks for your support!'
          : 'Your upvote has been removed',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upvote',
        variant: 'destructive',
      });
    } finally {
      setUpvoting(false);
    }
  };

  const handleAddComment = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to comment',
        variant: 'destructive',
      });
      return;
    }

    if (!post || !newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await postService.addComment(post.id, newComment);
      setNewComment('');

      // Don't manually add comment - let real-time Socket.io handle it
      // This prevents duplicate comments when the socket event fires

      toast({
        title: 'Success',
        description: 'Comment added successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;

    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await postService.deleteComment(post.id, commentId);
      
      // Don't manually remove comment - let real-time Socket.io handle it
      // This prevents issues when the socket event fires

      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-500">Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post || !board) {
    return (
      <div className="container mx-auto py-16">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">Post Not Found</h2>
            <p className="text-gray-500 mb-4">
              This post may have been deleted or moved.
            </p>
            <Button onClick={() => router.push('/feedback')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Feedback
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/feedback')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Feedback
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                {/* Upvote Button */}
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant={upvoted ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleUpvote}
                    disabled={upvoting}
                    className="w-12 h-12 p-0 rounded-lg"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                  <span className="text-sm font-semibold">{post.upvotes}</span>
                </div>

                {/* Post Header */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="text-2xl font-bold">{post.title}</h1>
                    <Badge className={cn('capitalize', STATUS_COLORS[post.status as keyof typeof STATUS_COLORS])}>
                      {post.status.replace('-', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{post.author?.name || 'Anonymous'}</span>
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

            {post.description && (
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {post.description}
                </p>
              </CardContent>
            )}
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({post.comment_count})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Comment Form */}
              <div className="space-y-2">
                <Textarea
                  placeholder={
                    isAuthenticated
                      ? 'Write a comment...'
                      : 'Please login to comment'
                  }
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  disabled={!isAuthenticated}
                  className="resize-none"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submittingComment || !isAuthenticated}
                  className="w-full sm:w-auto"
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

              <Separator />

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={cn(
                        'p-4 rounded-lg border',
                        comment.is_admin && 'bg-blue-50 border-blue-200'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {comment.author?.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {comment.author?.name || 'Anonymous'}
                              </span>
                              {comment.is_admin && (
                                <Badge variant="secondary" className="text-xs">
                                  Admin
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(comment.created_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>

                            {(user?.id === comment.author_id ||
                              user?.role === 'admin') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Board Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{board.icon}</span>
                  <h3 className="font-semibold">{board.name}</h3>
                </div>
                {board.description && (
                  <p className="text-sm text-gray-600">{board.description}</p>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Post Status</h4>
                <Badge className={cn('capitalize', STATUS_COLORS[post.status as keyof typeof STATUS_COLORS])}>
                  {post.status.replace('-', ' ')}
                </Badge>
              </div>

              {!isAuthenticated && (
                <>
                  <Separator />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-900 mb-3">
                      Want to vote or comment?
                    </p>
                    <Button
                      onClick={() => router.push('/login')}
                      className="w-full"
                      size="sm"
                    >
                      Sign In
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
