const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

const BAD_WORDS = ['spam', 'scam', 'fraud', 'abuse', 'hate'];

function autoModerate(text) {
  if (!text) return { flagged: false, reason: null };
  const lower = text.toLowerCase();
  for (const word of BAD_WORDS) {
    if (lower.includes(word)) {
      return { flagged: true, reason: `Contains prohibited word: ${word}` };
    }
  }
  return { flagged: false, reason: null };
}

// POST /api/reports - Create a report (with auto-moderation)
router.post('/', async (req, res) => {
  try {
    const { reporterId, reporterName, targetId, targetName, targetType, reason, details } = req.body;
    if (!reporterId || !targetId || !reason) {
      return res.status(400).json({ error: 'reporterId, targetId, and reason are required.' });
    }

    const reportId = `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const report = new Report({
      id: reportId, reporterId, reporterName, targetId, targetName,
      targetType: targetType || 'user', reason, details,
      status: 'pending', createdAt: Date.now()
    });
    await report.save();

    const modResult = autoModerate(details || reason);
    res.json({ success: true, report, autoModerated: modResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports - List reports (optional status filter)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const reports = await Report.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/reports/:id - Resolve or dismiss a report
router.patch('/:id', async (req, res) => {
  try {
    const { status, resolvedBy } = req.body;
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be resolved or dismissed.' });
    }
    const report = await Report.findOneAndUpdate(
      { id: req.params.id },
      { $set: { status, resolvedBy, resolvedAt: Date.now() } },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
