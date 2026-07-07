import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function connectSocket(userId: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    query: { userId },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected');
    socket?.emit('notifications:subscribe');
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected');
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function subscribeToUser(userId: string): void {
  socket?.emit('join:room', `user:${userId}`);
}

export function subscribeToConv(convId: string): void {
  socket?.emit('join:room', `conv:${convId}`);
}

export function subscribeToMatch(matchId: string): void {
  socket?.emit('match:subscribe', matchId);
}

export function subscribeToGame(gameType: string): void {
  socket?.emit('game:subscribe', gameType);
}

export function sendChatMessage(convId: string, message: any): void {
  socket?.emit('chat:message', { convId, message });
}

export function sendTyping(convId: string, userId: string, userName: string): void {
  socket?.emit('chat:typing', { convId, userId, userName });
}
