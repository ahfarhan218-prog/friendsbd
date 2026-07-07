const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Story = require('../models/Story');
const Notification = require('../models/Notification');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/stories');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage and validation
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `story_${Date.now()}_${Math.random().toString(36).substring(2,8)}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos/images
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

// GET /api/stories/feed
// Fetch active stories grouped by user, sort by createdAt asc inside each group
router.get('/feed', async (req, res) => {
  try {
    const requesterId = req.query.userId; // Get the user ID from query to check views

    // Fetch all stories (expired ones are handled by MongoDB TTL, but we can also filter for safety)
    const stories = await Story.find().sort({ createdAt: 1 }).lean();

    const groupedStories = {};
    stories.forEach(story => {
      // Check if requested user viewed this story
      story.isViewed = requesterId ? story.viewedBy.includes(requesterId) : false;

      if (!groupedStories[story.userId]) {
        groupedStories[story.userId] = {
          userId: story.userId,
          userName: story.userName,
          userAvatar: story.userAvatar,
          stories: []
        };
      }
      groupedStories[story.userId].stories.push(story);
    });

    // Return an array of grouped user stories
    res.json({ success: true, feed: Object.values(groupedStories) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stories
// Upload a new story
router.post('/', upload.single('media'), async (req, res) => {
  try {
    const { userId, userName, userAvatar, content, mediaType, backgroundColor } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }
    
    if (!req.file && (!content || !content.trim())) {
      return res.status(400).json({ error: 'Media file or text content is required.' });
    }

    let finalMediaType = mediaType === 'text' ? 'text' : 'image';
    let mediaUrl = '';

    if (req.file) {
      finalMediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      mediaUrl = `/uploads/stories/${req.file.filename}`;
    }

    const story = new Story({
      id: `sty_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId,
      userName,
      userAvatar,
      mediaUrl,
      mediaType: finalMediaType,
      content,
      backgroundColor: backgroundColor || '#0a0a1a',
      viewedBy: []
    });

    await story.save();
    res.json({ success: true, story });
  } catch (err) {
    console.error('Story Upload Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stories/:id/react
// Add a reaction to a story and notify the owner
router.post('/:id/react', async (req, res) => {
  try {
    const { userId, userName, userAvatar, emoji } = req.body;
    if (!userId || !emoji) return res.status(400).json({ error: 'userId and emoji are required.' });

    const story = await Story.findOne({ id: req.params.id });
    if (!story) return res.status(404).json({ error: 'Story not found.' });

    // Remove existing reaction from this user if any, then push the new one
    story.reactions = story.reactions.filter(r => r.userId !== userId);
    story.reactions.push({ emoji, userId, userName, userAvatar, timestamp: Date.now() });
    await story.save();

    // Create Notification for the story owner
    if (story.userId !== userId) {
      await Notification.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2,8)}`,
        userId: story.userId,
        senderId: userId,
        senderName: userName,
        senderAvatar: userAvatar,
        type: 'REACTION',
        message: `reacted ${emoji} to your story.`,
        timestamp: Date.now(),
        link: '/stories'
      });
    }

    res.json({ success: true, story });
  } catch (err) {
    console.error('Story React Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stories/:id/view
// Mark story as viewed by user
router.post('/:id/view', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });

    const story = await Story.findOneAndUpdate(
      { id: req.params.id },
      { $addToSet: { viewedBy: userId } },
      { new: true }
    );

    if (!story) return res.status(404).json({ error: 'Story not found.' });

    res.json({ success: true, story });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
