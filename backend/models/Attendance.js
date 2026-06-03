const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  emp_code: String,
  name: String,

  // 🆕 Multi-company
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
  in_location_status: String,    // 'on-site' | 'out-of-range' | 'no-gps'
  in_site: String,
  in_distance: Number,

  // ── OUT ──
  out_time: String,
  out_latitude: Number,
  out_longitude: Number,
  out_location_status: String,
  out_site: String,
  out_distance: Number,

  // 🆕 Face match confidence
  confidence: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['present', 'absent', 'half-day'],
    default: 'present'
  },
}, { timestamps: true });

attendanceSchema.index({ company_id: 1, date: 1 });
attendanceSchema.index({ emp_id: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);