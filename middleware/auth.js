const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Admin emails list
const ADMIN_EMAILS = [
  'sainamanpearls1@gmail.com',
  'akash@gmail.com',
  'admin@sainamanpearls.com',
];

// Middleware to authenticate token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    
    // Fetch user from database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Attach user info to request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
    };
    
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    // User should already be attached by authenticateToken
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user email is in admin list
    if (!ADMIN_EMAILS.includes(req.user.email)) {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    next();
  } catch (err) {
    console.error('Admin check error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
};