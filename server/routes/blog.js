const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');

// GET /api/blog - List published posts
router.get('/', async (req, res) => {
  try {
    const filter = { status: 'published' };
    if (req.query.authorId) filter.authorId = req.query.authorId;
    if (req.query.tag) filter.tags = req.query.tag;
    const posts = await BlogPost.find(filter).sort({ publishedAt: -1 }).limit(20).lean();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/blog/:id - Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findOne({ id: req.params.id }).lean();
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    await BlogPost.findOneAndUpdate({ id: req.params.id }, { $inc: { views: 1 } });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/blog - Create post
router.post('/', async (req, res) => {
  try {
    const { authorId, authorName, authorAvatar, title, content, tags } = req.body;
    if (!authorId || !title || !content) return res.status(400).json({ error: 'authorId, title, and content required.' });
    const now = Date.now();
    const post = new BlogPost({
      id: `blog_${now}_${Math.random().toString(36).substr(2, 6)}`,
      authorId, authorName, authorAvatar, title, content,
      excerpt: content.replace(/\[.*?\]/g, '').replace(/\n/g, ' ').substring(0, 200),
      tags: tags || [],
      status: 'published', createdAt: now, publishedAt: now
    });
    await post.save();
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/blog/:id - Update post
router.patch('/:id', async (req, res) => {
  try {
    const { title, content, tags, status } = req.body;
    const update = { updatedAt: Date.now() };
    if (title) update.title = title;
    if (content) { update.content = content; update.excerpt = content.replace(/\[.*?\]/g, '').replace(/\n/g, ' ').substring(0, 200); }
    if (tags) update.tags = tags;
    if (status) update.status = status;
    const post = await BlogPost.findOneAndUpdate({ id: req.params.id }, { $set: update }, { new: true });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/blog/:id
router.delete('/:id', async (req, res) => {
  try {
    await BlogPost.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
