/**
 * Role-Based Access Control (RBAC) Utility
 * 
 * Defines the progressive weight index for system roles to systematically lock down server routes.
 */

const ROLE_WEIGHTS = {
  // Admins & System
  'admin': 100,
  'system_bot': 100,

  // Moderation Hierarchy
  'head_moderator': 80,
  'senior_moderator': 60,
  'moderator': 40,
  'junior_moderator': 20,
  
  // Functional Staff (Can be adjusted based on specific needs)
  'staff': 50, // legacy generic staff
  'content_creator': 10,
  'event_organizer': 10,
  'support_staff': 30,

  // General & VIP Tiers
  'elite_vip': 5,
  'premium': 4,
  'veteran_member': 3,
  'trusted_member': 2,
  'user': 1,
  'starter': 0
};

/**
 * Checks if the user's role meets or exceeds the required role tier.
 * @param {string} userRole - The user's current role.
 * @param {string} requiredRoleTier - The minimum role required.
 * @returns {boolean} - True if permitted, False otherwise.
 */
function checkPermission(userRole, requiredRoleTier) {
  const userWeight = ROLE_WEIGHTS[userRole] || 0;
  const requiredWeight = ROLE_WEIGHTS[requiredRoleTier] || 0;
  
  return userWeight >= requiredWeight;
}

/**
 * Express Middleware to protect routes based on role tier.
 * Requires `req.user` to be populated with the user's role (e.g. by auth middleware).
 * @param {string} requiredRoleTier - The minimum role required to access the route.
 */
function requireRoleTier(requiredRoleTier) {
  return (req, res, next) => {
    if (!req.user || !req.user.user_role) {
      return res.status(401).json({ error: 'Unauthorized: No user session found.' });
    }

    const hasPermission = checkPermission(req.user.user_role, requiredRoleTier);
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions to perform this action.',
        requiredTier: requiredRoleTier,
        userRole: req.user.user_role
      });
    }

    next();
  };
}

module.exports = {
  ROLE_WEIGHTS,
  checkPermission,
  requireRoleTier
};
