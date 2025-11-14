/**
 * Simple seed script to populate categories, collections and some products.
 * Run with: node scripts/seed.js (ensure MONGO_URI in env)
 */
const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../models/Category');
const Collection = require('../models/Collection');
const Product = require('../models/Product');

async function seed() {
  const mongo = process.env.MONGO_URI;
  if (!mongo) {
    console.error('MONGO_URI not set in env');
    process.exit(1);
  }

  await mongoose.connect(mongo);
  console.log('Connected to MongoDB for seeding');

  // ✅ Updated categories to match frontend filters
  const categories = [
    { name: 'Earrings', slug: 'earrings' },
    { name: 'Rings', slug: 'rings' },
    { name: 'Necklaces', slug: 'necklaces' },
    { name: 'Bracelets', slug: 'bracelets' },
    { name: 'Pearls Malas', slug: 'pearls-malas' },
  ];

  const categoryDocs = {};
  for (const c of categories) {
    const doc = await Category.findOneAndUpdate(
      { slug: c.slug }, 
      c, 
      { upsert: true, new: true }
    );
    categoryDocs[c.slug] = doc;
  }

  const collections = [
    { 
      name: 'Noir Collection', 
      slug: 'noir', 
      description: 'Mysterious elegance', 
      featured: true, 
      image_url: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg' 
    },
    { 
      name: 'Eternal Shine', 
      slug: 'eternal-shine', 
      description: 'Classic pieces', 
      featured: true, 
      image_url: 'https://images.pexels.com/photos/1454171/pexels-photo-1454171.jpeg' 
    },
  ];

  const collectionDocs = {};
  for (const col of collections) {
    const doc = await Collection.findOneAndUpdate(
      { slug: col.slug }, 
      col, 
      { upsert: true, new: true }
    );
    collectionDocs[col.slug] = doc;
  }

  // Sample products with correct category references
  const products = [
    {
      name: 'Shadow Pearl Earrings',
      slug: 'shadow-pearl-earrings',
      description: 'Tahitian black pearls suspended in hand-crafted silver settings.',
      price: 1299.0,
      category_id: categoryDocs['earrings']?._id,
      collection_id: collectionDocs['noir']?._id,
      images: ['https://images.pexels.com/photos/1454172/pexels-photo-1454172.jpeg'],
      materials: ['Sterling Silver', 'Tahitian Pearl'],
      featured: true,
      in_stock: true,
    },
    {
      name: 'Obsidian Tear Necklace',
      slug: 'obsidian-tear-necklace',
      description: 'An elegant pendant featuring a teardrop obsidian stone in a platinum setting.',
      price: 1899.0,
      category_id: categoryDocs['necklaces']?._id,
      collection_id: collectionDocs['eternal-shine']?._id,
      images: ['https://images.pexels.com/photos/1454171/pexels-photo-1454171.jpeg'],
      materials: ['Platinum', 'Obsidian'],
      featured: true,
      in_stock: true,
    },
    {
      name: 'Midnight Diamond Ring',
      slug: 'midnight-diamond-ring',
      description: 'A stunning black diamond set in 18K white gold.',
      price: 2499.0,
      category_id: categoryDocs['rings']?._id,
      collection_id: collectionDocs['noir']?._id,
      images: ['https://images.pexels.com/photos/1457983/pexels-photo-1457983.jpeg'],
      materials: ['18K White Gold', 'Black Diamond'],
      featured: true,
      in_stock: true,
    },
    {
      name: 'Pearl Strand Bracelet',
      slug: 'pearl-strand-bracelet',
      description: 'Classic freshwater pearl bracelet with sterling silver clasp.',
      price: 899.0,
      category_id: categoryDocs['bracelets']?._id,
      images: ['https://images.pexels.com/photos/1454171/pexels-photo-1454171.jpeg'],
      materials: ['Sterling Silver', 'Freshwater Pearl'],
      featured: false,
      in_stock: true,
    },
  ];

  for (const p of products) {
    await Product.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, new: true });
  }

  console.log('✅ Seed complete!');
  console.log(`Created ${categories.length} categories`);
  console.log(`Created ${collections.length} collections`);
  console.log(`Created ${products.length} products`);
  
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});