const User = require('./models/User');

module.exports = function setupSocket(io) {
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (!userId) { socket.disconnect(); return; }

    socket.join(`user:${userId}`);
    // Subscribe to all real-time feeds
    socket.join('shouts');
    socket.join('activities');
    socket.join('users');
    onlineUsers.set(userId, { socketId: socket.id, lastSeen: Date.now() });

    User.findOneAndUpdate({ id: userId }, { isOnline: true, lastActiveTime: Date.now() }).catch(() => {});
    io.to('users').emit('user:online', { userId, online: true });

    socket.on('join:room', (roomId) => { socket.join(roomId); });
    socket.on('leave:room', (roomId) => { socket.leave(roomId); });

    socket.on('chat:message', async (data) => {
      const { convId, message } = data;
      io.to(`conv:${convId}`).emit('chat:message', message);
    });

    socket.on('chat:typing', ({ convId, userId, userName }) => {
      socket.to(`conv:${convId}`).emit('chat:typing', { userId, userName });
    });

    socket.on('notifications:subscribe', () => {
      socket.join(`notifications:${userId}`);
    });

    socket.on('match:subscribe', (matchId) => {
      socket.join(`match:${matchId}`);
    });

    socket.on('game:subscribe', (gameType) => {
      socket.join(`game:${gameType}`);
    });

    // ── WebRTC Signaling ──
    socket.on('webrtc:offer', ({ targetUserId, offer }) => {
      io.to(`user:${targetUserId}`).emit('webrtc:offer', { fromUserId: userId, offer });
    });
    socket.on('webrtc:answer', ({ targetUserId, answer }) => {
      io.to(`user:${targetUserId}`).emit('webrtc:answer', { fromUserId: userId, answer });
    });
    socket.on('webrtc:ice', ({ targetUserId, candidate }) => {
      io.to(`user:${targetUserId}`).emit('webrtc:ice', { fromUserId: userId, candidate });
    });
    socket.on('webrtc:end', ({ targetUserId }) => {
      io.to(`user:${targetUserId}`).emit('webrtc:end', { fromUserId: userId });
    });

    // ── Clan War Signaling ──
    socket.on('clanwar:join', (warId) => { socket.join(`clanwar:${warId}`); });
    socket.on('clanwar:leave', (warId) => { socket.leave(`clanwar:${warId}`); });

    // ── Cricket Multiplayer ──
    socket.on('cricket:join', (matchId) => { socket.join(`cricket:${matchId}`); });
    socket.on('cricket:play', ({ matchId, digit }) => {
      io.to(`cricket:${matchId}`).emit('cricket:play', { userId, digit });
    });

    // ── Conference Events ──
    socket.on('conference:join', (roomId) => { socket.join(`conference:${roomId}`); });
    socket.on('conference:leave', (roomId) => { socket.leave(`conference:${roomId}`); });
    socket.on('conference:signal', ({ roomId, signal }) => {
      socket.to(`conference:${roomId}`).emit('conference:signal', { userId, signal });
    });

    socket.on('visitor:message', ({ profileUserId, message }) => {
      io.to(`user:${profileUserId}`).emit('visitor:message', message);
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      await User.findOneAndUpdate({ id: userId }, { isOnline: false, lastActiveTime: Date.now() }).catch(() => {});
      io.to('users').emit('user:online', { userId, online: false });
    });
  });

  const emitToUser = (targetUserId, event, data) => {
    io.to(`user:${targetUserId}`).emit(event, data);
  };

  const emitToRoom = (room, event, data) => {
    io.to(room).emit(event, data);
  };

  const emitToAll = (room, event, data) => {
    io.to(room).emit(event, data);
  };

  const getOnlineUsers = () => Array.from(onlineUsers.keys());

  return { emitToUser, emitToRoom, emitToAll, getOnlineUsers, io };
};
