const express = require('express');
const router = express.Router();
const LottoWinner = require('../models/LottoWinner');
const User = require('../models/User');

// GET recent winners
router.get('/winners', async (req, res) => {
  try {
    const winners = await LottoWinner.find({}).sort({ created_at: -1 }).limit(20).lean();
    res.json(winners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST subscribe to lotto
router.post('/subscribe', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ id: userId }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    if ((user.goldenCoins || 0) < 15) return res.status(400).json({ error: 'Insufficient Golden Coins' });

    const rand = Math.random();
    let prizeWon = '';
    const updates = { goldenCoins: user.goldenCoins - 15 };

    if (rand < 0.30) {
      prizeWon = '7 Days Premium';
      const currentPrem = Math.max(Date.now(), user.premiumExpiry || 0);
      updates.premiumExpiry = currentPrem + 7 * 24 * 60 * 60 * 1000;
      updates.isPremium = true;
    } else if (rand < 0.65) {
      prizeWon = '5 Reputation Points (RP)';
      updates.reputation_points = (user.reputation_points || 0) + 5;
    } else {
      prizeWon = '250 Plusses';
      updates.plusses = (user.plusses || 0) + 250;
    }

    const currentLotto = user.lotto_active_until || 0;
    const lottoExpiry = Math.max(Date.now(), currentLotto) + 7 * 24 * 60 * 60 * 1000;
    updates.lotto_active_until = lottoExpiry;

    await User.findOneAndUpdate({ id: userId }, { $set: updates });

    const winnerId = `winner_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    await LottoWinner.findOneAndUpdate(
      { id: winnerId },
      { $set: { id: winnerId, uid: userId, username: user.username || user.name || 'anonymous', prize_won: prizeWon, created_at: Date.now() } },
      { upsert: true }
    );

    res.json({ prize: prizeWon, newCoins: updates.goldenCoins, lottoExpiry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST gift lotto subscription
router.post('/gift', async (req, res) => {
  try {
    const { senderId, receiverUsername } = req.body;
    const sender = await User.findOne({ id: senderId }).lean();
    if (!sender) return res.status(404).json({ error: 'Sender not found' });
    if ((sender.goldenCoins || 0) < 15) return res.status(400).json({ error: 'Insufficient Golden Coins' });

    const receiver = await User.findOne({ username: receiverUsername }).lean();
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

    await User.findOneAndUpdate({ id: senderId }, { $inc: { goldenCoins: -15 } });

    const currentLotto = receiver.lotto_active_until || 0;
    const lottoExpiry = Math.max(Date.now(), currentLotto) + 7 * 24 * 60 * 60 * 1000;
    await User.findOneAndUpdate({ id: receiver.id }, { $set: { lotto_active_until: lottoExpiry } });

    res.json({ newCoins: sender.goldenCoins - 15 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;