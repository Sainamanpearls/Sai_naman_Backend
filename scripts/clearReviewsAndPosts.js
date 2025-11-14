// backend/scripts/clearReviewsAndPosts.js
// Usage: node scripts/clearReviewsAndPosts.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Review = require('../models/Review');
const SocialPost = require('../models/SocialPost');

async function clearDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // 🧹 Delete all documents (or filter if you want)
    const deletedReviews = await Review.deleteMany({});
    const deletedSocialPosts = await SocialPost.deleteMany({});

    console.log(`🗑️ Deleted ${deletedReviews.deletedCount} reviews`);
    console.log(`🗑️ Deleted ${deletedSocialPosts.deletedCount} social posts`);

    console.log('🎉 Database cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
