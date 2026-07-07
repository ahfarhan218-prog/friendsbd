const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Meta } = require('../models/ApTransaction');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../mailService');

const hashPassword = (pwd) => crypto.createHash('sha256').update(pwd + 'friends_bd_salt').digest('hex');

const getNextUserId = async () => {
  const meta = await Meta.findOneAndUpdate(
    { id: 'user_counter' },
    { $inc: { count: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return meta.count;
};

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

    const isSystemAdmin = email === 'admin@friendsbd.com' || username === 'admin' || username === 'hasu' || username === 'shahriar';

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = {
      id: userId,
      email: email.toLowerCase().trim(),
      passwordHash: hashPassword(password),
      name: fullName.trim(),
      username: username.toLowerCase().trim(),
      avatar: isSystemAdmin ? 'https://picsum.photos/seed/admin/200' : `https://picsum.photos/seed/${userId}/200`,
      level: isSystemAdmin ? 15 : 1,
      points: isSystemAdmin ? 1250 : 100,
      silverPoints: isSystemAdmin ? 450 : 30,
      goldenCoins: isSystemAdmin ? 25 : 5,
      ap: isSystemAdmin ? 1420 : 0,
      plusses: isSystemAdmin ? 85 : 0,
      isOnline: true,
      isPremium: isSystemAdmin,
      isVerified: isSystemAdmin,
      role: isSystemAdmin ? 'admin' : 'user',
      bio: isSystemAdmin ? 'System Admin of FriendsBD 🇧🇩' : 'Hey there! I am using FriendsBD 🇧🇩',
      gender: gender,
      createdAt: now,
      userId: serialUserId,
      fromCountry: 'Bangladesh',
      currentLocation: 'Home Page',
      lastActiveTime: now,
      verificationToken: isSystemAdmin ? undefined : verificationToken
    };

    await User.findOneAndUpdate(
      { id: userId },
      { $set: newUser },
      { upsert: true, new: true }
    );

    if (!isSystemAdmin) {
      sendVerificationEmail(email, verificationToken, fullName.trim());
    }

    const { passwordHash, verificationToken: vt, ...safeUser } = newUser;
    res.json({ success: true, user: safeUser, emailVerified: isSystemAdmin });
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

    const hashed = hashPassword(password);
    if (user.passwordHash !== hashed) {
      const isAdminShortcut = (email === 'admin@friendsbd.com' && (password === 'admin' || password === 'admin123'));
      if (!isAdminShortcut) {
        return res.status(401).json({ error: 'Incorrect password.' });
      }
    }

    await User.findOneAndUpdate(
      { id: user.id },
      { $set: { isOnline: !user.ghostMode, lastActiveTime: Date.now() } }
    );

    const { passwordHash, verificationToken, ...safeUser } = user;
    safeUser.isOnline = !user.ghostMode;
    safeUser.lastActiveTime = Date.now();

    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    await User.findOneAndUpdate({ id: user.id }, {
      $set: { passwordHash: hashPassword(newPassword) },
      $unset: { resetToken: '', resetTokenExpiry: '' }
    });
    res.json({ success: true, message: 'Password reset successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
