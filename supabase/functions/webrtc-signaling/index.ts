import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory store for WebRTC signaling (in production, use Redis)
const rooms = new Map<string, Set<WebSocket>>();
const userSockets = new Map<string, WebSocket>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const upgrade = req.headers.get('upgrade') || '';
  if (upgrade.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  const url = new URL(req.url);
  const roomId = url.searchParams.get('roomId');
  const userId = url.searchParams.get('userId');

  if (!roomId || !userId) {
    socket.close(1008, 'Missing roomId or userId');
    return response;
  }

  console.log(`User ${userId} connecting to room ${roomId}`);

  socket.onopen = () => {
    // Add socket to room
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId)?.add(socket);
    userSockets.set(userId, socket);

    // Notify other participants
    broadcastToRoom(roomId, socket, {
      type: 'user-connected',
      userId,
      timestamp: new Date().toISOString(),
    });

    console.log(`User ${userId} connected to room ${roomId}`);
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log(`Message from ${userId}:`, message.type);

      // Handle different message types
      switch (message.type) {
        case 'offer':
        case 'answer':
        case 'ice-candidate':
          // Forward WebRTC signals to target peer
          if (message.targetId) {
            const targetSocket = userSockets.get(message.targetId);
            if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
              targetSocket.send(JSON.stringify({
                ...message,
                senderId: userId,
              }));
            }
          }
          break;

        case 'chat-message':
          // Broadcast chat to all in room
          broadcastToRoom(roomId, socket, {
            type: 'chat-message',
            senderId: userId,
            message: message.message,
            timestamp: new Date().toISOString(),
          });
          break;

        case 'screen-share-start':
        case 'screen-share-stop':
          broadcastToRoom(roomId, socket, {
            type: message.type,
            userId,
            timestamp: new Date().toISOString(),
          });
          break;

        case 'connection-quality':
          // Log connection quality
          console.log(`Connection quality from ${userId}:`, message.quality);
          break;

        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  };

  socket.onclose = () => {
    // Remove socket from room
    rooms.get(roomId)?.delete(socket);
    userSockets.delete(userId);

    // Clean up empty rooms
    if (rooms.get(roomId)?.size === 0) {
      rooms.delete(roomId);
    }

    // Notify other participants
    broadcastToRoom(roomId, socket, {
      type: 'user-disconnected',
      userId,
      timestamp: new Date().toISOString(),
    });

    console.log(`User ${userId} disconnected from room ${roomId}`);
  };

  socket.onerror = (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
  };

  return response;
});

function broadcastToRoom(roomId: string, excludeSocket: WebSocket, message: any) {
  const roomSockets = rooms.get(roomId);
  if (!roomSockets) return;

  const messageStr = JSON.stringify(message);
  roomSockets.forEach((socket) => {
    if (socket !== excludeSocket && socket.readyState === WebSocket.OPEN) {
      socket.send(messageStr);
    }
  });
}
