// src/hooks/useBoardRealtime.ts
'use client';

import { useEffect, useCallback } from 'react';
import { getSocket, joinBoardRoom, leaveBoardRoom } from '@/lib/socket';

interface Post {
  id: string;
  title: string;
  content?: string;
  status: string;
  author: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
  };
  upvotes: number;
  comment_count: number;
  created_at: string;
}

interface UseBoardRealtimeProps {
  boardSlug: string;
  onPostCreated?: (post: Post) => void;
  onPostDeleted?: (postId: string) => void;
  onPostStatusChanged?: (data: { postId: string; newStatus: string }) => void;
  onCommentCountChanged?: (data: { postId: string; commentCount: number }) => void;
  onPostUpvoted?: (data: { postId: string; upvoteCount: number }) => void;
}

/**
 * Hook for board real-time events
 * Automatically joins/leaves board room and handles events
 */
export function useBoardRealtime({
  boardSlug,
  onPostCreated,
  onPostDeleted,
  onPostStatusChanged,
  onCommentCountChanged,
  onPostUpvoted,
}: UseBoardRealtimeProps) {
  // Memoize callbacks
  const handlePostCreated = useCallback(
    ({ post }: { boardSlug: string; post: Post }) => {
      console.log('📝 New post in board:', post);
      onPostCreated?.(post);
    },
    [onPostCreated]
  );

  const handlePostDeleted = useCallback(
    ({ postId }: { postId: string; boardSlug: string }) => {
      console.log('🗑️  Post deleted:', postId);
      onPostDeleted?.(postId);
    },
    [onPostDeleted]
  );

  const handlePostStatusChanged = useCallback(
    (data: { postId: string; boardSlug: string; newStatus: string }) => {
      console.log('🔄 Post status changed:', data);
      onPostStatusChanged?.({ postId: data.postId, newStatus: data.newStatus });
    },
    [onPostStatusChanged]
  );

  const handleCommentCountChanged = useCallback(
    (data: { postId: string; boardSlug: string; commentCount: number }) => {
      console.log('💬 Comment count changed:', data);
      onCommentCountChanged?.({ postId: data.postId, commentCount: data.commentCount });
    },
    [onCommentCountChanged]
  );

  const handlePostUpvoted = useCallback(
    (data: { postId: string; boardSlug: string; upvoteCount: number }) => {
      console.log('👍 Post upvoted:', data);
      onPostUpvoted?.({ postId: data.postId, upvoteCount: data.upvoteCount });
    },
    [onPostUpvoted]
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !boardSlug) return;

    // Join board room
    joinBoardRoom(boardSlug);

    // Subscribe to events
    socket.on('post:created', handlePostCreated);
    socket.on('post:deleted', handlePostDeleted);
    socket.on('post:status_changed', handlePostStatusChanged);
    socket.on('post:comment_count', handleCommentCountChanged);
    socket.on('post:upvoted', handlePostUpvoted);

    // Cleanup
    return () => {
      leaveBoardRoom(boardSlug);
      socket.off('post:created', handlePostCreated);
      socket.off('post:deleted', handlePostDeleted);
      socket.off('post:status_changed', handlePostStatusChanged);
      socket.off('post:comment_count', handleCommentCountChanged);
      socket.off('post:upvoted', handlePostUpvoted);
    };
  }, [boardSlug, handlePostCreated, handlePostDeleted, handlePostStatusChanged, handleCommentCountChanged, handlePostUpvoted]);
}
