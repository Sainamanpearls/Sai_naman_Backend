const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const SocialPost = require('../models/SocialPost');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { redisClient } = require('../config/redisClient');

// ==================== PUBLIC ROUTES ====================

// Get all approved reviews with caching
router.get('/reviews', async (req, res) => {
  try {
    const { sortBy = 'latest' } = req.query;
    const cacheKey = `reviews:${sortBy}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    let sortOptions = {};
    if (sortBy === 'highest') sortOptions = { rating: -1, createdAt: -1 };
    else if (sortBy === 'lowest') sortOptions = { rating: 1, createdAt: -1 };
    else sortOptions = { createdAt: -1 };

    const reviews = await Review.find({ is_approved: true }).sort(sortOptions).lean();

    await redisClient.set(cacheKey, JSON.stringify(reviews), { EX: 600 }); // 10 min
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// Submit a new review (public)
router.post('/reviews', async (req, res) => {
  try {
    const { author_name, author_email, rating, review_text, product_id, photo_url } = req.body;

    if (!author_name || !author_email || !rating || !review_text)
      return res.status(400).json({ message: 'All fields are required' });

    if (rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    const review = new Review({
      author_name,
      author_email,
      rating,
      review_text,
      photo_url: photo_url || '',
      product_id: product_id || null,
      is_approved: false,
      verified_purchase: false,
    });

    await review.save();

    res.status(201).json({
      message: 'Review submitted successfully and is pending approval',
      review,
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Failed to submit review' });
  }
});

// Get all active social posts with caching
router.get('/social-posts', async (req, res) => {
  try {
    const cacheKey = 'social-posts:active';
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const posts = await SocialPost.find({ is_active: true }).sort({ display_order: 1 }).lean();

    await redisClient.set(cacheKey, JSON.stringify(posts), { EX: 1800 }); // 30 min
    res.json(posts);
  } catch (error) {
    console.error('Error fetching social posts:', error);
    res.status(500).json({ message: 'Failed to fetch social posts' });
  }
});

// ==================== ADMIN ROUTES ====================

// Invalidate caches after review actions
async function invalidateReviewCache() {
  const keys = await redisClient.keys('reviews*');
  if (keys.length) await redisClient.del(keys);
}

// Get all reviews (admin only)
router.get('/admin/reviews', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    let query = {};
    if (filter === 'pending') query.is_approved = false;
    else if (filter === 'approved') query.is_approved = true;

    const reviews = await Review.find(query).sort({ createdAt: -1 }).lean();
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// Approve / Reject / Delete review - invalidate cache
router.patch('/admin/reviews/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { is_approved: true }, { new: true });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    await invalidateReviewCache();
    res.json({ message: 'Review approved successfully', review });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({ message: 'Failed to approve review' });
  }
});

router.patch('/admin/reviews/:id/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { is_approved: false }, { new: true });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    await invalidateReviewCache();
    res.json({ message: 'Review rejected successfully', review });
  } catch (error) {
    console.error('Error rejecting review:', error);
    res.status(500).json({ message: 'Failed to reject review' });
  }
});

router.delete('/admin/reviews/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    await invalidateReviewCache();
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Failed to delete review' });
  }
});

// Social posts admin routes - invalidate cache on changes
async function invalidateSocialPostsCache() {
  await redisClient.del('social-posts:active');
}

router.post('/admin/social-posts', authenticateToken, isAdmin, async (req, res) => {
  try {
    const post = new SocialPost(req.body);
    await post.save();
    await invalidateSocialPostsCache();
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating social post:', error);
    res.status(500).json({ message: 'Failed to create social post' });
  }
});

router.put('/admin/social-posts/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const post = await SocialPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ message: 'Social post not found' });
    await invalidateSocialPostsCache();
    res.json(post);
  } catch (error) {
    console.error('Error updating social post:', error);
    res.status(500).json({ message: 'Failed to update social post' });
  }
});

router.delete('/admin/social-posts/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const post = await SocialPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Social post not found' });
    await invalidateSocialPostsCache();
    res.json({ message: 'Social post deleted successfully' });
  } catch (error) {
    console.error('Error deleting social post:', error);
    res.status(500).json({ message: 'Failed to delete social post' });
  }
});

module.exports = router;
