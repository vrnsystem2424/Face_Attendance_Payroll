// // models/LeaveBalance.js

// const mongoose = require('mongoose');

// const leaveBalanceSchema = new mongoose.Schema({
//   emp_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Employee',
//     required: true,
//     unique: true,          // ✅ yeh khud index + unique banata hai
//   },
//   emp_code: String,
//   name: String,

//   company_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Company',
//     required: true,
//   },

//   // ── Current live balance ──
//   current_balance: {
//     type: Number,
//     default: 0,
//   },

//   // ── Lifetime stats ──
//   total_credited: {
//     type: Number,
//     default: 0,
//   },
//   total_used: {
//     type: Number,
//     default: 0,
//   },

//   // ── Monthly history (audit trail) ──
//   history: [{
//     month: Number,
//     year: Number,
//     opening_balance: Number,
//     credited: Number,
//     used: Number,
//     closing_balance: Number,

//     leaves_log: [{
//       leave_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Leave' },
//       from_date: String,
//       to_date: String,
//       applied_days: Number,
//       approved_days: Number,
//       paid_days: Number,
//       unpaid_days: Number,
//       approved_on: Date,
//     }],

//     credited_on: { type: Date, default: Date.now },
//   }],

//   // ── Last credited month tracking ──
//   last_credited_month: Number,
//   last_credited_year: Number,

// }, { timestamps: true });

// // ✅ emp_id ka alag index REMOVE kiya — unique:true upar se handle kar raha hai
// leaveBalanceSchema.index({ company_id: 1 });  // yeh theek hai, duplicate nahi

// module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);



const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  emp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    unique: true,
  },
  emp_code: String,
  name: String,

  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },

  // ── Current live balance ──
  current_balance: {
    type: Number,
    default: 0,
  },

  // ── Lifetime stats ──
  total_credited: {
    type: Number,
    default: 0,
  },
  total_used: {
    type: Number,
    default: 0,
  },

  // ── Monthly history (audit trail) ──
  history: [{
    month: Number,
    year: Number,
    opening_balance: Number,
    credited: Number,
    used: Number,
    closing_balance: Number,

    leaves_log: [{
      leave_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Leave' },
      from_date: String,
      to_date: String,
      applied_days: Number,
      approved_days: Number,
      paid_days: Number,
      unpaid_days: Number,
      approved_on: Date,
    }],

    credited_on: { type: Date, default: Date.now },
  }],

  // ── Last credited month tracking ──
  last_credited_month: Number,
  last_credited_year: Number,

}, { timestamps: true });

leaveBalanceSchema.index({ company_id: 1 });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);