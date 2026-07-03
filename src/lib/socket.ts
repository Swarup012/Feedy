// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

/**
 * Initialize Socket.io using a short-lived WS ticket.
 *
 * Because HttpOnly cookies cannot be read by JS and are not automatically
 * sent during the Socket.io HTTP handshake in all environments, the backend
 * exposes GET /api/auth/ws-ticket which returns a one-time token (valid ~30s).
 * Pass that ticket here instead of the raw JWT.
 *
 * Usage:
 *   const { ticket } = await authService.getWsTicket();
 *   initSocketWithTicket(ticket);
 */
export function initSocketWithTicket(ticket: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  console.log('🔌 Initializing Socket.io with WS ticket...');

  socket = io(SOCKET_URL, {
    auth: { ticket },           // backend validates ticket, not raw JWT
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 20000,
  });

  _attachSocketListeners();
  return socket;
}

/**
 * @deprecated Use initSocketWithTicket(ticket) instead.
 * Kept for backward compatibility during the cookie-auth migration.
 * Call authService.getWsTicket() to obtain a ticket.
 */
export function initSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  console.log('🔌 Initializing Socket.io connection (legacy token mode)...', {
    url: SOCKET_URL,
    tokenPrefix: token.substring(0, 20) + '...',
  });

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 20000,
  });

  _attachSocketListeners();
  return socket;
}

/** Shared event listener setup — called by both init functions */
function _attachSocketListeners() {
  if (!socket) return;

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
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
