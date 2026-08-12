// src/hooks/usePostRealtime.ts
'use client';

import { useEffect, useCallback } from 'react';
import { getSocket, joinPostRoom, leavePostRoom } from '@/lib/socket';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
  };
  created_at: string;
  parent_id?: string | null;
  like_count: number;
  user_has_liked: boolean;
}

interface UsePostRealtimeProps {
  postId: string;
  onCommentNew?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  onCommentLiked?: (data: { commentId: string; liked: boolean; likeCount: number }) => void;
  onPostUpvoted?: (data: { upvoted: boolean; upvoteCount: number }) => void;
  onCommentCountChanged?: (count: number) => void;
}

/**
 * Hook for post real-time events
 * Automatically joins/leaves post room and handles events
 */
export function usePostRealtime({
  postId,
  onCommentNew,
  onCommentDeleted,
  onCommentLiked,
  onPostUpvoted,
  onCommentCountChanged,
}: UsePostRealtimeProps) {
  // Memoize callbacks to prevent unnecessary re-subscriptions
  const handleCommentNew = useCallback(
    (data: any) => {
      if (data.comment) {
        onCommentNew?.(data.comment);
      }
    },
    [onCommentNew]
  );

  const handleCommentDeleted = useCallback(
    ({ commentId }: { postId: string; commentId: string }) => {
      onCommentDeleted?.(commentId);
    },
    [onCommentDeleted]
  );

  const handleCommentLiked = useCallback(
    (data: { postId: string; commentId: string; liked: boolean; likeCount: number }) => {
      onCommentLiked?.({ commentId: data.commentId, liked: data.liked, likeCount: data.likeCount });
    },
    [onCommentLiked]
  );

  const handlePostUpvoted = useCallback(
    (data: { postId: string; upvoted: boolean; upvoteCount: number }) => {
      onPostUpvoted?.({ upvoted: data.upvoted, upvoteCount: data.upvoteCount });
    },
    [onPostUpvoted]
  );

  const handleCommentCount = useCallback(
    ({ commentCount }: { postId: string; commentCount: number }) => {
      onCommentCountChanged?.(commentCount);
    },
    [onCommentCountChanged]
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !postId) return;

    const setupRealtime = () => {
      joinPostRoom(postId);
      socket.on('comment:new', handleCommentNew);
      socket.on('comment:deleted', handleCommentDeleted);
      socket.on('comment:liked', handleCommentLiked);
      socket.on('post:upvoted', handlePostUpvoted);
      socket.on('post:comment_count', handleCommentCount);
    };

    if (socket.connected) {
      setupRealtime();
    } else {
      socket.once('connect', setupRealtime);
    }

    return () => {
      leavePostRoom(postId);
      socket.off('comment:new', handleCommentNew);
      socket.off('comment:deleted', handleCommentDeleted);
      socket.off('comment:liked', handleCommentLiked);
      socket.off('post:upvoted', handlePostUpvoted);
      socket.off('post:comment_count', handleCommentCount);
    };
  }, [
    postId,
    handleCommentNew,
    handleCommentDeleted,
    handleCommentLiked,
    handlePostUpvoted,
    handleCommentCount,
  ]);
}
