const mongoose = require('mongoose');

const adjustmentHistorySchema = new mongoose.Schema(
  {
    emp_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    adjusted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    type: {
      type: String,
      default: 'credit',
    },
    adjustment_type: {
      type: String,
    },
    days: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    target_month: {
      type: Number,
    },
    month: {
      type: Number,
    },
    target_year: {
      type: Number,
    },
    year: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdjustmentHistory', adjustmentHistorySchema);