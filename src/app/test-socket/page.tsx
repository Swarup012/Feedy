'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getSocket, joinPostRoom } from '@/lib/socket';

export default function TestSocketPage() {
  const { user } = useAuth();
  const [socketStatus, setSocketStatus] = useState('Not connected');
  const [testPostId] = useState('c53af5bc-c883-4974-9395-0bb09388ebc4');
  const [messages, setMessages] = useState<string[]>([]);

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    console.log(msg);
  };

  useEffect(() => {
    const socket = getSocket();
    
    if (!socket) {
      addMessage('❌ Socket not initialized');
      setSocketStatus('Not initialized');
      return;
    }

    addMessage('✅ Socket instance exists');
    
    if (socket.connected) {
      addMessage(`✅ Socket already connected: ${socket.id}`);
      setSocketStatus(`Connected: ${socket.id}`);
    } else {
      addMessage('⏳ Socket not connected yet...');
      setSocketStatus('Connecting...');
    }

    // Listen for connection
    const onConnect = () => {
      addMessage(`✅ Socket connected: ${socket.id}`);
      setSocketStatus(`Connected: ${socket.id}`);
    };

    const onDisconnect = (reason: string) => {
      addMessage(`❌ Socket disconnected: ${reason}`);
      setSocketStatus(`Disconnected: ${reason}`);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const handleJoinRoom = () => {
    const socket = getSocket();
    if (!socket || !socket.connected) {
      addMessage('❌ Socket not connected, cannot join room');
      return;
    }

    addMessage(`📝 Attempting to join post room: ${testPostId}`);
    joinPostRoom(testPostId);
  };

  const handleTestEvent = () => {
    const socket = getSocket();
    if (!socket || !socket.connected) {
      addMessage('❌ Socket not connected');
      return;
    }

    // Listen for comment:new event
    socket.once('comment:new', (data: any) => {
      addMessage(`💬 Received comment:new event: ${JSON.stringify(data)}`);
    });

    addMessage('👂 Listening for comment:new events...');
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Socket.io Test Page</h1>
      
      {user ? (
        <div className="bg-green-100 p-4 rounded mb-4">
          <p>✅ Logged in as: <strong>{user.email}</strong></p>
          <p>User ID: {user.id}</p>
        </div>
      ) : (
        <div className="bg-red-100 p-4 rounded mb-4">
          <p>❌ Not logged in - Please login first</p>
        </div>
      )}

      <div className="bg-blue-100 p-4 rounded mb-4">
        <p><strong>Socket Status:</strong> {socketStatus}</p>
      </div>

      <div className="space-x-4 mb-6">
        <button
          onClick={handleJoinRoom}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Join Test Post Room
        </button>
        
        <button
          onClick={handleTestEvent}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Listen for comment:new
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Event Log:</h2>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500">No events yet...</p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="text-sm font-mono">
                {msg}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-100 rounded">
        <h3 className="font-bold mb-2">Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Make sure you're logged in</li>
          <li>Click "Join Test Post Room"</li>
          <li>Click "Listen for comment:new"</li>
          <li>In another tab/browser, add a comment to post ID: <code className="bg-gray-200 px-1">{testPostId}</code></li>
          <li>Watch for the event to appear in the log above</li>
        </ol>
      </div>
    </div>
  );
}
