// src/hooks/useSocket.ts
'use client';

import { useEffect, useState } from 'react';
import { getSocket, initSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

/**
 * Hook to get Socket.io instance
 * Automatically initializes if token is available
 */
export function useSocket(token?: string | null): {
  socket: Socket | null;
  isConnected: boolean;
} {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket if token is provided
    if (token) {
      const socketInstance = initSocket(token);
      setSocket(socketInstance);

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      socketInstance.on('connect', handleConnect);
      socketInstance.on('disconnect', handleDisconnect);

      // Set initial state
      setIsConnected(socketInstance.connected);

      return () => {
        socketInstance.off('connect', handleConnect);
        socketInstance.off('disconnect', handleDisconnect);
      };
    } else {
      // No token, get existing socket if any
      const existingSocket = getSocket();
      setSocket(existingSocket);
      setIsConnected(existingSocket?.connected ?? false);
    }
  }, [token]);

  return { socket, isConnected };
}
