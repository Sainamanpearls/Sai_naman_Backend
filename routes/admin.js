// routes/admin.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const { adminMiddleware } = require('../middleware/admin');
const cache = require('../utils/cache');
const { redisClient } = require('../config/redisClient');

router.use(adminMiddleware);

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // spaces to dashes
    .replace(/[^\w\-]+/g, '') // remove non-word chars
    .replace(/\-\-+/g, '-'); // collapse multiple dashes

// Helper to clear related caches
async function invalidateProductCaches(productId = null) {
  // Admin product caches
  await redisClient.keys('admin:products*').then(keys => keys.forEach(k => redisClient.del(k)));
  if (productId) await redisClient.del(`admin:product:${productId}`);

  // Public content caches
  await redisClient.keys('content:products*').then(keys => keys.forEach(k => redisClient.del(k)));
}

async function invalidateCategoryCaches() {
  // Admin caches
  await redisClient.del('admin:categories');

  // Public caches
  await redisClient.del('content:categories');
  await redisClient.keys('content:products*').then(keys => keys.forEach(k => redisClient.del(k)));
}

async function invalidateOrderCaches(orderId = null) {
  await redisClient.del('admin:orders');
  if (orderId) await redisClient.del(`admin:order:${orderId}`);
}

// ==================== PRODUCTS ====================

// GET /api/admin/products
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const cacheKey = `admin:products:page:${page}:limit:${limit}`;

    const data = await cache(cacheKey, async () => {
      const products = await Product.find()
        .populate('category_id', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Product.countDocuments();

      return {
        products,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    }, 600);

    res.json(data);
  } catch (err) {
    console.error('Failed to fetch products', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/products/:id
router.get('/products/:id', async (req, res) => {
  try {
    const cacheKey = `admin:product:${req.params.id}`;
    const product = await cache(cacheKey, async () => {
      return await Product.findById(req.params.id).populate('category_id').lean();
    }, 600);

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Failed to fetch product', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/products
router.post('/products', async (req, res) => {
  try {
    let { name, slug, description, price, discountedPrice, category_id, images, in_stock, featured } = req.body;
    if (!name || price === undefined) return res.status(400).json({ message: 'Name and price required' });
    if (!slug) slug = slugify(name);

    const existing = await Product.findOne({ slug });
    if (existing) return res.status(400).json({ message: 'Product with this slug already exists' });

    if (category_id) {
      const catExists = await Category.findById(category_id);
      if (!catExists) return res.status(400).json({ message: 'Invalid category_id' });
    }

    const product = new Product({ 
      name, 
      slug, 
      description: description || '', 
      price, 
      discountedPrice: discountedPrice !== undefined ? discountedPrice : null, 
      category_id: category_id || null, 
      images: images || [], 
      in_stock: in_stock !== undefined ? in_stock : true, 
      featured: featured || false 
    });
    await product.save();

    // Invalidate caches
    await invalidateProductCaches(product._id);

    const populated = await Product.findById(product._id).populate('category_id');
    res.status(201).json({ message: 'Product created successfully', product: populated });
  } catch (err) {
    console.error('Failed to create product', err);
    if (err.code === 11000) return res.status(400).json({ message: 'Product with this slug already exists' });
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', async (req, res) => {
  try {
    const { name, slug, description, price, discountedPrice, category_id, images, in_stock, featured } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let newSlug = slug || product.slug;
    if (!slug) newSlug = slugify(name || product.name);
    if (newSlug !== product.slug) {
      const existing = await Product.findOne({ slug: newSlug });
      if (existing && existing._id.toString() !== product._id.toString()) return res.status(400).json({ message: 'Product with this slug exists' });
      product.slug = newSlug;
    }

    if (category_id && category_id !== product.category_id?.toString()) {
      const catExists = await Category.findById(category_id);
      if (!catExists) return res.status(400).json({ message: 'Invalid category_id' });
      product.category_id = category_id;
    }

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (discountedPrice !== undefined) product.discountedPrice = discountedPrice;
    if (images !== undefined) product.images = images;
    if (in_stock !== undefined) product.in_stock = in_stock;
    if (featured !== undefined) product.featured = featured;

    await product.save();

    // Invalidate caches
    await invalidateProductCaches(product._id);

    const updated = await Product.findById(product._id).populate('category_id');
    res.json({ message: 'Product updated successfully', product: updated });
  } catch (err) {
    console.error('Failed to update product', err);
    if (err.code === 11000) return res.status(400).json({ message: 'Product with this slug exists' });
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await invalidateProductCaches(product._id);

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Failed to delete product', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== CATEGORIES ====================

// GET /api/admin/categories
router.get('/categories', async (req, res) => {
  try {
    const data = await cache('admin:categories', async () => {
      return await Category.find({}).lean();
    }, 600);
    res.json(data);
  } catch (err) {
    console.error('Failed to fetch categories', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/categories
router.post('/categories', async (req, res) => {
  try {
    const { name, slug, image_url } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const categorySlug = slug || slugify(name);
    const existing = await Category.findOne({ slug: categorySlug });
    if (existing) return res.status(400).json({ message: 'Category with this slug exists' });

    const category = new Category({ name, slug: categorySlug, image_url: image_url || '' });
    await category.save();

    await invalidateCategoryCaches();

    res.status(201).json({ message: 'Category created', category });
  } catch (err) {
    console.error('Failed to create category', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', async (req, res) => {
  try {
    const { name, slug, image_url } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (image_url !== undefined) category.image_url = image_url;

    await category.save();
    await invalidateCategoryCaches();

    res.json({ message: 'Category updated', category });
  } catch (err) {
    console.error('Failed to update category', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const productsUsingCategory = await Product.find({ category_id: category._id });
    if (productsUsingCategory.length > 0) return res.status(400).json({ message: 'Cannot delete category with products' });

    await Category.findByIdAndDelete(req.params.id);
    await invalidateCategoryCaches();

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Failed to delete category', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ORDERS ====================

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await cache('admin:orders', async () => {
      return await Order.find().sort({ createdAt: -1 }).lean();
    }, 300);
    res.json(orders);
  } catch (err) {
    console.error('Failed to fetch orders', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/orders/:id
router.get('/orders/:id', async (req, res) => {
  try {
    const cacheKey = `admin:order:${req.params.id}`;
    const data = await cache(cacheKey, async () => {
      const order = await Order.findById(req.params.id).lean();
      if (!order) return null;
      const items = await OrderItem.find({ order_id: order._id }).lean();
      return { order, items };
    }, 300);

    if (!data) return res.status(404).json({ message: 'Order not found' });
    res.json(data);
  } catch (err) {
    console.error('Failed to fetch order', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/orders/:id
router.put('/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    if (status) order.status = status;
    await order.save();

    await invalidateOrderCaches(order._id);

    res.json({ message: 'Order updated successfully', order });
  } catch (err) {
    console.error('Failed to update order', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/orders/:id
router.delete('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await OrderItem.deleteMany({ order_id: order._id });
    await Order.findByIdAndDelete(req.params.id);

    await invalidateOrderCaches(order._id);

    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Failed to delete order', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
