const express = require('express');
const router = express.Router();
const ConferenceRoom = require('../models/ConferenceRoom');
const ConferenceMessage = require('../models/ConferenceMessage');
const User = require('../models/User');

// Fetch rooms for a user
router.get('/rooms', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isAdmin = user.role === 'admin';
    let rooms;

    if (isAdmin) {
      rooms = await ConferenceRoom.find();
    } else {
      rooms = await ConferenceRoom.find({
        $or: [
          { creatorId: userId },
          { members: userId },
          { invites: userId }
        ]
      });
    }

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a room
router.post('/rooms', async (req, res) => {
  try {
    const { name, creatorId, creatorName } = req.body;
    const newRoom = new ConferenceRoom({
      id: Math.random().toString(36).substring(2, 9),
      name,
      creatorId,
      creatorName,
      members: [creatorId],
      invites: [],
      createdAt: Date.now()
    });
    await newRoom.save();
    res.json(newRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a room
router.delete('/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await ConferenceRoom.deleteOne({ id });
    await ConferenceMessage.deleteMany({ roomId: id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Invite a user
router.post('/rooms/:id/invite', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const room = await ConferenceRoom.findOne({ id });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    if (!room.members.includes(userId) && !room.invites.includes(userId)) {
      room.invites.push(userId);
      await room.save();
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a user
router.post('/rooms/:id/remove', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const room = await ConferenceRoom.findOne({ id });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    room.members = room.members.filter(m => m !== userId);
    await room.save();
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join a room
router.post('/rooms/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const room = await ConferenceRoom.findOne({ id });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    if (room.invites.includes(userId) && !room.members.includes(userId)) {
      room.invites = room.invites.filter(m => m !== userId);
      room.members.push(userId);
      await room.save();
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch messages for a room
router.get('/rooms/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // to update seenBy automatically
    
    const messages = await ConferenceMessage.find({ roomId: id }).sort({ timestamp: 1 });
    
    // Update seenBy if userId is provided
    if (userId) {
      const unseenMessages = messages.filter(m => !m.seenBy.includes(userId));
      if (unseenMessages.length > 0) {
        await ConferenceMessage.updateMany(
          { roomId: id, id: { $in: unseenMessages.map(m => m.id) } },
          { $push: { seenBy: userId } }
        );
        unseenMessages.forEach(m => m.seenBy.push(userId));
      }
    }
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/rooms/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { senderId, senderName, senderAvatar, text } = req.body;
    const msgId = Math.random().toString(36).substring(2, 9);
    
    const newMsg = new ConferenceMessage({
      id: msgId,
      roomId: id,
      senderId,
      senderName,
      senderAvatar,
      text,
      timestamp: Date.now(),
      isPinned: false,
      reactions: {},
      seenBy: [senderId],
      isEdited: false
    });
    
    await newMsg.save();
    res.json(newMsg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a message
router.delete('/messages/:msgId', async (req, res) => {
  try {
    const { msgId } = req.params;
    await ConferenceMessage.deleteOne({ id: msgId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a message (edit text, pin, react)
router.patch('/messages/:msgId', async (req, res) => {
  try {
    const { msgId } = req.params;
    const { text, isPinned, reaction, reactionUserId } = req.body;
    
    const msg = await ConferenceMessage.findOne({ id: msgId });
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    
    if (text !== undefined) {
      msg.text = text;
      msg.isEdited = true;
    }
    if (isPinned !== undefined) {
      msg.isPinned = isPinned;
    }
    if (reaction && reactionUserId) {
      if (!msg.reactions) msg.reactions = new Map();
      if (msg.reactions.get(reactionUserId) === reaction) {
        msg.reactions.delete(reactionUserId);
      } else {
        msg.reactions.set(reactionUserId, reaction);
      }
    }
    
    await msg.save();
    res.json(msg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
