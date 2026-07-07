const User = require('./models/User');

module.exports = function setupSocket(io) {
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (!userId) { socket.disconnect(); return; }

    socket.join(`user:${userId}`);
    onlineUsers.set(userId, { socketId: socket.id, lastSeen: Date.now() });

    User.findOneAndUpdate({ id: userId }, { isOnline: true, lastActiveTime: Date.now() }).catch(() => {});
    io.emit('user:online', { userId, online: true });

    socket.on('join:room', (roomId) => {
      socket.join(roomId);
    });

    socket.on('leave:room', (roomId) => {
      socket.leave(roomId);
    });

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

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      await User.findOneAndUpdate({ id: userId }, { isOnline: false, lastActiveTime: Date.now() }).catch(() => {});
      socket.broadcast.emit('user:online', { userId, online: false });
    });
  });

  const emitToUser = (targetUserId, event, data) => {
    io.to(`user:${targetUserId}`).emit(event, data);
  };

  const emitToRoom = (room, event, data) => {
    io.to(room).emit(event, data);
  };

  const getOnlineUsers = () => Array.from(onlineUsers.keys());

  return { emitToUser, emitToRoom, getOnlineUsers, io };
};
