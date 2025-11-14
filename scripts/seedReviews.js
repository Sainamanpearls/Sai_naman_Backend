// backend/scripts/seedReviews.js
// Run this script to add hardcoded reviews and social posts
// Usage: node scripts/seedReviews.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // ✅ explicitly load from backend/.env

const Review = require('../models/Review');
const SocialPost = require('../models/SocialPost');


const hardcodedReviews = [
  {
    author_name: "Priya Sharma",
    author_email: "priya.sharma@example.com",
    author_image: "https://i.pravatar.cc/150?img=1",
    rating: 5,
    review_text: "Absolutely stunning pearl necklace! The quality is exceptional and the craftsmanship is beautiful. I wore it to my sister's wedding and received so many compliments. Highly recommend Sai Naman Pearls!",
    verified_purchase: true,
    is_approved: true,
  },
  {
    author_name: "Anjali Reddy",
    author_email: "anjali.reddy@example.com",
    author_image: "https://i.pravatar.cc/150?img=5",
    rating: 5,
    review_text: "The pearl earrings are gorgeous! They're elegant yet modern. Perfect for both traditional and contemporary outfits. The packaging was also beautiful. Will definitely buy again!",
    verified_purchase: true,
    is_approved: true,
  },
//   {
//     author_name: "Meera Patel",
//     author_email: "meera.patel@example.com",
//     author_image: "https://i.pravatar.cc/150?img=9",
//     rating: 5,
//     review_text: "I purchased the pearl bracelet as a gift for my mother's birthday. She absolutely loved it! The pearls have a beautiful luster and the clasp is secure. Thank you for making her day special!",
//     verified_purchase: true,
//     is_approved: true,
//   },
  {
    author_name: "Kavya Menon",
    author_email: "kavya.menon@example.com",
    author_image: "https://i.pravatar.cc/150?img=10",
    rating: 5,
    review_text: "Best pearl jewelry I've ever owned! The quality is outstanding and they look exactly like the pictures. Customer service was also very helpful. Worth every rupee!",
    verified_purchase: true,
    is_approved: true,
  },
  {
    author_name: "Divya Krishna",
    author_email: "divya.krishna@example.com",
    author_image: "https://i.pravatar.cc/150?img=16",
    rating: 5,
    review_text: "I'm in love with my pearl ring! It's delicate, elegant, and perfect for everyday wear. The pearl has a beautiful shine and the gold setting is exquisite. Highly recommend!",
    verified_purchase: true,
    is_approved: true,
  },
  {
    author_name: "Lakshmi Iyer",
    author_email: "lakshmi.iyer@example.com",
    author_image: "https://i.pravatar.cc/150?img=20",
    rating: 5,
    review_text: "Purchased multiple pieces from Sai Naman Pearls and each one is more beautiful than the last. The attention to detail is remarkable. These will be family heirlooms for sure!",
    verified_purchase: true,
    is_approved: true,
  },
  {
    author_name: "Sneha Gupta",
    author_email: "sneha.gupta@example.com",
    author_image: "https://i.pravatar.cc/150?img=23",
    rating: 5,
    review_text: "The pearl pendant is absolutely beautiful! I wear it almost every day. It's become my signature piece. The quality is exceptional and shipping was fast. Thank you!",
    verified_purchase: true,
    is_approved: true,
  },
  {
    author_name: "Riya Kapoor",
    author_email: "riya.kapoor@example.com",
    author_image: "https://i.pravatar.cc/150?img=26",
    rating: 5,
    review_text: "These pearls are genuine and of the highest quality. I've compared them to other brands and Sai Naman is by far the best. The customer service is also top-notch!",
    verified_purchase: true,
    is_approved: true,
  }
];

const socialPosts = [
  {
    platform: "instagram",
    post_type: "image",
    caption: "✨ New pearl necklace collection just dropped! Which one is your favorite? 💎 #SaiNamanPearls #LuxuryJewelry",
    media_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
    likes: 2450,
    comments: 127,
    is_active: true,
    display_order: 1,
  },
  {
    platform: "instagram",
    post_type: "reel",
    embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    caption: "💫 Behind the scenes: Crafting perfection, one pearl at a time. Watch how we create our signature pieces! #Craftsmanship #Pearls",
    media_url: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80",
    likes: 5230,
    comments: 289,
    is_active: true,
    display_order: 2,
  },
  {
    platform: "instagram",
    post_type: "image",
    caption: "🌟 Elegance redefined. Our pearl earrings collection - perfect for any occasion. Shop now! #PearlEarrings #Elegance",
    media_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
    likes: 1890,
    comments: 94,
    is_active: true,
    display_order: 3,
  },
  {
    platform: "youtube",
    post_type: "video",
    embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    caption: "🎥 Complete guide to choosing the perfect pearl jewelry | Sai Naman Pearls",
    likes: 3420,
    comments: 156,
    is_active: true,
    display_order: 4,
  },
  {
    platform: "instagram",
    post_type: "image",
    caption: "💍 The perfect pearl ring doesn't exi— Oh wait, it does! ✨ #PearlRing #BridalJewelry",
    media_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
    likes: 3120,
    comments: 167,
    is_active: true,
    display_order: 5,
  },
  {
    platform: "instagram",
    post_type: "reel",
    embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    caption: "✨ ASMR pearl jewelry unboxing | The most satisfying sound 🎁 #Unboxing #ASMR #LuxuryJewelry",
    media_url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
    likes: 6780,
    comments: 312,
    is_active: true,
    display_order: 6,
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing hardcoded reviews (optional)
    // await Review.deleteMany({ author_email: { $in: hardcodedReviews.map(r => r.author_email) } });
    // await SocialPost.deleteMany({});

    // Insert reviews
    const insertedReviews = await Review.insertMany(hardcodedReviews);
    console.log(`✅ Inserted ${insertedReviews.length} reviews`);

    // Insert social posts
    const insertedPosts = await SocialPost.insertMany(socialPosts);
    console.log(`✅ Inserted ${insertedPosts.length} social posts`);

    console.log('🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();