// routes/content.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const cache = require('../utils/cache');
const { redisClient } = require('../config/redisClient');

// ==================== PUBLIC PRODUCT ROUTES ====================

// GET /api/products - Get all products (public)
router.get('/products', async (req, res) => {
  try {
    const { featured, category, limit } = req.query;

    // Unique cache key based on query params
    const cacheKey = `content:products:featured:${featured || 'all'}:category:${category || 'all'}:limit:${limit || 'all'}`;

    const transformed = await cache(cacheKey, async () => {
      // Build query
      let query = {};
      if (featured === 'true') query.featured = true;
      if (category) {
        const cat = await Category.findOne({ slug: category });
        if (cat) query.category_id = cat._id;
      }

      let productsQuery = Product.find(query)
        .populate('category_id', 'name slug')
        .sort({ createdAt: -1 });

      if (limit) productsQuery = productsQuery.limit(parseInt(limit));

      const products = await productsQuery;

      // Transform to frontend format
      return products.map(p => ({
        id: p._id.toString(),
        _id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        discountedPrice: p.discountedPrice || null, // <-- Added discountedPrice
        images: p.images,
        in_stock: p.in_stock,
        featured: p.featured,
        category: p.category_id?.name?.toLowerCase() || p.category_id?.slug?.toLowerCase() || '',
        category_id: p.category_id,
      }));
    }, 600); // Cache for 10 minutes

    res.json(transformed);
  } catch (err) {
    console.error('Failed to fetch products', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/:slug - Get single product by slug (public)
router.get('/products/:slug', async (req, res) => {
  try {
    const cacheKey = `content:product:${req.params.slug}`;

    const transformed = await cache(cacheKey, async () => {
      const product = await Product.findOne({ slug: req.params.slug })
        .populate('category_id', 'name slug');

      if (!product) return null;

      return {
        id: product._id.toString(),
        _id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        discountedPrice: product.discountedPrice || null, // <-- Added discountedPrice
        images: product.images,
        in_stock: product.in_stock,
        featured: product.featured,
        category: product.category_id?.name || '',
        category_id: product.category_id,
      };
    }, 600);

    if (!transformed) return res.status(404).json({ message: 'Product not found' });
    res.json(transformed);
  } catch (err) {
    console.error('Failed to fetch product', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== PUBLIC CATEGORY ROUTES ====================

// GET /api/categories - Get all categories (public)
router.get('/categories', async (req, res) => {
  try {
    const transformed = await cache('content:categories', async () => {
      const categories = await Category.find().sort({ name: 1 });

      return categories.map(c => ({
        id: c._id.toString(),
        _id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        image_url: c.image_url || '',
      }));
    }, 600);

    res.json(transformed);
  } catch (err) {
    console.error('Failed to fetch categories', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
