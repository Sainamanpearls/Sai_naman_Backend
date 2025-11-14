const mongoose = require('mongoose');

const socialPostSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      enum: ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook'],
    },
    post_type: {
      type: String,
      enum: ['image', 'video', 'reel', 'story'],
      default: 'image',
    },
    embed_url: String,
    embed_code: String,
    caption: {
      type: String,
      required: true,
    },
    media_url: String,
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    display_order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SocialPost', socialPostSchema);