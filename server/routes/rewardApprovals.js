const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// In-memory store for reward approvals
const approvals = [];

// POST /api/reward-approvals - Create approval request
router.post('/', (req, res) => {
  try {
    const { requesterId, requesterName, targetUserId, targetUserName, transaction_type, plusses_amount, rp_amount, reason, quiz_id, quiz_title, quiz_link } = req.body;
    if (!requesterId || !targetUserId) {
      return res.status(400).json({ error: 'requesterId and targetUserId required.' });
    }
    const approval = {
      id: `apr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      requested_by_id: requesterId,
      requested_by_username: requesterName || '',
      target_user_id: targetUserId,
      target_username: targetUserName || '',
      transaction_type: transaction_type || 'ADD',
      plusses_amount: plusses_amount || 0,
      rp_amount: rp_amount || 0,
      reason: reason || '',
      quiz_id: quiz_id || '',
      quiz_title: quiz_title || '',
      quiz_link: quiz_link || '',
      status: 'Pending',
      approved_by_id: null,
      approved_by_username: null,
      created_at: Date.now(),
      actioned_at: null
    };
    approvals.unshift(approval);
    res.json({ success: true, approval });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reward-approvals - List approvals by status
router.get('/', (req, res) => {
  try {
    const filter = req.query.status || 'Pending';
    const filtered = approvals.filter(a => a.status === filter);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/reward-approvals/:id - Approve/reject
router.patch('/:id', (req, res) => {
  try {
    const { status, approved_by_id, approved_by_username, actioned_at } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Approved or Rejected.' });
    }
    const idx = approvals.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Approval not found.' });
    approvals[idx].status = status;
    approvals[idx].approved_by_id = approved_by_id || null;
    approvals[idx].approved_by_username = approved_by_username || null;
    approvals[idx].actioned_at = actioned_at || Date.now();
    res.json({ success: true, approval: approvals[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
