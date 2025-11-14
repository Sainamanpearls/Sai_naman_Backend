const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  image_url: { type: String},
});

module.exports = mongoose.model('Category', categorySchema);
