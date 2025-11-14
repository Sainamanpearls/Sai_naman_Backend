// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const dotenv = require('dotenv');


const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

dotenv.config({ path: path.resolve(__dirname, envFile) });

const { connectRedis } = require('./config/redisClient');
require('./cron/syncShiprocketCron');
const app = express();
const PORT = process.env.PORT || 5001;



// ✅ 1. CORS FIRST
app.use(cors({
  origin: [
    'http://localhost:5173', // for local development
    'https://e-commerce-shopping-delta.vercel.app', 
    'https://e-commerce-shopping-5y9f.vercel.app',// ✅ your deployed frontend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors({
  origin: [
    'http://localhost:5173',
    'https://e-commerce-shopping-delta.vercel.app',
    'https://e-commerce-shopping-5y9f.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// ✅ 2. BODY PARSER (must come BEFORE any routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 3. ROUTES
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const uploadRoutes = require("./routes/upload");
app.use("/api", uploadRoutes);


const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);



const contactRoutes = require('./routes/contact');
app.use('/api/contact', contactRoutes);

const contentRoutes = require('./routes/content');
app.use('/api', contentRoutes);

const ordersRoutes = require('./routes/orders');
app.use('/api', ordersRoutes);

const userOrdersRoutes = require('./routes/userOrders');
app.use('/api/user', userOrdersRoutes);


const reviewRoutes = require('./routes/reviews');
app.use('/api', reviewRoutes);

// Basic health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Start server after optional DB connect
async function start() {
  const mongo = process.env.MONGO_URI;
  try {
    if (mongo) {
      await mongoose.connect(mongo, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
      });
      console.log('✅ Connected to MongoDB');
    } else {
      console.log('⚠️  MONGO_URI not set — skipping MongoDB connection (server will still run)');
    }

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start server', err);
    process.exit(1);
  } 

  
connectRedis()
  .then(() => console.log('Connected to Redis!'))
  .catch(err => console.error('Redis connection failed:', err));
}

start();

// Fallback for unmatched routes
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  res.status(404).send('Not found');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  if (req.path.startsWith('/api')) {
    return res.status(status).json({ message: err.message || 'Server error' });
  }
  res.status(status).send(err.message || 'Server error');
});