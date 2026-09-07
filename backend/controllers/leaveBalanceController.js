

// const LeaveBalance = require('../models/LeaveBalance');
// const Employee = require('../models/Employee');
// const Company = require('../models/Company');
// const Leave = require('../models/Leave');

// // ════════════════════════════════════════
// // UNIVERSAL DATE PARSER
// // ════════════════════════════════════════
// const parseDateParts = (dateStr) => {
//   if (!dateStr) return null;
//   const str = String(dateStr).trim().split('T')[0];
//   let d, m, y;

//   if (str.includes('/')) {
//     const p = str.split('/');
//     d = parseInt(p[0], 10);
//     m = parseInt(p[1], 10);
//     y = parseInt(p[2], 10);
//   } else if (str.includes('-')) {
//     const p = str.split('-');
//     if (p[0].length === 4) {
//       y = parseInt(p[0], 10);
//       m = parseInt(p[1], 10);
//       d = parseInt(p[2], 10);
//     } else {
//       d = parseInt(p[0], 10);
//       m = parseInt(p[1], 10);
//       y = parseInt(p[2], 10);
//     }
//   }

//   if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
//   return { day: d, month: m, year: y, key: `${d}/${m}/${y}` };
// };

// const getJoiningDate = (employee) => {
//   const raw = employee?.joining_date || employee?.createdAt;
//   if (!raw) return null;

//   const p = parseDateParts(raw);
//   if (p) return new Date(p.year, p.month - 1, p.day);

//   const dt = new Date(raw);
//   if (!isNaN(dt.getTime())) {
//     return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
//   }
//   return null;
// };

// // ════════════════════════════════════════
// // FREE LEAVES COUNT
// // RCC site worker = 2, baaki sab = 1
// // ════════════════════════════════════════
// const getFreeLeavesCount = async (employee) => {
//   if (!employee || !employee.company_id) return 1;

//   let isRCC = false;
//   if (typeof employee.company_id === 'object' && employee.company_id.code) {
//     isRCC = employee.company_id.code.toUpperCase() === 'RCC';
//   } else {
//     try {
//       const company = await Company.findById(employee.company_id).lean();
//       if (company?.code?.toUpperCase() === 'RCC') isRCC = true;
//     } catch (err) {}
//   }

//   if (employee.worker_type === 'site' && isRCC) return 2;
//   return 1;
// };

// // ════════════════════════════════════════
// // JOINING DATE RULE (25th cutoff)
// // ════════════════════════════════════════
// // - Joining se pehle ke months → 0
// // - Joining month:
// //     day > 25  → 0 leave
// //     day <= 25 → full free leaves
// // - Joining ke baad ke months → full free leaves
// const getCreditedLeavesForMonth = async (employee, month, year) => {
//   const maxLeaves = await getFreeLeavesCount(employee);
//   const joinDate = getJoiningDate(employee);

//   // No joining date → normal credit
//   if (!joinDate) return maxLeaves;

//   const jDay = joinDate.getDate();
//   const jMonth = joinDate.getMonth() + 1;
//   const jYear = joinDate.getFullYear();

//   // Before joining month
//   if (year < jYear || (year === jYear && month < jMonth)) {
//     return 0;
//   }

//   // Exact joining month
//   if (year === jYear && month === jMonth) {
//     if (jDay > 25) return 0; // 26-31 join → 0 leave
//     return maxLeaves; // 1-25 join → full leave
//   }

//   // After joining month
//   return maxLeaves;
// };

// // ════════════════════════════════════════
// // SAFE ATOMIC AUTO-SYNC ENGINE
// // - Approved leaves actual date ke month me
// // - Joining 25th rule
// // - Opening/Closing chain repair
// // - No Mongoose VersionError
// // ════════════════════════════════════════
// const recalculateAndFixLeaveBalance = async (empIdOrBalance) => {
//   try {
//     let balance;
//     if (typeof empIdOrBalance === 'object' && empIdOrBalance._id) {
//       balance = empIdOrBalance;
//     } else {
//       balance = await LeaveBalance.findOne({ emp_id: empIdOrBalance });
//     }

//     if (!balance) return null;

//     const employee = await Employee.findById(balance.emp_id).populate('company_id', 'code');
//     if (!employee) return balance;

//     // 1) Approved leaves by month
//     const approvedLeaves = await Leave.find({
//       emp_id: balance.emp_id,
//       status: 'approved',
//     }).lean();

//     const leavesByMonth = {};

//     approvedLeaves.forEach((l) => {
//       if (!l.from_date || !l.to_date) return;
//       const pFrom = parseDateParts(l.from_date);
//       const pTo = parseDateParts(l.to_date);
//       if (!pFrom || !pTo) return;

//       if (l.is_half_day) {
//         const key = `${pFrom.month}/${pFrom.year}`;
//         leavesByMonth[key] = (leavesByMonth[key] || 0) + 0.5;
//       } else {
//         const start = new Date(pFrom.year, pFrom.month - 1, pFrom.day);
//         const end = new Date(pTo.year, pTo.month - 1, pTo.day);
//         for (let curr = new Date(start); curr <= end; curr.setDate(curr.getDate() + 1)) {
//           const key = `${curr.getMonth() + 1}/${curr.getFullYear()}`;
//           leavesByMonth[key] = (leavesByMonth[key] || 0) + 1.0;
//         }
//       }
//     });

//     // 2) Sort history oldest → newest
//     if (!Array.isArray(balance.history)) balance.history = [];
//     balance.history.sort((a, b) => {
//       if (Number(a.year) !== Number(b.year)) return Number(a.year) - Number(b.year);
//       return Number(a.month) - Number(b.month);
//     });

//     let runningBalance = 0;
//     let sumCredited = 0;
//     let sumUsed = 0;

//     // 3) Rebuild chain
//     for (let i = 0; i < balance.history.length; i++) {
//       const entry = balance.history[i];
//       const m = Number(entry.month);
//       const y = Number(entry.year);
//       const monthKey = `${m}/${y}`;

//       entry.opening_balance = runningBalance;

//       // Joining date + 25th rule
//       entry.credited = await getCreditedLeavesForMonth(employee, m, y);

//       const actualApprovedInMonth = leavesByMonth[monthKey] || 0;

//       if (entry.payroll_finalized) {
//         // Finalized month: payroll used vs actual approved me se max
//         entry.used = Math.max(Number(entry.used) || 0, actualApprovedInMonth);
//       } else {
//         entry.used = actualApprovedInMonth;
//       }

//       entry.closing_balance = Math.max(
//         0,
//         Number(entry.opening_balance || 0) +
//           Number(entry.credited || 0) -
//           Number(entry.used || 0)
//       );

//       runningBalance = entry.closing_balance;
//       sumCredited += Number(entry.credited || 0);
//       sumUsed += Number(entry.used || 0);
//     }

//     balance.current_balance = runningBalance;
//     balance.total_credited = sumCredited;
//     balance.total_used = sumUsed;

//     // Atomic update → VersionError nahi aayega
//     await LeaveBalance.updateOne(
//       { _id: balance._id },
//       {
//         $set: {
//           history: balance.history,
//           current_balance: balance.current_balance,
//           total_credited: balance.total_credited,
//           total_used: balance.total_used,
//         },
//       }
//     );

//     return balance;
//   } catch (err) {
//     console.error('recalculateAndFixLeaveBalance error:', err.message);
//     return null;
//   }
// };

// // ════════════════════════════════════════
// // GET / CREATE BALANCE
// // ════════════════════════════════════════
// const getOrCreateBalance = async (empId) => {
//   let balance = await LeaveBalance.findOne({ emp_id: empId });

//   if (!balance) {
//     const employee = await Employee.findById(empId);
//     if (!employee) throw new Error('Employee not found');

//     balance = await LeaveBalance.create({
//       emp_id: employee._id,
//       emp_code: employee.emp_code,
//       name: employee.name,
//       company_id: employee.company_id,
//       current_balance: 0,
//       total_credited: 0,
//       total_used: 0,
//       history: [],
//     });
//   }

//   return balance;
// };

// // ════════════════════════════════════════
// // BACKFILL MONTHS (joining cutoff ke sath)
// // ════════════════════════════════════════
// const backfillBalance = async (empId) => {
//   const employee = await Employee.findById(empId).populate('company_id', 'code');
//   if (!employee) return;

//   const SYSTEM_START_MONTH = 7;
//   const SYSTEM_START_YEAR = 2026;

//   const today = new Date();
//   const currentM = today.getMonth() + 1;
//   const currentY = today.getFullYear();

//   // Default start = system start
//   let startMonth = SYSTEM_START_MONTH;
//   let startYear = SYSTEM_START_YEAR;

//   // Joining date hai to joining month se start
//   const joinDate = getJoiningDate(employee);
//   if (joinDate) {
//     const jMonth = joinDate.getMonth() + 1;
//     const jYear = joinDate.getFullYear();

//     const joiningAfterSystem =
//       jYear > SYSTEM_START_YEAR ||
//       (jYear === SYSTEM_START_YEAR && jMonth > SYSTEM_START_MONTH);

//     if (joiningAfterSystem) {
//       startMonth = jMonth;
//       startYear = jYear;
//     }
//   }

//   const balance = await getOrCreateBalance(empId);
//   if (!Array.isArray(balance.history)) balance.history = [];

//   let m = startMonth;
//   let y = startYear;

//   while (y < currentY || (y === currentY && m <= currentM)) {
//     // Joining se pehle ka month mat banao
//     if (joinDate) {
//       const jMonth = joinDate.getMonth() + 1;
//       const jYear = joinDate.getFullYear();
//       if (y < jYear || (y === jYear && m < jMonth)) {
//         m++;
//         if (m > 12) {
//           m = 1;
//           y++;
//         }
//         continue;
//       }
//     }

//     const existingEntry = balance.history.find(
//       (h) => Number(h.month) === Number(m) && Number(h.year) === Number(y)
//     );

//     const credited = await getCreditedLeavesForMonth(employee, m, y);

//     if (!existingEntry) {
//       balance.history.push({
//         month: m,
//         year: y,
//         opening_balance: 0,
//         credited, // 0 if joined after 25 in that month
//         used: 0,
//         closing_balance: 0,
//         leaves_log: [],
//         credited_on: new Date(),
//       });
//       balance.last_credited_month = m;
//       balance.last_credited_year = y;
//     } else {
//       existingEntry.credited = credited;
//     }

//     m++;
//     if (m > 12) {
//       m = 1;
//       y++;
//     }
//   }

//   await recalculateAndFixLeaveBalance(balance);
// };

// // ════════════════════════════════════════
// // GET MY BALANCE (Employee)
// // ════════════════════════════════════════
// const getMyBalance = async (req, res) => {
//   try {
//     const now = new Date();
//     const currentMonth = now.getMonth() + 1;
//     const currentYear = now.getFullYear();

//     await backfillBalance(req.employee._id);
//     const balance = await LeaveBalance.findOne({ emp_id: req.employee._id }).lean();

//     if (!balance) {
//       return res.json({
//         success: true,
//         data: {
//           current_balance: 0,
//           total_credited: 0,
//           total_used: 0,
//           history: [],
//         },
//       });
//     }

//     const currentMonthData = (balance.history || []).find(
//       (h) =>
//         Number(h.month) === Number(currentMonth) &&
//         Number(h.year) === Number(currentYear)
//     );

//     res.json({
//       success: true,
//       data: {
//         current_balance: balance.current_balance,
//         total_credited: balance.total_credited,
//         total_used: balance.total_used,
//         current_month: {
//           month: currentMonth,
//           year: currentYear,
//           opening_balance: currentMonthData?.opening_balance || 0,
//           credited: currentMonthData?.credited || 0,
//           used: currentMonthData?.used || 0,
//           closing_balance: balance.current_balance,
//         },
//         history: (balance.history || []).slice(-12),
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ════════════════════════════════════════
// // GET EMPLOYEE BALANCE (Manager/Admin)
// // ════════════════════════════════════════
// const getEmployeeBalance = async (req, res) => {
//   try {
//     const { emp_id } = req.params;
//     await backfillBalance(emp_id);
//     const balance = await LeaveBalance.findOne({ emp_id }).lean();

//     if (!balance) {
//       return res.json({
//         success: true,
//         data: { current_balance: 0, total_used: 0 },
//       });
//     }

//     res.json({ success: true, data: balance });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ════════════════════════════════════════
// // DEDUCT FROM BALANCE (leave approve)
// // ════════════════════════════════════════
// const deductBalance = async (empId, leaveId, approvedDays) => {
//   await getOrCreateBalance(empId);
//   await backfillBalance(empId);
//   const updated = await recalculateAndFixLeaveBalance(empId);

//   return {
//     balance_before: updated ? updated.current_balance + approvedDays : 0,
//     balance_after: updated ? updated.current_balance : 0,
//     paid_days: approvedDays,
//     unpaid_days: 0,
//   };
// };

// // ════════════════════════════════════════
// // RESTORE BALANCE
// // ════════════════════════════════════════
// const restoreBalance = async (empId) => {
//   await recalculateAndFixLeaveBalance(empId);
// };

// // ════════════════════════════════════════
// // MANUAL CREDIT
// // ════════════════════════════════════════
// const manualCredit = async (req, res) => {
//   try {
//     const { emp_id, days } = req.body;
//     if (!emp_id || !days) {
//       return res
//         .status(400)
//         .json({ success: false, message: 'Employee and days required' });
//     }

//     const balance = await getOrCreateBalance(emp_id);
//     const now = new Date();
//     const currentMonth = now.getMonth() + 1;
//     const currentYear = now.getFullYear();

//     let monthEntry = balance.history.find(
//       (h) =>
//         Number(h.month) === Number(currentMonth) &&
//         Number(h.year) === Number(currentYear)
//     );

//     if (monthEntry) {
//       monthEntry.credited =
//         Number(monthEntry.credited || 0) + parseFloat(days);
//     }

//     await recalculateAndFixLeaveBalance(balance);

//     res.json({
//       success: true,
//       message: `${days} leaves credited`,
//       data: balance,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ════════════════════════════════════════
// // SUPER ADMIN - ADJUST LEAVE BALANCE
// // ════════════════════════════════════════
// const adjustLeaveBalance = async (req, res) => {
//   try {
//     const { emp_id, days, reason, adjustment_type } = req.body;

//     if (!emp_id || !days || isNaN(parseFloat(days)) || !reason) {
//       return res
//         .status(400)
//         .json({ success: false, message: 'All fields required' });
//     }

//     const daysValue = parseFloat(days);
//     const isAdd = adjustment_type === 'add';
//     const balance = await getOrCreateBalance(emp_id);

//     const now = new Date();
//     const currentMonth = now.getMonth() + 1;
//     const currentYear = now.getFullYear();

//     let monthEntry = balance.history.find(
//       (h) =>
//         Number(h.month) === Number(currentMonth) &&
//         Number(h.year) === Number(currentYear)
//     );

//     if (!monthEntry) {
//       balance.history.push({
//         month: currentMonth,
//         year: currentYear,
//         opening_balance: 0,
//         credited: 0,
//         used: 0,
//         closing_balance: 0,
//         leaves_log: [],
//       });
//       monthEntry = balance.history[balance.history.length - 1];
//     }

//     if (isAdd) {
//       monthEntry.credited =
//         Number(monthEntry.credited || 0) + Math.abs(daysValue);
//     } else {
//       monthEntry.used = Number(monthEntry.used || 0) + Math.abs(daysValue);
//     }

//     monthEntry.leaves_log = monthEntry.leaves_log || [];
//     monthEntry.leaves_log.push({
//       leave_id: null,
//       from_date: 'ADJUSTMENT',
//       to_date: 'ADJUSTMENT',
//       applied_days: 0,
//       approved_days: Math.abs(daysValue),
//       paid_days: isAdd ? Math.abs(daysValue) : 0,
//       unpaid_days: !isAdd ? Math.abs(daysValue) : 0,
//       approved_on: new Date(),
//       is_adjustment: true,
//       adjustment_type: isAdd ? 'add' : 'deduct',
//       adjustment_reason: reason.trim(),
//       adjusted_by: req.employee?.name || 'Super Admin',
//     });

//     await recalculateAndFixLeaveBalance(balance);

//     res.json({
//       success: true,
//       message: `Adjustment applied successfully`,
//       data: balance,
//     });
//   } catch (err) {
//     console.error('Adjust leave balance error:', err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ════════════════════════════════════════
// // SUPER ADMIN - GET ALL EMPLOYEES WITH BALANCE
// // ════════════════════════════════════════
// const getAllEmployeesWithBalance = async (req, res) => {
//   try {
//     const { company_id, search, month, year } = req.query;

//     const filter = {
//       status: 'approved',
//       role: { $in: ['employee', 'manager'] },
//     };

//     if (company_id && company_id !== 'all') {
//       filter.company_id = company_id;
//     }

//     if (search && search.trim() !== '') {
//       filter.$or = [
//         { name: { $regex: search.trim(), $options: 'i' } },
//         { emp_code: { $regex: search.trim(), $options: 'i' } },
//         { department: { $regex: search.trim(), $options: 'i' } },
//       ];
//     }

//     const employees = await Employee.find(filter)
//       .populate('company_id', 'name code')
//       .select(
//         'name emp_code email department designation company_id worker_type joining_date'
//       )
//       .sort({ name: 1 });

//     const selectedMonth = month
//       ? parseInt(month, 10)
//       : new Date().getMonth() + 1;
//     const selectedYear = year
//       ? parseInt(year, 10)
//       : new Date().getFullYear();

//     const employeesWithBalance = [];

//     for (const emp of employees) {
//       await backfillBalance(emp._id);
//       const bal = await LeaveBalance.findOne({ emp_id: emp._id }).lean();
//       const historyList = bal?.history || [];

//       const sortedHistory = [...historyList].sort((a, b) => {
//         if (a.year !== b.year) return b.year - a.year;
//         return b.month - a.month;
//       });

//       const monthEntry = sortedHistory.find(
//         (h) =>
//           Number(h.month) === selectedMonth &&
//           Number(h.year) === selectedYear
//       );

//       employeesWithBalance.push({
//         _id: emp._id,
//         name: emp.name,
//         emp_code: emp.emp_code,
//         email: emp.email,
//         department: emp.department,
//         designation: emp.designation,
//         worker_type: emp.worker_type || 'office',
//         joining_date: emp.joining_date || '',
//         company: emp.company_id,
//         current_balance: bal?.current_balance || 0,
//         total_credited: bal?.total_credited || 0,
//         total_used: bal?.total_used || 0,
//         selected_month_data: monthEntry
//           ? {
//               month: monthEntry.month,
//               year: monthEntry.year,
//               opening_balance: monthEntry.opening_balance || 0,
//               credited: monthEntry.credited || 0,
//               used: monthEntry.used || 0,
//               closing_balance: monthEntry.closing_balance || 0,
//             }
//           : null,
//         history: sortedHistory,
//       });
//     }

//     res.json({
//       success: true,
//       count: employeesWithBalance.length,
//       selected_month: selectedMonth,
//       selected_year: selectedYear,
//       data: employeesWithBalance,
//     });
//   } catch (err) {
//     console.error('Get all employees with balance error:', err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ════════════════════════════════════════
// // SUPER ADMIN - GET ADJUSTMENT HISTORY
// // ════════════════════════════════════════
// const getAdjustmentHistory = async (req, res) => {
//   try {
//     const { emp_id } = req.query;
//     const filter = {};
//     if (emp_id) filter.emp_id = emp_id;

//     const balances = await LeaveBalance.find(filter)
//       .populate('emp_id', 'name emp_code')
//       .populate('company_id', 'name code');

//     const adjustments = [];

//     balances.forEach((balance) => {
//       (balance.history || []).forEach((monthEntry) => {
//         (monthEntry.leaves_log || []).forEach((log) => {
//           if (log.is_adjustment) {
//             adjustments.push({
//               _id: log._id,
//               employee_name: balance.name,
//               emp_code: balance.emp_code,
//               company: balance.company_id,
//               month: monthEntry.month,
//               year: monthEntry.year,
//               adjustment_type: log.adjustment_type,
//               days: log.approved_days,
//               reason: log.adjustment_reason,
//               adjusted_by: log.adjusted_by,
//               adjusted_on: log.approved_on,
//             });
//           }
//         });
//       });
//     });

//     adjustments.sort(
//       (a, b) => new Date(b.adjusted_on) - new Date(a.adjusted_on)
//     );

//     res.json({
//       success: true,
//       count: adjustments.length,
//       data: adjustments,
//     });
//   } catch (err) {
//     console.error('Get adjustment history error:', err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// module.exports = {
//   getMyBalance,
//   getEmployeeBalance,
//   deductBalance,
//   restoreBalance,
//   manualCredit,
//   backfillBalance,
//   getOrCreateBalance,
//   adjustLeaveBalance,
//   getAllEmployeesWithBalance,
//   getAdjustmentHistory,
//   recalculateAndFixLeaveBalance,
//   getCreditedLeavesForMonth,
// };







// controllers/leaveBalanceController.js

const LeaveBalance = require('../models/LeaveBalance');
const Employee = require('../models/Employee');
const Company = require('../models/Company');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const { getAttendanceStatus, calculateLateLeaveDeduction } = require('../utils/attendanceStatus');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Universal Date Parser
const parseDateParts = (dateStr) => {
  if (!dateStr) return null;
  const str = String(dateStr).trim().split('T')[0];
  let d, m, y;

  if (str.includes('/')) {
    const p = str.split('/');
    d = parseInt(p[0], 10);
    m = parseInt(p[1], 10);
    y = parseInt(p[2], 10);
  } else if (str.includes('-')) {
    const p = str.split('-');
    if (p[0].length === 4) {
      y = parseInt(p[0], 10);
      m = parseInt(p[1], 10);
      d = parseInt(p[2], 10);
    } else {
      d = parseInt(p[0], 10);
      m = parseInt(p[1], 10);
      y = parseInt(p[2], 10);
    }
  }

  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  return { day: d, month: m, year: y, key: `${d}/${m}/${y}` };
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  let str = String(timeStr).trim().toUpperCase();
  let period = null;
  if (str.includes('PM')) { period = 'PM'; str = str.replace('PM', '').trim(); }
  else if (str.includes('AM')) { period = 'AM'; str = str.replace('AM', '').trim(); }
  const parts = str.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  let hours = parts[0];
  const minutes = parts[1];
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const getJoiningDate = (employee) => {
  const raw = employee?.joining_date || employee?.createdAt;
  if (!raw) return null;

  const p = parseDateParts(raw);
  if (p) return new Date(p.year, p.month - 1, p.day);

  const dt = new Date(raw);
  if (!isNaN(dt.getTime())) {
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }
  return null;
};

const getFreeLeavesCount = async (employee) => {
  if (!employee || !employee.company_id) return 1;

  let isRCC = false;
  if (typeof employee.company_id === 'object' && employee.company_id.code) {
    isRCC = employee.company_id.code.toUpperCase() === 'RCC';
  } else {
    try {
      const company = await Company.findById(employee.company_id).lean();
      if (company?.code?.toUpperCase() === 'RCC') isRCC = true;
    } catch (err) {}
  }

  if (employee.worker_type === 'site' && isRCC) return 2;
  return 1;
};

const getCreditedLeavesForMonth = async (employee, month, year) => {
  const maxLeaves = await getFreeLeavesCount(employee);
  const joinDate = getJoiningDate(employee);
  if (!joinDate) return maxLeaves;

  const jDay = joinDate.getDate();
  const jMonth = joinDate.getMonth() + 1;
  const jYear = joinDate.getFullYear();

  if (year < jYear || (year === jYear && month < jMonth)) return 0;
  if (year === jYear && month === jMonth) {
    if (jDay > 25) return 0;
    return maxLeaves;
  }
  return maxLeaves;
};

const getOrCreateBalance = async (empId) => {
  let balance = await LeaveBalance.findOne({ emp_id: empId });

  if (!balance) {
    const employee = await Employee.findById(empId);
    if (!employee) throw new Error('Employee not found');

    balance = await LeaveBalance.create({
      emp_id: employee._id,
      emp_code: employee.emp_code,
      name: employee.name,
      company_id: employee.company_id,
      current_balance: 0,
      total_credited: 0,
      total_used: 0,
      history: [],
    });
  }

  return balance;
};

// Safe backfill for new months
const backfillBalance = async (empId) => {
  const employee = await Employee.findById(empId).populate('company_id', 'code');
  if (!employee) return;

  const SYSTEM_START_MONTH = 7;
  const SYSTEM_START_YEAR = 2026;

  const today = new Date();
  const currentM = today.getMonth() + 1;
  const currentY = today.getFullYear();

  let startMonth = SYSTEM_START_MONTH;
  let startYear = SYSTEM_START_YEAR;

  const joinDate = getJoiningDate(employee);
  if (joinDate) {
    const jMonth = joinDate.getMonth() + 1;
    const jYear = joinDate.getFullYear();
    const joiningAfterSystem =
      jYear > SYSTEM_START_YEAR ||
      (jYear === SYSTEM_START_YEAR && jMonth > SYSTEM_START_MONTH);
    if (joiningAfterSystem) {
      startMonth = jMonth;
      startYear = jYear;
    }
  }

  const balance = await getOrCreateBalance(empId);
  if (!Array.isArray(balance.history)) balance.history = [];

  let changed = false;
  let m = startMonth;
  let y = startYear;

  while (y < currentY || (y === currentY && m <= currentM)) {
    if (joinDate) {
      const jMonth = joinDate.getMonth() + 1;
      const jYear = joinDate.getFullYear();
      if (y < jYear || (y === jYear && m < jMonth)) {
        m++;
        if (m > 12) { m = 1; y++; }
        continue;
      }
    }

    const exists = balance.history.find(
      (h) => Number(h.month) === Number(m) && Number(h.year) === Number(y)
    );

    if (!exists) {
      const credited = await getCreditedLeavesForMonth(employee, m, y);
      balance.history.push({
        month: m,
        year: y,
        opening_balance: balance.current_balance || 0,
        credited,
        used: 0,
        closing_balance: (balance.current_balance || 0) + credited,
        leaves_log: [],
        credited_on: new Date(),
      });
      balance.current_balance = (balance.current_balance || 0) + credited;
      balance.total_credited = (balance.total_credited || 0) + credited;
      balance.last_credited_month = m;
      balance.last_credited_year = y;
      changed = true;
    }

    m++;
    if (m > 12) { m = 1; y++; }
  }

  if (changed) {
    await balance.save();
  }

  return balance;
};

const recalculateAndFixLeaveBalance = async (empIdOrBalance) => {
  if (typeof empIdOrBalance === 'object' && empIdOrBalance?._id) return empIdOrBalance;
  return LeaveBalance.findOne({ emp_id: empIdOrBalance });
};

// ════════════════════════════════════════
// 👁️ READ-ONLY DISPLAY BUILDER (Itemizes Late + Leaves)
// ════════════════════════════════════════
const buildDisplayHistory = async (empId, rawHistory, workerType) => {
  if (!rawHistory || rawHistory.length === 0) return [];

  const approvedLeaves = await Leave.find({ emp_id: empId, status: 'approved' }).lean();
  const allAttendance = await Attendance.find({ emp_id: empId }).lean();

  const sorted = [...rawHistory].sort((a, b) => {
    if (Number(a.year) !== Number(b.year)) return Number(a.year) - Number(b.year);
    return Number(a.month) - Number(b.month);
  });

  let runningOpening = 0;
  const result = [];

  for (let i = 0; i < sorted.length; i++) {
    const h = sorted[i];
    const m = Number(h.month);
    const y = Number(h.year);

    const logs = [];

    // 1. Manual Add/Deduct check
    let manualAdd = 0;
    let manualDeduct = 0;
    (h.leaves_log || []).forEach((log) => {
      const isAdj =
        log.is_adjustment ||
        log.from_date === 'ADJUSTMENT' ||
        log.from_date === 'MANUAL_CREDIT' ||
        !!log.adjustment_reason;
      if (isAdj) {
        const days = Number(log.approved_days || 0);
        if (log.adjustment_type === 'deduct') manualDeduct += days;
        else manualAdd += days;
      }
    });

    const credited = Number(h.credited || 0);

    logs.push({
      log_type: 'system_credit',
      title: 'Monthly Free Leave Credit',
      days: credited,
      details: 'Automatic monthly credit',
    });

    (h.leaves_log || []).forEach((log) => {
      const isAdj =
        log.is_adjustment ||
        log.from_date === 'ADJUSTMENT' ||
        log.from_date === 'MANUAL_CREDIT' ||
        !!log.adjustment_reason;
      if (isAdj && log.adjustment_type !== 'deduct') {
        logs.push({
          log_type: 'manual_add',
          title: 'Manual Leave Credit (Admin)',
          days: Number(log.approved_days || 0),
          reason: log.adjustment_reason || 'Manual adjustment',
          by: log.adjusted_by || 'Admin',
          date: log.approved_on || null,
        });
      }
    });

    // 2. Approved Leaves for this month
    let approvedLeaveDays = 0;
    approvedLeaves.forEach((l) => {
      if (!l.from_date || !l.to_date) return;
      const pFrom = parseDateParts(l.from_date);
      if (!pFrom || Number(pFrom.month) !== m || Number(pFrom.year) !== y) return;

      let days = 0;
      if (l.is_half_day) {
        days = 0.5;
      } else {
        const pTo = parseDateParts(l.to_date);
        if (pTo) {
          const start = new Date(pFrom.year, pFrom.month - 1, pFrom.day);
          const end = new Date(pTo.year, pTo.month - 1, pTo.day);
          let cnt = 0;
          for (let curr = new Date(start); curr <= end; curr.setDate(curr.getDate() + 1)) cnt++;
          days = cnt;
        } else {
          days = 1;
        }
      }

      approvedLeaveDays += days;
      logs.push({
        log_type: 'approved_leave',
        title: `Approved Leave (${l.leave_type || 'Leave'})`,
        days,
        from_date: l.from_date,
        to_date: l.to_date,
        reason: l.reason || 'Approved leave',
        date: l.createdAt || null,
      });
    });

    // 3. Late Cuts for this month (from Attendance)
    let lateCutDays = 0;
    let lateCount = 0;
    if (workerType !== 'site') {
      allAttendance.forEach((att) => {
        if (!att.date || !att.in_time) return;
        const p = parseDateParts(att.date);
        if (!p || Number(p.month) !== m || Number(p.year) !== y) return;

        const inMin = parseTimeToMinutes(att.in_time);
        const status = getAttendanceStatus(att.in_time, att.out_time);
        const isHalfDay = (inMin !== null && inMin >= 720) || att.is_half_day || status.is_half_day;
        const isLate = !isHalfDay && ((inMin !== null && inMin > 585) || att.is_late || status.is_late);

        if (isLate) lateCount++;
      });

      lateCutDays = calculateLateLeaveDeduction(lateCount);
      if (lateCutDays > 0) {
        logs.push({
          log_type: 'late_cut',
          title: 'Late Arrival Penalty (Late Cut)',
          days: lateCutDays,
          details: `${lateCount} late check-in(s) in ${MONTHS[m - 1]} → -${lateCutDays} day(s) deducted`,
        });
      }
    }

    // 4. Manual Deductions
    (h.leaves_log || []).forEach((log) => {
      const isAdj = log.is_adjustment || log.from_date === 'ADJUSTMENT' || !!log.adjustment_reason;
      if (isAdj && log.adjustment_type === 'deduct') {
        logs.push({
          log_type: 'manual_deduct',
          title: 'Manual Leave Deduction (Admin)',
          days: Number(log.approved_days || 0),
          reason: log.adjustment_reason || 'Manual deduction',
          by: log.adjusted_by || 'Admin',
          date: log.approved_on || null,
        });
      }
    });

    const totalCalculatedUsed = approvedLeaveDays + lateCutDays + manualDeduct;
    const finalUsed = Math.max(Number(h.used || 0), totalCalculatedUsed);

    const opening = i === 0 ? Number(h.opening_balance || 0) : runningOpening;
    const closing = Math.max(0, opening + credited - finalUsed);
    runningOpening = closing;

    result.push({
      ...h,
      opening_balance: opening,
      credited,
      used: finalUsed,
      closing_balance: closing,
      itemized_logs: logs,
    });
  }

  return result.reverse();
};

// GET MY BALANCE
const getMyBalance = async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    await backfillBalance(req.employee._id);

    const balance = await LeaveBalance.findOne({ emp_id: req.employee._id }).lean();
    if (!balance) {
      return res.json({
        success: true,
        data: { current_balance: 0, total_credited: 0, total_used: 0, history: [] },
      });
    }

    const formattedHistory = await buildDisplayHistory(
      req.employee._id,
      balance.history,
      req.employee?.worker_type
    );

    res.json({
      success: true,
      data: {
        current_balance: formattedHistory[0]?.closing_balance ?? (balance.current_balance || 0),
        total_credited: balance.total_credited || 0,
        total_used: balance.total_used || 0,
        current_month: {
          month: currentMonth,
          year: currentYear,
          opening_balance: formattedHistory[0]?.opening_balance || 0,
          credited: formattedHistory[0]?.credited || 0,
          used: formattedHistory[0]?.used || 0,
          closing_balance: formattedHistory[0]?.closing_balance || 0,
        },
        history: formattedHistory,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getEmployeeBalance = async (req, res) => {
  try {
    const { emp_id } = req.params;
    const balance = await LeaveBalance.findOne({ emp_id }).lean();
    if (!balance) {
      return res.json({ success: true, data: { current_balance: 0, total_used: 0 } });
    }
    res.json({ success: true, data: balance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deductBalance = async (empId, leaveId, approvedDays, fromDate, toDate, appliedDays) => {
  const balance = await getOrCreateBalance(empId);

  const before = Number(balance.current_balance || 0);
  const paid = Math.min(before, Number(approvedDays || 0));
  const unpaid = Math.max(0, Number(approvedDays || 0) - paid);
  const after = Math.max(0, before - Number(approvedDays || 0));

  balance.current_balance = after;
  balance.total_used = Number(balance.total_used || 0) + Number(approvedDays || 0);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let monthEntry = (balance.history || []).find(
    (h) => Number(h.month) === currentMonth && Number(h.year) === currentYear
  );

  if (!monthEntry) {
    balance.history.push({
      month: currentMonth,
      year: currentYear,
      opening_balance: before,
      credited: 0,
      used: 0,
      closing_balance: before,
      leaves_log: [],
    });
    monthEntry = balance.history[balance.history.length - 1];
  }

  monthEntry.used = Number(monthEntry.used || 0) + Number(approvedDays || 0);
  monthEntry.closing_balance = after;
  monthEntry.leaves_log = monthEntry.leaves_log || [];
  monthEntry.leaves_log.push({
    leave_id: leaveId || null,
    from_date: fromDate || 'LEAVE',
    to_date: toDate || fromDate || 'LEAVE',
    applied_days: appliedDays || approvedDays || 0,
    approved_days: approvedDays || 0,
    paid_days: paid,
    unpaid_days: unpaid,
    approved_on: new Date(),
    deduction_type: 'approved_leave',
  });

  await balance.save();

  return {
    balance_before: before,
    balance_after: after,
    paid_days: paid,
    unpaid_days: unpaid,
  };
};

const restoreBalance = async (empId, leaveId, approvedDays) => {
  const balance = await LeaveBalance.findOne({ emp_id: empId });
  if (!balance) return;

  balance.current_balance = Number(balance.current_balance || 0) + Number(approvedDays || 0);
  balance.total_used = Math.max(0, Number(balance.total_used || 0) - Number(approvedDays || 0));

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthEntry = (balance.history || []).find(
    (h) => Number(h.month) === currentMonth && Number(h.year) === currentYear
  );

  if (monthEntry) {
    monthEntry.used = Math.max(0, Number(monthEntry.used || 0) - Number(approvedDays || 0));
    monthEntry.closing_balance = balance.current_balance;
    if (leaveId) {
      monthEntry.leaves_log = (monthEntry.leaves_log || []).filter(
        (l) => !l.leave_id || String(l.leave_id) !== String(leaveId)
      );
    }
  }

  await balance.save();
};

const manualCredit = async (req, res) => {
  try {
    const { emp_id, days } = req.body;
    if (!emp_id || !days) {
      return res.status(400).json({ success: false, message: 'Employee and days required' });
    }

    const balance = await getOrCreateBalance(emp_id);
    const val = Math.abs(parseFloat(days));
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let monthEntry = balance.history.find(
      (h) => Number(h.month) === currentMonth && Number(h.year) === currentYear
    );
    if (!monthEntry) {
      balance.history.push({
        month: currentMonth,
        year: currentYear,
        opening_balance: balance.current_balance || 0,
        credited: 0,
        used: 0,
        closing_balance: balance.current_balance || 0,
        leaves_log: [],
      });
      monthEntry = balance.history[balance.history.length - 1];
    }

    monthEntry.credited = Number(monthEntry.credited || 0) + val;
    monthEntry.closing_balance = Number(monthEntry.closing_balance || 0) + val;
    monthEntry.leaves_log = monthEntry.leaves_log || [];
    monthEntry.leaves_log.push({
      from_date: 'MANUAL_CREDIT',
      to_date: 'MANUAL_CREDIT',
      approved_days: val,
      paid_days: val,
      unpaid_days: 0,
      approved_on: new Date(),
      is_adjustment: true,
      adjustment_type: 'add',
      adjustment_reason: 'Manual credit by admin',
      adjusted_by: req.employee?.name || 'Admin',
    });

    balance.current_balance = Number(balance.current_balance || 0) + val;
    balance.total_credited = Number(balance.total_credited || 0) + val;
    await balance.save();

    res.json({ success: true, message: `${days} leaves credited`, data: balance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adjustLeaveBalance = async (req, res) => {
  try {
    const { emp_id, days, reason, adjustment_type } = req.body;

    if (!emp_id || !days || isNaN(parseFloat(days)) || !reason) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const employee = await Employee.findById(emp_id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const daysValue = Math.abs(parseFloat(days));
    const isAdd = adjustment_type === 'add';
    const balance = await getOrCreateBalance(emp_id);

    const before = Number(balance.current_balance || 0);
    const after = isAdd ? before + daysValue : Math.max(0, before - daysValue);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let monthEntry = (balance.history || []).find(
      (h) => Number(h.month) === currentMonth && Number(h.year) === currentYear
    );

    if (!monthEntry) {
      balance.history.push({
        month: currentMonth,
        year: currentYear,
        opening_balance: before,
        credited: 0,
        used: 0,
        closing_balance: before,
        leaves_log: [],
      });
      monthEntry = balance.history[balance.history.length - 1];
    }

    if (isAdd) {
      monthEntry.credited = Number(monthEntry.credited || 0) + daysValue;
      balance.total_credited = Number(balance.total_credited || 0) + daysValue;
    } else {
      monthEntry.used = Number(monthEntry.used || 0) + daysValue;
      balance.total_used = Number(balance.total_used || 0) + daysValue;
    }

    monthEntry.closing_balance = after;
    monthEntry.leaves_log = monthEntry.leaves_log || [];
    monthEntry.leaves_log.push({
      leave_id: null,
      from_date: 'ADJUSTMENT',
      to_date: 'ADJUSTMENT',
      applied_days: 0,
      approved_days: daysValue,
      paid_days: isAdd ? daysValue : 0,
      unpaid_days: !isAdd ? daysValue : 0,
      approved_on: new Date(),
      is_adjustment: true,
      adjustment_type: isAdd ? 'add' : 'deduct',
      adjustment_reason: reason.trim(),
      adjusted_by: req.employee?.name || 'Super Admin',
    });

    balance.current_balance = after;
    await balance.save();

    res.json({
      success: true,
      message: `${isAdd ? 'Added' : 'Deducted'} ${daysValue} leave(s) for ${employee.name}. Balance: ${before} → ${after}`,
      data: {
        employee: { name: employee.name, emp_code: employee.emp_code },
        balance_before: before,
        balance_after: after,
        adjustment: isAdd ? daysValue : -daysValue,
        reason: reason.trim(),
      },
    });
  } catch (err) {
    console.error('Adjust leave balance error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllEmployeesWithBalance = async (req, res) => {
  try {
    const { company_id, search, month, year } = req.query;

    const filter = {
      status: 'approved',
      role: { $in: ['employee', 'manager'] },
    };

    if (company_id && company_id !== 'all') filter.company_id = company_id;

    if (search && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { emp_code: { $regex: search.trim(), $options: 'i' } },
        { department: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const employees = await Employee.find(filter)
      .populate('company_id', 'name code')
      .select('name emp_code email department designation company_id worker_type joining_date')
      .sort({ name: 1 })
      .lean();

    const selectedMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const selectedYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const empIds = employees.map((e) => e._id);
    const balances = await LeaveBalance.find({ emp_id: { $in: empIds } }).lean();
    const balanceMap = {};
    balances.forEach((b) => {
      balanceMap[String(b.emp_id)] = b;
    });

    const employeesWithBalance = [];

    for (const emp of employees) {
      const bal = balanceMap[String(emp._id)];
      const historyList = bal?.history || [];

      // Build rich itemized history dynamically
      const formattedHistory = await buildDisplayHistory(emp._id, historyList, emp.worker_type);

      const monthEntry = formattedHistory.find(
        (h) => Number(h.month) === selectedMonth && Number(h.year) === selectedYear
      );

      const adjustments = [];
      formattedHistory.forEach((h) => {
        (h.leaves_log || []).forEach((log) => {
          if (
            log.is_adjustment ||
            log.from_date === 'ADJUSTMENT' ||
            log.from_date === 'MANUAL_CREDIT' ||
            log.adjustment_reason
          ) {
            adjustments.push({
              month: h.month,
              year: h.year,
              type: log.adjustment_type || 'add',
              days: log.approved_days || 0,
              reason: log.adjustment_reason || 'Manual Adjustment',
              by: log.adjusted_by || 'Admin',
              on: log.approved_on,
            });
          }
        });
      });

      employeesWithBalance.push({
        _id: emp._id,
        name: emp.name,
        emp_code: emp.emp_code,
        email: emp.email,
        department: emp.department,
        designation: emp.designation,
        worker_type: emp.worker_type || 'office',
        joining_date: emp.joining_date || '',
        company: emp.company_id,
        current_balance: formattedHistory[0]?.closing_balance ?? (bal?.current_balance || 0),
        total_credited: bal?.total_credited || 0,
        total_used: bal?.total_used || 0,
        selected_month_data: monthEntry
          ? {
              month: monthEntry.month,
              year: monthEntry.year,
              opening_balance: monthEntry.opening_balance || 0,
              credited: monthEntry.credited || 0,
              used: monthEntry.used || 0,
              closing_balance: monthEntry.closing_balance || 0,
            }
          : null,
        history: formattedHistory,
        adjustments,
      });
    }

    res.json({
      success: true,
      count: employeesWithBalance.length,
      selected_month: selectedMonth,
      selected_year: selectedYear,
      data: employeesWithBalance,
    });
  } catch (err) {
    console.error('Get all employees with balance error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAdjustmentHistory = async (req, res) => {
  try {
    const { emp_id, company_id, search } = req.query;
    const filter = {};
    if (emp_id) filter.emp_id = emp_id;
    if (company_id && company_id !== 'all') filter.company_id = company_id;

    const balances = await LeaveBalance.find(filter)
      .populate('emp_id', 'name emp_code department')
      .populate('company_id', 'name code')
      .lean();

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let adjustments = [];

    balances.forEach((balance) => {
      (balance.history || []).forEach((monthEntry) => {
        (monthEntry.leaves_log || []).forEach((log) => {
          const isAdj =
            log.is_adjustment ||
            log.from_date === 'ADJUSTMENT' ||
            log.from_date === 'MANUAL_CREDIT' ||
            !!log.adjustment_reason;

          if (!isAdj) return;

          adjustments.push({
            _id:
              log._id ||
              `${balance._id}-${monthEntry.month}-${monthEntry.year}-${log.approved_on || Math.random()}`,
            emp_id: balance.emp_id?._id || balance.emp_id,
            employee_name: balance.name || balance.emp_id?.name || '—',
            emp_code: balance.emp_code || balance.emp_id?.emp_code || '—',
            department: balance.emp_id?.department || '',
            company: balance.company_id,
            company_name: balance.company_id?.name || '',
            company_code: balance.company_id?.code || '',
            month: monthEntry.month,
            year: monthEntry.year,
            month_label: `${MONTHS[(monthEntry.month || 1) - 1]} ${monthEntry.year}`,
            adjustment_type: log.adjustment_type || 'add',
            days: log.approved_days || 0,
            reason: log.adjustment_reason || 'Manual Adjustment',
            adjusted_by: log.adjusted_by || 'Admin',
            adjusted_on: log.approved_on || null,
          });
        });
      });
    });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      adjustments = adjustments.filter(
        (a) =>
          (a.employee_name || '').toLowerCase().includes(q) ||
          (a.emp_code || '').toLowerCase().includes(q) ||
          (a.reason || '').toLowerCase().includes(q) ||
          (a.company_name || '').toLowerCase().includes(q) ||
          (a.company_code || '').toLowerCase().includes(q)
      );
    }

    adjustments.sort((a, b) => new Date(b.adjusted_on || 0) - new Date(a.adjusted_on || 0));

    res.json({ success: true, count: adjustments.length, data: adjustments });
  } catch (err) {
    console.error('Get adjustment history error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMyBalance,
  getEmployeeBalance,
  deductBalance,
  restoreBalance,
  manualCredit,
  backfillBalance,
  getOrCreateBalance,
  adjustLeaveBalance,
  getAllEmployeesWithBalance,
  getAdjustmentHistory,
  recalculateAndFixLeaveBalance,
  getCreditedLeavesForMonth,
};