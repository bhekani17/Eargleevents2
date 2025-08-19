import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import Admin from '../models/Admin.js';

// @desc    Protect routes - verify JWT token
// @access  Private
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const { authorization } = req.headers;

  // Check for token in headers
  if (authorization && authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

      // Get admin from the token
      req.admin = await Admin.findById(decoded.id).select('-password');

      if (!req.admin) {
        res.status(401);
        throw new Error('Not authorized, admin not found');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// @desc    Authorize roles (admin, staff, etc.)
// @param   {string} roles - Comma-separated list of roles
// @access  Private
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      res.status(401);
      throw new Error('Not authorized, no admin found');
    }

    if (!roles.includes(req.admin.role)) {
      res.status(403);
      throw new Error(`User role ${req.admin.role} is not authorized to access this route`);
    }

    next();
  };
};

// @desc    Admin middleware (for backward compatibility)
// @access  Private/Admin
export const admin = (req, res, next) => {
  if (req.admin && req.admin.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};
