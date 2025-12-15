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
      console.log('💬 [usePostRealtime] comment:new event received:', data);
      if (data.comment) {
        console.log('💬 Calling onCommentNew with:', data.comment);
        onCommentNew?.(data.comment);
      } else {
        console.error('❌ comment:new event missing comment data!', data);
      }
    },
    [onCommentNew]
  );

  const handleCommentDeleted = useCallback(
    ({ commentId }: { postId: string; commentId: string }) => {
      console.log('🗑️  Comment deleted:', commentId);
      onCommentDeleted?.(commentId);
    },
    [onCommentDeleted]
  );

  const handleCommentLiked = useCallback(
    (data: { postId: string; commentId: string; liked: boolean; likeCount: number }) => {
      console.log('👍 Comment like toggled:', data);
      onCommentLiked?.({ commentId: data.commentId, liked: data.liked, likeCount: data.likeCount });
    },
    [onCommentLiked]
  );

  const handlePostUpvoted = useCallback(
    (data: { postId: string; upvoted: boolean; upvoteCount: number }) => {
      console.log('⬆️  Post upvote toggled:', data);
      onPostUpvoted?.({ upvoted: data.upvoted, upvoteCount: data.upvoteCount });
    },
    [onPostUpvoted]
  );

  const handleCommentCount = useCallback(
    ({ commentCount }: { postId: string; commentCount: number }) => {
      console.log('💬 Comment count updated:', commentCount);
      onCommentCountChanged?.(commentCount);
    },
    [onCommentCountChanged]
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !postId) {
      console.warn('⚠️ [usePostRealtime] Socket not initialized or postId missing', { 
        hasSocket: !!socket, 
        postId,
        socketConnected: socket?.connected 
      });
      return;
    }

    // Function to setup room and events
    const setupRealtime = () => {
      console.log(`📝 [usePostRealtime] Setting up real-time for post: ${postId}`);
      console.log(`🔌 Socket connected: ${socket.connected}, Socket ID: ${socket.id}`);

      // Join post room
      joinPostRoom(postId);

      // Subscribe to events
      console.log('👂 [usePostRealtime] Subscribing to events...');
      socket.on('comment:new', handleCommentNew);
      socket.on('comment:deleted', handleCommentDeleted);
      socket.on('comment:liked', handleCommentLiked);
      socket.on('post:upvoted', handlePostUpvoted);
      socket.on('post:comment_count', handleCommentCount);
    };

    // If already connected, setup immediately
    if (socket.connected) {
      setupRealtime();
    } else {
      // Wait for connection
      console.log('⏳ [usePostRealtime] Waiting for socket to connect...');
      socket.once('connect', () => {
        console.log('✅ [usePostRealtime] Socket connected, setting up now...');
        setupRealtime();
      });
    }

    // Cleanup
    return () => {
      console.log('🧹 [usePostRealtime] Cleaning up...');
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
