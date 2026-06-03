// models/Site.js

const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  site_name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['office', 'site'],
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  radius: {
    type: Number,
    default: 100
  },
  is_active: {
    type: Boolean,
    default: true
  },

  // 🆕 MULTI-COMPANY SUPPORT
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: function () {
      return this.role !== 'super_admin';   // optional for super admin
    },
  },
}, { timestamps: true });

// 🆕 Index for fast company-based queries
siteSchema.index({ company_id: 1, is_active: 1 });

module.exports = mongoose.model('Site', siteSchema);