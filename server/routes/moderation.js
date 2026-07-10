const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const TOXIC_PATTERNS = [
  /\b(spam|scam|fake|hack|cheat|free money|click here|buy now|earn fast)\b/i,
  /(https?:\/\/[^\s]+){3,}/,
  /([!.?]){5,}/,
  /([A-Z]){8,}/,
];

router.post('/check', authenticateToken, async (req, res) => {
  try {
    const { text, type } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    const flags = [];
    for (const pattern of TOXIC_PATTERNS) {
      if (pattern.test(text)) {
        flags.push(`Matched: ${pattern}`);
      }
    }

    if (flags.length > 0) {
      return res.json({ flagged: true, reasons: flags, action: 'review' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `Classify this text as safe, toxic, or spam. Reply with exactly one word (safe/toxic/spam): "${text.substring(0, 500)}"` }]
              }]
            })
          }
        );
        const data = await response.json();
        const result = data?.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase().trim() || 'safe';
        if (result === 'toxic' || result === 'spam') {
          return res.json({ flagged: true, reasons: [`AI classified as: ${result}`], action: result === 'toxic' ? 'block' : 'review' });
        }
      } catch (_) {}
    }

    res.json({ flagged: false, reasons: [], action: 'allow' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/quiz-generate', authenticateToken, async (req, res) => {
  try {
    const { topic, count } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'AI service not configured' });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Generate ${count || 5} multiple choice quiz questions about "${topic}". Return as JSON array with fields: question, options (array of 4), correctIndex (0-3). Only return valid JSON.` }]
          }]
        })
      }
    );
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
