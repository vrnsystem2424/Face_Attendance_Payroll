// models/MonthlySettings.js

const mongoose = require('mongoose');

const monthlySettingsSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  
  // ── Required total hours for the month ──
  required_hours: {
    type: Number,
    default: 240,    // admin can change
  },
  
  // ── Daily standard hours (used for leave credit) ──
  daily_hours: {
    type: Number,
    default: 8,
  },
  
  // ── Holiday dates (format: "D/M/YYYY") ──
  holidays: [{
    date: String,        // "5/11/2025"
    name: String,        // "Diwali"
  }],
  
  // ── Weekly off days ──
  weekly_off: {
    type: [String],
    default: ['Sunday'],
  },
  
  // ── Created by ──
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
}, { timestamps: true });

// Unique combination per company per month
monthlySettingsSchema.index({ company_id: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MonthlySettings', monthlySettingsSchema);