const express = require('express');
const router = express.Router();
const Album = require('../models/Album');

router.get('/user/:userId', async (req, res) => {
  try {
    const albums = await Album.find({ userId: req.params.userId }).sort({ createdAt: -1 }).lean();
    res.json(albums);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { userId, title, description, photos } = req.body;
    if (!userId || !title) return res.status(400).json({ error: 'userId and title required.' });
    const album = new Album({
      id: `alb_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId, title, description, photos: photos || [],
      coverUrl: photos?.[0]?.url, createdAt: Date.now()
    });
    await album.save();
    res.json({ success: true, album });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/photos', async (req, res) => {
  try {
    const { url, caption } = req.body;
    const album = await Album.findOne({ id: req.params.id });
    if (!album) return res.status(404).json({ error: 'Album not found.' });
    album.photos.push({ url, caption, uploadedAt: Date.now() });
    if (!album.coverUrl) album.coverUrl = url;
    await album.save();
    res.json({ success: true, album });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
