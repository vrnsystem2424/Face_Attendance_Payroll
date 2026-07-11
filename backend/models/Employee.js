// // models/Employee.js

// const mongoose = require('mongoose');

// const employeeSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   emp_code: { type: String, required: true, unique: true },
//   phone: { type: String, required: true, unique: true },
//   email: { type: String, default: '' },
//   password: { type: String, required: true },
//   department: { type: String, required: true },
//   designation: { type: String, required: true },

//   // ── MULTI-COMPANY ──
//   company_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Company',
//     required: function () {
//       return this.role !== 'super_admin';
//     },
//   },

//   // Leave approval manager (name from master)
//   leave_approval_manager: {
//     type: String,
//     default: '',
//   },
//   // 🆕 For admin who manages specific manager's leaves only
// assigned_manager: { type: String, default: '' },
// admin_type: { type: String, enum: ['full', 'followup', ''], default: '' },
//   // 💰 Monthly Salary (for payroll)
//   monthly_salary: {
//     type: Number,
//     default: 0,
//     min: 0,
//   },

//   // Face encodings
//   face_encoding: { type: [Number], default: [] },
//   all_encodings: { type: [[Number]], default: [] },
//   face_capture_count: { type: Number, default: 0 },
//   face_registered: { type: Boolean, default: false },

//   // Device Lock
//   device_id: { type: String, default: null },
//   device_info: {
//     screen:       { type: String, default: '' },
//     platform:     { type: String, default: '' },
//     cores:        { type: Number, default: 0 },
//     memory:       { type: Number, default: 0 },
//     touch_points: { type: Number, default: 0 },
//   },
//   device_registered_at: { type: Date, default: null },

//   status: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected'],
//     default: 'pending'
//   },

//   role: {
//     type: String,
//     enum: ['employee', 'manager', 'admin', 'super_admin'],
//     default: 'employee'
//   }
// }, { timestamps: true });

// employeeSchema.index({ company_id: 1, role: 1 });
// employeeSchema.index({ company_id: 1, status: 1 });

// module.exports = mongoose.model('Employee', employeeSchema);





// Koi change nahi - same as aapka existing file
// Already designation aur leave_approval_manager fields hain ✅

const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  emp_code: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, default: '' },
  password: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },

  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: function () {
      return this.role !== 'super_admin';
    },
  },

  leave_approval_manager: {
    type: String,
    default: '',
  },

  assigned_manager: { type: String, default: '' },
  admin_type: { type: String, enum: ['full', 'followup', ''], default: '' },

  monthly_salary: {
    type: Number,
    default: 0,
    min: 0,
  },

  face_encoding: { type: [Number], default: [] },
  all_encodings: { type: [[Number]], default: [] },
  face_capture_count: { type: Number, default: 0 },
  face_registered: { type: Boolean, default: false },

  device_id: { type: String, default: null },
  device_info: {
    screen:       { type: String, default: '' },
    platform:     { type: String, default: '' },
    cores:        { type: Number, default: 0 },
    memory:       { type: Number, default: 0 },
    touch_points: { type: Number, default: 0 },
  },
  device_registered_at: { type: Date, default: null },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  role: {
    type: String,
    enum: ['employee', 'manager', 'admin', 'super_admin'],
    default: 'employee'
  }
}, { timestamps: true });

employeeSchema.index({ company_id: 1, role: 1 });
employeeSchema.index({ company_id: 1, status: 1 });

module.exports = mongoose.model('Employee', employeeSchema);