const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  emp_code: String,
  name: String,

  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
  },
  department: String,

  date: { type: String, required: true },

  // ── IN ──
  in_time: String,
  in_latitude: Number,
  in_longitude: Number,
  in_location_status: String,
  in_site: String,
  in_distance: Number,
  in_selfie_url: String,
  in_selfie_public_id: String,
  in_address: String,        // 🆕 Full address

  // ── OUT ──
  out_time: String,
  out_latitude: Number,
  out_longitude: Number,
  out_location_status: String,
  out_site: String,
  out_distance: Number,
  out_selfie_url: String,
  out_selfie_public_id: String,
  out_address: String,       // 🆕 Full address

  // Face match confidence
  confidence: { type: Number, default: 0 },

  // Suspicious flagging
  flagged: { type: Boolean, default: false },
  flag_reasons: [String],
  reviewed: { type: Boolean, default: false },
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  review_notes: String,

  status: {
    type: String,
    enum: ['present', 'absent', 'half-day'],
    default: 'present'
  },
}, { timestamps: true });

attendanceSchema.index({ company_id: 1, date: 1 });
attendanceSchema.index({ emp_id: 1, date: 1 });
attendanceSchema.index({ flagged: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);