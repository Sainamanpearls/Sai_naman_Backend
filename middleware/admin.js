const jwt = require('jsonwebtoken');
const User = require('../models/User');

// List of admin emails - you can also store this in environment variables
const ADMIN_EMAILS = [
  'sainamanpearls1@gmail.com',
  // Add more admin emails here
];

// Middleware to check if user is authenticated
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    
    // Attach user info to request
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if user is admin
const adminMiddleware = async (req, res, next) => {
  try {
    // First verify authentication
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    
    // Fetch user from database to get email
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user email is in admin list
    if (!ADMIN_EMAILS.includes(user.email)) {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    // Attach user info to request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      isAdmin: true,
    };
    
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
};