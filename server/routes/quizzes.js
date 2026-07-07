const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');

// GET all quizzes
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find({}).lean();
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single quiz
router.get('/:quizId', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ id: req.params.quizId }).lean();
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create quiz
router.post('/', async (req, res) => {
  try {
    const quiz = req.body;
    if (!quiz.id) quiz.id = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    await Quiz.findOneAndUpdate({ id: quiz.id }, { $set: quiz }, { upsert: true, new: true });
    res.json({ id: quiz.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update quiz
router.patch('/:quizId', async (req, res) => {
  try {
    await Quiz.findOneAndUpdate({ id: req.params.quizId }, { $set: req.body });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE quiz
router.delete('/:quizId', async (req, res) => {
  try {
    await Quiz.findOneAndDelete({ id: req.params.quizId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET quiz submissions by user
router.get('/submissions/:userId', async (req, res) => {
  try {
    const submissions = await QuizSubmission.find({ userId: req.params.userId }).lean();
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit quiz score
router.post('/submissions', async (req, res) => {
  try {
    const { userId, quizId, quizTitle, score } = req.body;
    const id = `${userId}_${quizId}`;
    const existing = await QuizSubmission.findOne({ id }).lean();
    if (existing) return res.status(400).json({ error: 'Already submitted' });

    const submission = { id, userId, quizId, quizTitle, score, timestamp: Date.now() };
    await QuizSubmission.findOneAndUpdate({ id }, { $set: submission }, { upsert: true });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;