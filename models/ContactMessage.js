const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  subject: { type: String, default: '' },
  message: { type: String, required: true },
  status: { type: String, default: 'new' },
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', contactSchema);
