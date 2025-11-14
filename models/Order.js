const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer_name: { type: String, required: true },
   customer_email: { type: String, required: true },
  customer_phone: { type: String },
  shipping_address: { type: String, required: true },
  city: { type: String },
  postal_code: { type: String },
  country: { type: String },
  total_amount: { type: Number, required: true },
  status: { type: String, default: 'pending' },

  shiprocket_channel_id: { type: String }, 
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
