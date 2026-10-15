
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

// Protect routes using JWT
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Not authorized. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Token is missing. Please log in again.',
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (!decoded.id) {
      return res.status(401).json({
        message: 'Invalid token payload. Please log in again.',
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: 'User no longer exists.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: 'This account has been deactivated. Contact an administrator.',
      });
    }

    const isLegacyStaff =
      ['admin', 'support'].includes(user.role) &&
      user.emailVerified === undefined
    if (user.emailVerified !== true && !isLegacyStaff) {
      return res.status(403).json({
        message: 'Email verification required. Verify your email before continuing.',
      })
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error('Authentication error:', error.message);

    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'CastError'
    ) {
      return res.status(401).json({
        message: 'Invalid or expired token. Please log in again.',
      });
    }

    return res.status(500).json({
      message: 'Authentication failed.',
    });
  }
}

// Restrict routes by role
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Please log in first.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to access this resource.',
      });
    }

    return next();
  };
}

module.exports = { protect, authorize };
