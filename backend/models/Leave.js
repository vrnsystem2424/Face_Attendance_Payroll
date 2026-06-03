// models/Leave.js

const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  uid: { type: Number, unique: true },

  emp_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  emp_code: { type: String, required: true },
  name: { type: String, required: true },

  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  department: { type: String, default: '' },

  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  manager_name: { type: String, default: '' },

  from_date: { type: String, required: true },
  to_date: { type: String, required: true },

  shift: {
    type: String,
    enum: ['Day', 'Night', 'General', ''],
    default: 'General',
  },

  leave_type: {
    type: String,
    enum: ['sick', 'casual', 'emergency', 'other'],
    required: true
  },

  is_half_day: { type: Boolean, default: false },
  half_day_period: { type: String, enum: ['first', 'second', ''], default: '' },

  leave_days: { type: Number, required: true, default: 1 },

  // 🆕 NEW FIELDS
  applied_days: { type: Number, default: 1 },
  approved_days: { type: Number, default: 0 },
  paid_days: { type: Number, default: 0 },
  unpaid_days: { type: Number, default: 0 },
  balance_before: { type: Number, default: 0 },
  balance_after: { type: Number, default: 0 },

  reason: { type: String, required: true },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  manager_remark: { type: String, default: '' },
  manager_action_date: { type: Date, default: null },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  approved_by_role: { type: String, enum: ['manager', 'admin', 'super_admin', ''], default: '' },

  admin_remark: { type: String, default: '' },

  submission_date_ist: { type: String, default: '' },

}, { timestamps: true });

leaveSchema.index({ company_id: 1, status: 1 });
leaveSchema.index({ manager_id: 1, status: 1 });
leaveSchema.index({ emp_id: 1 });

leaveSchema.pre('save', async function (next) {
  if (this.isNew && !this.uid) {
    const lastLeave = await this.constructor.findOne().sort({ uid: -1 });
    this.uid = lastLeave?.uid ? lastLeave.uid + 1 : 1;
  }
  
});

module.exports = mongoose.model('Leave', leaveSchema);