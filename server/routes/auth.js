const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { Meta } = require('../models/ApTransaction');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../mailService');
const { generateToken } = require('../middleware/auth');

const SALT_ROUNDS = 12;

const getNextUserId = async () => {
  const meta = await Meta.findOneAndUpdate(
    { id: 'user_counter' },
    { $inc: { count: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return meta.count;
};

const SENSITIVE_FIELDS = ['passwordHash', 'verificationToken', 'resetToken', 'resetTokenExpiry', 'sessionToken', 'sessionExpiry'];

function sanitizeUser(user) {
  const safe = { ...user };
  for (const field of SENSITIVE_FIELDS) {
    delete safe[field];
  }
  return safe;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, username, gender } = req.body;

    if (!email || !password || !fullName || !username || !gender) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Password too long (max 128 characters).' });
    }

    const restrictedKeywords = ['admin', 'moderator', 'staff', 'hasu', 'shahriar', 'hasmot'];
    const nameLower = fullName.toLowerCase();
    const usernameLower = username.toLowerCase();
    if (restrictedKeywords.some(kw => nameLower.includes(kw) || usernameLower.includes(kw))) {
      return res.status(400).json({ error: "You cannot use restricted words like admin, moderator, staff, or the founder's name." });
    }

    const existingUsername = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUsername) {
      return res.status(409).json({ error: 'This Username is already taken! Please choose another one.' });
    }

    const existingName = await User.findOne({ name: fullName.trim() });
    if (existingName) {
      return res.status(409).json({ error: 'This Full Name is already registered! Please use a different name.' });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(409).json({ error: 'This email is already registered.' });
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const serialUserId = await getNextUserId();
    const now = Date.now();

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = {
      id: userId,
      email: email.toLowerCase().trim(),
      passwordHash,
      name: fullName.trim(),
      username: username.toLowerCase().trim(),
      avatar: `https://picsum.photos/seed/${userId}/200`,
      level: 1,
      points: 100,
      silverPoints: 30,
      goldenCoins: 5,
      ap: 0,
      plusses: 0,
      isOnline: true,
      isPremium: false,
      isVerified: false,
      role: 'user',
      user_role: 'user',
      bio: 'Hey there! I am using FriendsBD 🇧🇩',
      gender: gender,
      createdAt: now,
      userId: serialUserId,
      fromCountry: 'Bangladesh',
      currentLocation: 'Home Page',
      lastActiveTime: now,
      verificationToken
    };

    await User.findOneAndUpdate(
      { id: userId },
      { $set: newUser },
      { upsert: true, new: true }
    );

    sendVerificationEmail(email, verificationToken, fullName.trim());

    const token = generateToken({ id: userId, role: 'user', user_role: 'user' });
    const safeUser = sanitizeUser(newUser);
    res.json({ success: true, user: safeUser, token, emailVerified: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email. Please sign up first.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    await User.findOneAndUpdate(
      { id: user.id },
      { $set: { isOnline: !user.ghostMode, lastActiveTime: Date.now() } }
    );

    const token = generateToken({ id: user.id, role: user.role, user_role: user.user_role });
    const safeUser = sanitizeUser(user);
    safeUser.isOnline = !user.ghostMode;
    safeUser.lastActiveTime = Date.now();

    res.json({ success: true, user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/me - Get current user from token
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ id: decoded.id }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// POST /api/auth/check-username
router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    const existing = await User.findOne({ username: username?.toLowerCase() }).lean();
    res.json({ taken: !!existing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required.' });
    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token.' });
    await User.findOneAndUpdate({ id: user.id }, { $set: { isVerified: true }, $unset: { verificationToken: '' } });
    res.json({ success: true, message: 'Email verified!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required.' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ error: 'No account with that email.' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    await User.findOneAndUpdate({ id: user.id }, { $set: { resetToken, resetTokenExpiry: Date.now() + 3600000 } });
    sendPasswordResetEmail(email, resetToken);
    res.json({ success: true, message: 'Reset link sent to your email.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token.' });
    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await User.findOneAndUpdate({ id: user.id }, {
      $set: { passwordHash: newHash },
      $unset: { resetToken: '', resetTokenExpiry: '' }
    });
    res.json({ success: true, message: 'Password reset successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
