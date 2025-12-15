// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

/**
 * Initialize Socket.io connection
 * Call this when user logs in
 */
export function initSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  console.log('🔌 Initializing Socket.io connection...', {
    url: SOCKET_URL,
    tokenPrefix: token.substring(0, 20) + '...',
  });

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 20000,
  });

  console.log('📡 Socket instance created, waiting for connection...');

  // Connection events
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      // Server disconnected the socket, try to reconnect manually
      socket?.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('⚠️  Socket connection error:', error.message);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('🔄 Socket reconnection attempt:', attemptNumber);
  });

  socket.on('reconnect_error', (error) => {
    console.error('⚠️  Socket reconnection error:', error.message);
  });

  socket.on('reconnect_failed', () => {
    console.error('❌ Socket reconnection failed');
  });

  return socket;
}

/**
 * Get existing Socket.io instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect Socket.io
 * Call this when user logs out
 */
export function disconnectSocket(): void {
  if (socket) {
    console.log('🔌 Disconnecting Socket.io...');
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

/**
 * Join a post room to receive real-time updates
 */
export function joinPostRoom(postId: string): void {
  if (!socket?.connected) {
    console.warn('⚠️  Socket not connected, cannot join post room', {
      socketExists: !!socket,
      socketId: socket?.id,
    });
    return;
  }
  console.log(`📝 [Frontend] Emitting join:post for postId: ${postId}`, {
    socketId: socket.id,
    connected: socket.connected,
  });
  socket.emit('join:post', postId);
  
  // Listen for confirmation
  socket.once('joined:post', (data: any) => {
    console.log('✅ [Frontend] Confirmed joined post room:', data);
  });
}

/**
 * Leave a post room
 */
export function leavePostRoom(postId: string): void {
  if (!socket?.connected) return;
  socket.emit('leave:post', postId);
  console.log('🚪 Left post room:', postId);
}

/**
 * Join a board room to receive real-time updates
 */
export function joinBoardRoom(boardSlug: string): void {
  if (!socket?.connected) {
    console.warn('⚠️  Socket not connected, cannot join board room');
    return;
  }
  socket.emit('join:board', boardSlug);
  console.log('📋 Joined board room:', boardSlug);
}

/**
 * Leave a board room
 */
export function leaveBoardRoom(boardSlug: string): void {
  if (!socket?.connected) return;
  socket.emit('leave:board', boardSlug);
  console.log('🚪 Left board room:', boardSlug);
}
