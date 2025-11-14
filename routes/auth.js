const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'dev-secret', {
      expiresIn: '7d',
    });

    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);

    const user = await User.findOne({ email });
    console.log('User found:', user);

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    console.log('Password match:', ok);

    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me - Verify token and get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
