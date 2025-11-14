const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // assuming you have a Product model
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
