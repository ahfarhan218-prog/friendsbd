const express = require('express');
const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: message }]
          }],
          systemInstruction: {
            parts: [{ text: "You are a friendly and helpful customer support agent for 'FriendsBD', a social gaming platform for users in Bangladesh. You help with cricket tournaments, points, rewards, and technical issues. Be concise and polite." }]
          }
        })
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that. Please try again.";
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

module.exports = router;
