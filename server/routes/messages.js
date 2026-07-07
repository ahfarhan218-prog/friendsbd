const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');

// ── MESSAGES ──────────────────────────────────────

// GET messages for a conversation
router.get('/conv/:convId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ convId: req.params.convId })
      .sort({ timestamp: 1 }).limit(200).lean();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST send message to a conversation
router.post('/conv/:convId/messages', async (req, res) => {
  try {
    const msg = { ...req.body, convId: req.params.convId };
    await Message.findOneAndUpdate(
      { convId: req.params.convId, id: msg.id },
      { $set: msg },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH mark message as read
router.patch('/conv/:convId/messages/:msgId/read', async (req, res) => {
  try {
    await Message.findOneAndUpdate(
      { convId: req.params.convId, id: req.params.msgId },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CONVERSATIONS ─────────────────────────────────

// GET conversations for a user
router.get('/conversations/:userId', async (req, res) => {
  try {
    const convs = await Conversation.find({ participantIds: req.params.userId })
      .sort({ lastTimestamp: -1 }).limit(50).lean();
    res.json(convs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET unread message count for user
router.get('/conversations/:userId/unread-count', async (req, res) => {
  try {
    const convs = await Conversation.find({ participantIds: req.params.userId }).lean();
    let count = 0;
    const field = `unread_${req.params.userId}`;
    convs.forEach(c => { count += (c[field] || 0); });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST save/update conversation metadata
router.post('/conversations', async (req, res) => {
  try {
    const conv = req.body;
    await Conversation.findOneAndUpdate(
      { id: conv.id },
      { $set: conv },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST send message notification
router.post('/message-notification', async (req, res) => {
  try {
    const { recipientId, senderId, senderName, senderAvatar, messageText, convId } = req.body;
    const notif = {
      id: `msg_notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: recipientId,
      senderId,
      senderName,
      senderAvatar,
      type: 'MESSAGE',
      message: `sent you a message: "${messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText}"`,
      timestamp: Date.now(),
      isRead: false,
      link: `/chat?userId=${senderId}`,
      convId,
    };
    await Notification.findOneAndUpdate(
      { userId: recipientId, id: notif.id },
      { $set: notif },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
