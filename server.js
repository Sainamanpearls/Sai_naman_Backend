// server.js (Render-optimized)

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config(); // only needed for local development

const { connectRedis } = require('./config/redisClient');
require('./cron/syncShiprocketCron'); // make sure cron is safe for multiple instances

const app = express();
const PORT = process.env.PORT || 5001;

// =========================
// CORS
// =========================
const allowedOrigins = [
  'http://localhost:5173',
  'https://www.sainamanpearls.com'
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.options('*', cors({ origin: allowedOrigins, credentials: true }));

// =========================
// BODY PARSER
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// ROUTES
// =========================
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/upload'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api', require('./routes/content'));
app.use('/api', require('./routes/reviews'));
app.use('/api', require('./routes/orders'));
app.use('/api/user', require('./routes/userOrders'));

// =========================
// Health Check
// =========================
app.get('/api/health', (req, res) => res.json({ ok: true }));

// =========================
// DATABASE + SERVER START
// =========================
async function start() {
  try {
    // MongoDB
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB');
    } else {
      console.warn(
        '⚠️  MONGO_URI not set — skipping MongoDB connection (server will still run)'
      );
    }

    // Redis
    await connectRedis();
    console.log('✅ Connected to Redis!');

    // Start server
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start server', err);
    process.exit(1);
  }
}

start();

// =========================
// FALLBACK ROUTES
// =========================
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  res.status(404).send('Not found');
});

// =========================
// GLOBAL ERROR HANDLER
// =========================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  if (req.path.startsWith('/api')) {
    return res.status(status).json({ message: err.message || 'Server error' });
  }
  res.status(status).send(err.message || 'Server error');
});
