const express = require('express');
const router = express.Router();
const { ForumCategory, ForumThread, ForumPost } = require('../models/Forum');
const User = require('../models/User');

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'General Forum',      description: 'Discuss anything and everything here',            slug: 'general-forum',       icon: '🌍', color: 'indigo', subCategories: [], order: 1 },
  { id: '2', name: 'Site Official',      description: 'Official FriendsBD news, updates & announcements', slug: 'site-official',       icon: '📢', color: 'blue',   subCategories: [], order: 2 },
  { id: '3', name: 'Entertainment Forum',description: 'Movies, music, memes, fun & everything entertainment', slug: 'entertainment-forum', icon: '🎬', color: 'orange', subCategories: [], order: 3 },
  { id: '4', name: 'Tech Forum',         description: 'Gadgets, software, apps & technology discussions',  slug: 'tech-forum',          icon: '💻', color: 'rose',   subCategories: [], order: 4 },
  { id: '5', name: 'Culture n People',   description: 'Culture, society, lifestyle & people',             slug: 'culture-n-people',   icon: '🏛️', color: 'teal',   subCategories: [], order: 5 },
  { id: '6', name: 'FriendsBD Rules',     description: 'Community guidelines, rules & policies',           slug: 'friendsbd-rules',      icon: '📜', color: 'amber',  subCategories: [], order: 6 },
  { id: '7', name: 'FriendsBD All Quiz',  description: 'Quizzes, trivia challenges & knowledge tests',     slug: 'friendsbd-all-quiz',   icon: '🧠', color: 'violet', subCategories: [], order: 7 },
  { id: '8', name: 'FriendsBD Game',      description: 'Gaming discussions, reviews & community games',    slug: 'friendsbd-game',       icon: '🎮', color: 'green',  subCategories: [], order: 8 },
  { id: 'cricket', name: 'Cricket Matches', description: 'Live cricket match forum threads & score tracking', slug: 'cricket-matches', icon: '🏏', color: 'teal', subCategories: [], order: 9 },
];

// ── CATEGORIES ─────────────────────────────────────

// Force reseed all categories with DEFAULT_CATEGORIES
router.post('/categories/seed', async (req, res) => {
  try {
    await ForumCategory.deleteMany({});
    await ForumCategory.insertMany(DEFAULT_CATEGORIES);
    res.json({ success: true, count: DEFAULT_CATEGORIES.length, categories: DEFAULT_CATEGORIES });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    let cats = await ForumCategory.find({}).lean();
    if (cats.length === 0) {
      await ForumCategory.insertMany(DEFAULT_CATEGORIES);
      cats = DEFAULT_CATEGORIES;
    }

    // Auto-add any new default categories that don't exist in DB yet
    const existingIds = new Set(cats.map(c => c.id));
    const missing = DEFAULT_CATEGORIES.filter(d => !existingIds.has(d.id));
    if (missing.length > 0) {
      await ForumCategory.insertMany(missing);
      cats = [...cats, ...missing];
    }

    cats.sort((a, b) => (a.order || parseInt(a.id)) - (b.order || parseInt(b.id)));
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const cat = req.body;
    await ForumCategory.findOneAndUpdate({ id: cat.id }, { $set: cat }, { upsert: true, new: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/categories', async (req, res) => {
  try {
    const categories = req.body;
    await Promise.all(categories.map(c =>
      ForumCategory.findOneAndUpdate({ id: c.id }, { $set: c }, { upsert: true })
    ));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/categories/:catId', async (req, res) => {
  try {
    await ForumCategory.findOneAndUpdate({ id: req.params.catId }, { $set: req.body });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:catId', async (req, res) => {
  try {
    await ForumCategory.findOneAndDelete({ id: req.params.catId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── THREADS ────────────────────────────────────────

router.get('/threads', async (req, res) => {
  try {
    const filter = {};
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    if (req.query.type) filter.type = req.query.type;
    const threads = await ForumThread.find(filter).lean();
    res.json(threads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/threads/:threadId', async (req, res) => {
  try {
    const thread = await ForumThread.findOne({ id: req.params.threadId }).lean();
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    res.json(thread);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/threads/:threadId/related', async (req, res) => {
  try {
    const thread = await ForumThread.findOne({ id: req.params.threadId }).lean();
    if (!thread) return res.json([]);
    const related = await ForumThread.find({
      categoryId: thread.categoryId,
      id: { $ne: thread.id }
    }).sort({ lastActivity: -1 }).limit(4).lean();
    res.json(related);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/threads', async (req, res) => {
  try {
    const { thread, firstPost, userId, currentAp, currentTotalAp } = req.body;

    const lastThread = await ForumThread.findOne().sort({ id: -1 }).collation({ locale: 'en_US', numericOrdering: true });
    let nextId = 1;
    if (lastThread && lastThread.id && !isNaN(parseInt(lastThread.id))) {
      nextId = parseInt(lastThread.id) + 1;
    }
    thread.id = nextId.toString();

    if (firstPost) {
      firstPost.threadId = thread.id;
      firstPost.id = firstPost.id || ('P' + Date.now());
    }

    await ForumThread.findOneAndUpdate({ id: thread.id }, { $set: thread }, { upsert: true, new: true });

    if (firstPost) {
      await ForumPost.findOneAndUpdate({ id: firstPost.id }, { $set: firstPost }, { upsert: true, new: true });
    }

    if (userId) {
      await User.findOneAndUpdate(
        { id: userId },
        { $set: { ap: (currentAp || 0) + 15, totalAp: (currentTotalAp || 0) + 15, lastClaimId: `thread_${thread.id}` } }
      );
    }

    res.json({ success: true, threadId: thread.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/threads/:threadId', async (req, res) => {
  try {
    await ForumThread.findOneAndUpdate({ id: req.params.threadId }, { $set: req.body });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/threads/:threadId', async (req, res) => {
  try {
    await ForumThread.findOneAndDelete({ id: req.params.threadId });
    await ForumPost.deleteMany({ threadId: req.params.threadId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CRICKET MATCH — Update match state on an existing thread ──────────────

router.patch('/threads/:threadId/cricket-match', async (req, res) => {
  try {
    const { matchData, phase, winner, team1Name, team2Name } = req.body;
    const updateFields = {
      cricketMatchData: matchData,
      cricketMatchPhase: phase,
      lastActivity: Date.now()
    };
    if (winner !== undefined) updateFields.cricketMatchWinner = winner;
    if (team1Name !== undefined) updateFields.cricketTeam1Name = team1Name;
    if (team2Name !== undefined) updateFields.cricketTeam2Name = team2Name;

    await ForumThread.findOneAndUpdate(
      { id: req.params.threadId },
      { $set: updateFields }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CRICKET MATCH — Reveal all hidden posts for a thread (e.g. on complete) ──

router.post('/threads/:threadId/reveal-all', async (req, res) => {
  try {
    await ForumPost.updateMany(
      { threadId: req.params.threadId, isHidden: true },
      { $set: { isHidden: false } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CRICKET MATCH — Reveal specific hidden posts by overNum ──────────────

router.post('/threads/:threadId/reveal-over', async (req, res) => {
  try {
    const { overNum } = req.body;
    await ForumPost.updateMany(
      { threadId: req.params.threadId, overNum, isHidden: true },
      { $set: { isHidden: false } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POSTS ──────────────────────────────────────────

// GET posts — supports requesterId to show hidden posts to host/author
router.get('/posts', async (req, res) => {
  try {
    const filter = req.query.threadId ? { threadId: req.query.threadId } : {};
    const requesterId = req.query.requesterId || null;

    const posts = await ForumPost.find(filter).sort({ timestamp: 1 }).lean();

    // Filter hidden posts: only reveal to the author or the requester if they are host
    // The frontend will handle host detection; we send isHidden flag and the server
    // enforces visibility by checking requesterId matches authorId for hidden posts.
    // Host detection (role=admin) is trusted client-side for simplicity.
    const filtered = posts.map(p => {
      if (!p.isHidden) return p;
      // Hidden post: reveal content only if requester is the author
      if (requesterId && (p.authorId === requesterId)) return p;
      // Otherwise return post with content masked
      return { ...p, content: '__HIDDEN__', _isHiddenFromViewer: true };
    });

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/posts', async (req, res) => {
  try {
    const { threadId, author, content, currentAp, currentTotalAp, postType, isHidden, overNum } = req.body;
    const newPost = {
      id: 'P' + Date.now(),
      threadId,
      authorId: author.id || 'system',
      authorName: author.username || author.name || 'Anonymous',
      authorAvatar: author.avatar || 'https://picsum.photos/seed/anon/200',
      content: content.trim(),
      timestamp: Date.now(),
      reactions: {},
      userReactions: {},
      likedBy: [],
      postType: postType || 'text',
      isHidden: isHidden === true,
      overNum: overNum || null,
    };

    await ForumPost.findOneAndUpdate({ id: newPost.id }, { $set: newPost }, { upsert: true, new: true });

    await ForumThread.findOneAndUpdate(
      { id: threadId },
      { $inc: { replyCount: 1 }, $set: { lastActivity: Date.now(), lastPostAuthor: newPost.authorName } }
    );

    if (author.id) {
      await User.findOneAndUpdate(
        { id: author.id },
        { $set: { ap: (currentAp || 0) + 5, totalAp: (currentTotalAp || 0) + 5, lastClaimId: `post_${newPost.id}` } }
      );
    }

    res.json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/posts/:postId', async (req, res) => {
  try {
    const { isMainPost, editedBy, editedByAvatar, content, ...rest } = req.body;
    const now = Date.now();

    // Update the post itself
    await ForumPost.findOneAndUpdate(
      { id: req.params.postId },
      { $set: { ...rest, content, editedBy, editedByAvatar, editedAt: now, updated_at: now } }
    );

    // If editing the MAIN (first) post, auto-create a system edit-log post
    if (isMainPost && editedBy) {
      const post = await ForumPost.findOne({ id: req.params.postId }).lean();
      if (post && post.threadId) {
        const editedDate = new Date(now);
        const formattedTime = editedDate.toLocaleString('en-US', {
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
          weekday: 'short', day: '2-digit', month: 'short', year: '2-digit'
        });

        const systemPost = {
          id: 'SYS_EDIT_' + now,
          threadId: post.threadId,
          authorId: 'friendsbd_system',
          authorName: 'FriendsBDTeam',
          authorAvatar: '',
          content: `__EDIT_LOG__:${editedBy}:${editedByAvatar || ''}:${now}`,
          timestamp: now,
          isSystemPost: true,
          systemAction: 'TOPIC_EDITED',
          reactions: {},
          userReactions: {},
          likedBy: []
        };

        await ForumPost.findOneAndUpdate(
          { id: systemPost.id },
          { $set: systemPost },
          { upsert: true, new: true }
        );

        // Update thread lastActivity without incrementing replyCount
        await ForumThread.findOneAndUpdate(
          { id: post.threadId },
          { $set: { lastActivity: now } }
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/posts/:postId', async (req, res) => {
  try {
    const post = await ForumPost.findOne({ id: req.params.postId }).lean();
    if (post) {
      await ForumPost.findOneAndUpdate({ id: req.params.postId }, { $set: { is_deleted: true } });
      await ForumThread.findOneAndUpdate({ id: post.threadId }, { $inc: { replyCount: -1 } });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── REACTIONS ──────────────────────────────────────

router.post('/posts/:postId/reactions', async (req, res) => {
  try {
    const { emoji, userId } = req.body;
    const post = await ForumPost.findOne({ id: req.params.postId }).lean();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const userReactions = post.userReactions instanceof Map
      ? Object.fromEntries(post.userReactions)
      : (post.userReactions || {});
    const reactions = post.reactions instanceof Map
      ? Object.fromEntries(post.reactions)
      : (post.reactions || {});

    const prevEmoji = userReactions[userId];

    if (prevEmoji === emoji) {
      // Toggle off
      delete userReactions[userId];
      reactions[emoji] = Math.max((reactions[emoji] || 1) - 1, 0);
      if (reactions[emoji] === 0) delete reactions[emoji];
    } else {
      // Remove old if exists
      if (prevEmoji) {
        reactions[prevEmoji] = Math.max((reactions[prevEmoji] || 1) - 1, 0);
        if (reactions[prevEmoji] === 0) delete reactions[prevEmoji];
      }
      // Add new
      userReactions[userId] = emoji;
      reactions[emoji] = (reactions[emoji] || 0) + 1;
    }

    await ForumPost.findOneAndUpdate(
      { id: req.params.postId },
      { $set: { reactions, userReactions } }
    );

    res.json({ reactions, userReactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── STATS ──────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const threads = await ForumThread.find({}).lean();
    const posts = await ForumPost.find({ is_deleted: { $ne: true } }).lean();
    const userCount = await User.countDocuments();

    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentPosts = posts.filter(p => p.timestamp > oneWeekAgo && p.authorName !== 'Anonymous');

    let weeklyTopPoster = 'No activity', weeklyTopPosts = 0;
    if (recentPosts.length > 0) {
      const counts = recentPosts.reduce((acc, p) => {
        acc[p.authorName] = (acc[p.authorName] || 0) + 1;
        return acc;
      }, {});
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (top) { weeklyTopPoster = `${top[0]} (${top[1]} posts)`; weeklyTopPosts = top[1]; }
    }

    const sortedThreads = [...threads].sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
    const lastPostThread = sortedThreads[0] || null;
    const randomTopic = threads.length > 0 ? threads[Math.floor(Math.random() * threads.length)] : null;

    res.json({
      weeklyTopPoster,
      lastPost: lastPostThread ? `In: "${lastPostThread.title}"` : 'None',
      lastPostThreadId: lastPostThread ? lastPostThread.id : null,
      randomTopic: randomTopic ? randomTopic.title : 'None',
      randomTopicId: randomTopic ? randomTopic.id : null,
      totalUsers: userCount,
      totalThreads: threads.length,
      totalPosts: posts.length,
      totalPostsDisplay: threads.length + posts.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
