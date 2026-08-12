

// models/Site.js

const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  site_name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['office', 'site'],
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  radius: {
    type: Number,
    default: 300,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
}, { timestamps: true });

siteSchema.index({ company_id: 1, is_active: 1 });

module.exports = mongoose.model('Site', siteSchema);