const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    author_name: {
      type: String,
      required: true,
      trim: true,
    },
    author_email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    author_image: {
      type: String,
      required: false,
    },

     photo_url: {            
      type: String,
      required: false,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review_text: {
      type: String,
      required: true,
      trim: true,
    },
    verified_purchase: {
      type: Boolean,
      default: false,
    },
    is_approved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ is_approved: 1, createdAt: -1 });
reviewSchema.index({ author_email: 1 });

module.exports = mongoose.model('Review', reviewSchema);