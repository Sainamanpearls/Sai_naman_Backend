const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, default: 0 },
  discountedPrice: {
  type: Number,
  required: false, // optional
  default: null,   // or undefined if you prefer
},
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

  images: { type: [String], default: [] },

  in_stock: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
