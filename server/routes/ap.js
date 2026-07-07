const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { ApTransaction } = require('../models/ApTransaction');

// POST adjust AP (atomic-ish operation)
router.post('/adjust', async (req, res) => {
  try {
    const { userId, actionType, amountDelta, cooldownCheck, currentBalance } = req.body;

    let newBalance = (currentBalance || 0) + amountDelta;
    if (newBalance < 0) newBalance = 0;

    const updates = { balance_ap: parseFloat(newBalance.toFixed(2)) };

    if (actionType === 'ARCHIVE_CREATED') {
      updates.last_archive_created_at = Date.now();
    }

    await User.findOneAndUpdate({ id: userId }, { $set: updates });

    // Log transaction
    await ApTransaction.create({
      user_id: userId,
      amount_delta: amountDelta,
      action_type: actionType,
      timestamp: Date.now()
    });

    res.json({ success: true, newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
