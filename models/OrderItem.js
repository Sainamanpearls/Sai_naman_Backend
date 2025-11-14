const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  product_id: { type: String, ref: 'Product', required: true },
  product_name: { type: String, required: true },
  product_price: { type: Number, required: true },
  discount_price: {type: Number},
  quantity: { type: Number, required: true },
  subtotal: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('OrderItem', orderItemSchema);
