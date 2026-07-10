const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('[WARN] JWT_SECRET not set. Using insecure default. Set JWT_SECRET in .env');
  return 'friendsbd_dev_jwt_secret_change_in_production';
})();

function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, user_role: user.user_role },
    JWT_SECRET,
    { expiresIn: '3h' }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
      }
      return res.status(403).json({ error: 'Invalid authentication token.' });
    }
    req.user = decoded;
    next();
  });
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (_) {}
  }
  next();
}

module.exports = { generateToken, authenticateToken, optionalAuth, JWT_SECRET };
