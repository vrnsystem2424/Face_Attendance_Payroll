





// // controllers/leaveBalanceController.js

// const LeaveBalance = require('../models/LeaveBalance');
// const Employee = require('../models/Employee');
// const Company = require('../models/Company');
// const Leave = require('../models/Leave');
// const Attendance = require('../models/Attendance');
// const { getAttendanceStatus, calculateLateLeaveDeduction } = require('../utils/attendanceStatus');

// const MONTHS = [
//   'January', 'February', 'March', 'April', 'May', 'June',
//   'July', 'August', 'September', 'October', 'November', 'December',
// ];

// // Universal Date Parser
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

// const parseTimeToMinutes = (timeStr) => {
//   if (!timeStr) return null;
//   let str = String(timeStr).trim().toUpperCase();
//   let period = null;
//   if (str.includes('PM')) { period = 'PM'; str = str.replace('PM', '').trim(); }
//   else if (str.includes('AM')) { period = 'AM'; str = str.replace('AM', '').trim(); }
//   const parts = str.split(':').map(Number);
//   if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
//   let hours = parts[0];
//   const minutes = parts[1];
//   if (period === 'PM' && hours !== 12) hours += 12;
//   if (period === 'AM' && hours === 12) hours = 0;
//   return hours * 60 + minutes;
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

// const getCreditedLeavesForMonth = async (employee, month, year) => {
//   const maxLeaves = await getFreeLeavesCount(employee);
//   const joinDate = getJoiningDate(employee);
//   if (!joinDate) return maxLeaves;

//   const jDay = joinDate.getDate();
//   const jMonth = joinDate.getMonth() + 1;
//   const jYear = joinDate.getFullYear();

//   if (year < jYear || (year === jYear && month < jMonth)) return 0;
//   if (year === jYear && month === jMonth) {
//     if (jDay > 25) return 0;
//     return maxLeaves;
//   }
//   return maxLeaves;
// };

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

// // Re-chains all opening & closing balances properly across months
// const rechainBalances = (balance) => {
//   if (!balance.history) return;

//   balance.history.sort((a, b) => {
//     if (Number(a.year) !== Number(b.year)) return Number(a.year) - Number(b.year);
//     return Number(a.month) - Number(b.month);
//   });

//   let running = 0;
//   let totCredited = 0;
//   let totUsed = 0;

//   balance.history.forEach((h) => {
//     h.opening_balance = running;
//     const credited = Number(h.credited || 0);
//     const used = Number(h.used || 0);
//     h.closing_balance = Math.max(0, running + credited - used);
//     running = h.closing_balance;

//     totCredited += credited;
//     totUsed += used;
//   });

//   balance.current_balance = running;
//   balance.total_credited = totCredited;
//   balance.total_used = totUsed;
// };

// // Safe backfill for new months
// const backfillBalance = async (empId) => {
//   const employee = await Employee.findById(empId).populate('company_id', 'code');
//   if (!employee) return;

//   const SYSTEM_START_MONTH = 7;
//   const SYSTEM_START_YEAR = 2026;

//   const today = new Date();
//   const currentM = today.getMonth() + 1;
//   const currentY = today.getFullYear();

//   let startMonth = SYSTEM_START_MONTH;
//   let startYear = SYSTEM_START_YEAR;

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

//   let changed = false;
//   let m = startMonth;
//   let y = startYear;

//   while (y < currentY || (y === currentY && m <= currentM)) {
//     if (joinDate) {
//       const jMonth = joinDate.getMonth() + 1;
//       const jYear = joinDate.getFullYear();
//       if (y < jYear || (y === jYear && m < jMonth)) {
//         m++;
//         if (m > 12) { m = 1; y++; }
//         continue;
//       }
//     }

//     const exists = balance.history.find(
//       (h) => Number(h.month) === Number(m) && Number(h.year) === Number(y)
//     );

//     if (!exists) {
//       const credited = await getCreditedLeavesForMonth(employee, m, y);
//       balance.history.push({
//         month: m,
//         year: y,
//         opening_balance: 0,
//         credited,
//         used: 0,
//         closing_balance: 0,
//         leaves_log: [],
//         credited_on: new Date(),
//       });
//       changed = true;
//     }

//     m++;
//     if (m > 12) { m = 1; y++; }
//   }

//   if (changed) {
//     rechainBalances(balance);
//     await balance.save();
//   }

//   return balance;
// };

// const recalculateAndFixLeaveBalance = async (empIdOrBalance) => {
//   if (typeof empIdOrBalance === 'object' && empIdOrBalance?._id) return empIdOrBalance;
//   return LeaveBalance.findOne({ emp_id: empIdOrBalance });
// };

// // READ-ONLY DISPLAY BUILDER
// const buildDisplayHistory = async (empId, rawHistory, workerType) => {
//   if (!rawHistory || rawHistory.length === 0) return [];

//   const approvedLeaves = await Leave.find({ emp_id: empId, status: 'approved' }).lean();
//   const allAttendance = await Attendance.find({ emp_id: empId }).lean();

//   const sorted = [...rawHistory].sort((a, b) => {
//     if (Number(a.year) !== Number(b.year)) return Number(a.year) - Number(b.year);
//     return Number(a.month) - Number(b.month);
//   });

//   let runningOpening = 0;
//   const result = [];

//   for (let i = 0; i < sorted.length; i++) {
//     const h = sorted[i];
//     const m = Number(h.month);
//     const y = Number(h.year);

//     const logs = [];

//     let manualAdd = 0;
//     let manualDeduct = 0;
//     (h.leaves_log || []).forEach((log) => {
//       const isAdj =
//         log.is_adjustment ||
//         log.from_date === 'ADJUSTMENT' ||
//         log.from_date === 'MANUAL_CREDIT' ||
//         !!log.adjustment_reason;
//       if (isAdj) {
//         const days = Number(log.approved_days || 0);
//         if (log.adjustment_type === 'deduct') manualDeduct += days;
//         else manualAdd += days;
//       }
//     });

//     const credited = Number(h.credited || 0);

//     logs.push({
//       log_type: 'system_credit',
//       title: 'Monthly Free Leave Credit',
//       days: credited,
//       details: 'Automatic monthly credit',
//     });

//     (h.leaves_log || []).forEach((log) => {
//       const isAdj =
//         log.is_adjustment ||
//         log.from_date === 'ADJUSTMENT' ||
//         log.from_date === 'MANUAL_CREDIT' ||
//         !!log.adjustment_reason;
//       if (isAdj && log.adjustment_type !== 'deduct') {
//         logs.push({
//           log_type: 'manual_add',
//           title: 'Manual Leave Credit (Admin)',
//           days: Number(log.approved_days || 0),
//           reason: log.adjustment_reason || 'Manual adjustment',
//           by: log.adjusted_by || 'Admin',
//           date: log.approved_on || null,
//         });
//       }
//     });

//     let approvedLeaveDays = 0;
//     approvedLeaves.forEach((l) => {
//       if (!l.from_date || !l.to_date) return;
//       const pFrom = parseDateParts(l.from_date);
//       if (!pFrom || Number(pFrom.month) !== m || Number(pFrom.year) !== y) return;

//       let days = 0;
//       if (l.is_half_day) {
//         days = 0.5;
//       } else {
//         const pTo = parseDateParts(l.to_date);
//         if (pTo) {
//           const start = new Date(pFrom.year, pFrom.month - 1, pFrom.day);
//           const end = new Date(pTo.year, pTo.month - 1, pTo.day);
//           let cnt = 0;
//           for (let curr = new Date(start); curr <= end; curr.setDate(curr.getDate() + 1)) cnt++;
//           days = cnt;
//         } else {
//           days = 1;
//         }
//       }

//       approvedLeaveDays += days;
//       logs.push({
//         log_type: 'approved_leave',
//         title: `Approved Leave (${l.leave_type || 'Leave'})`,
//         days,
//         from_date: l.from_date,
//         to_date: l.to_date,
//         reason: l.reason || 'Approved leave',
//         date: l.createdAt || null,
//       });
//     });

//     let lateCutDays = 0;
//     let lateCount = 0;
//     if (workerType !== 'site') {
//       allAttendance.forEach((att) => {
//         if (!att.date || !att.in_time) return;
//         const p = parseDateParts(att.date);
//         if (!p || Number(p.month) !== m || Number(p.year) !== y) return;

//         const inMin = parseTimeToMinutes(att.in_time);
//         const status = getAttendanceStatus(att.in_time, att.out_time);
//         const isHalfDay = (inMin !== null && inMin >= 720) || att.is_half_day || status.is_half_day;
//         const isLate = !isHalfDay && ((inMin !== null && inMin > 585) || att.is_late || status.is_late);

//         if (isLate) lateCount++;
//       });

//       lateCutDays = calculateLateLeaveDeduction(lateCount);
//       if (lateCutDays > 0) {
//         logs.push({
//           log_type: 'late_cut',
//           title: 'Late Arrival Penalty (Late Cut)',
//           days: lateCutDays,
//           details: `${lateCount} late check-in(s) in ${MONTHS[m - 1]} → -${lateCutDays} day(s) deducted`,
//         });
//       }
//     }

//     (h.leaves_log || []).forEach((log) => {
//       const isAdj = log.is_adjustment || log.from_date === 'ADJUSTMENT' || !!log.adjustment_reason;
//       if (isAdj && log.adjustment_type === 'deduct') {
//         logs.push({
//           log_type: 'manual_deduct',
//           title: 'Manual Leave Deduction (Admin)',
//           days: Number(log.approved_days || 0),
//           reason: log.adjustment_reason || 'Manual deduction',
//           by: log.adjusted_by || 'Admin',
//           date: log.approved_on || null,
//         });
//       }
//     });

//     const totalCalculatedUsed = approvedLeaveDays + lateCutDays + manualDeduct;
//     const finalUsed = Math.max(Number(h.used || 0), totalCalculatedUsed);

//     const opening = i === 0 ? Number(h.opening_balance || 0) : runningOpening;
//     const closing = Math.max(0, opening + credited - finalUsed);
//     runningOpening = closing;

//     result.push({
//       ...h,
//       opening_balance: opening,
//       credited,
//       used: finalUsed,
//       closing_balance: closing,
//       itemized_logs: logs,
//     });
//   }

//   return result.reverse();
// };

// const getMyBalance = async (req, res) => {
//   try {
//     const empId = req.employee?._id || req.user?._id;
//     const now = new Date();
//     const currentMonth = now.getMonth() + 1;
//     const currentYear = now.getFullYear();

//     await backfillBalance(empId);

//     const balance = await LeaveBalance.findOne({ emp_id: empId }).lean();
//     if (!balance) {
//       return res.json({
//         success: true,
//         data: { current_balance: 0, total_credited: 0, total_used: 0, history: [] },
//       });
//     }

//     const formattedHistory = await buildDisplayHistory(
//       empId,
//       balance.history,
//       req.employee?.worker_type || req.user?.worker_type
//     );

//     res.json({
//       success: true,
//       data: {
//         current_balance: formattedHistory[0]?.closing_balance ?? (balance.current_balance || 0),
//         total_credited: balance.total_credited || 0,
//         total_used: balance.total_used || 0,
//         current_month: {
//           month: currentMonth,
//           year: currentYear,
//           opening_balance: formattedHistory[0]?.opening_balance || 0,
//           credited: formattedHistory[0]?.credited || 0,
//           used: formattedHistory[0]?.used || 0,
//           closing_balance: formattedHistory[0]?.closing_balance || 0,
//         },
//         history: formattedHistory,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// const getEmployeeBalance = async (req, res) => {
//   try {
//     const emp_id = req.params.emp_id || req.params.empId;
//     const balance = await LeaveBalance.findOne({ emp_id }).lean();
//     if (!balance) {
//       return res.json({ success: true, data: { current_balance: 0, total_used: 0 } });
//     }
//     res.json({ success: true, data: balance });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// const deductBalance = async (empId, leaveId, approvedDays, fromDate, toDate, appliedDays) => {
//   const balance = await getOrCreateBalance(empId);

//   const before = Number(balance.current_balance || 0);
//   const paid = Math.min(before, Number(approvedDays || 0));
//   const unpaid = Math.max(0, Number(approvedDays || 0) - paid);

//   const now = new Date();
//   const currentMonth = now.getMonth() + 1;
//   const currentYear = now.getFullYear();

//   let monthEntry = (balance.history || []).find(
//     (h) => Number(h.month) === currentMonth && Number(h.year) === currentYear
//   );

//   if (!monthEntry) {
//     balance.history.push({
//       month: currentMonth,
//       year: currentYear,
//       opening_balance: 0,
//       credited: 0,
//       used: 0,
//       closing_balance: 0,
//       leaves_log: [],
//     });
//     monthEntry = balance.history[balance.history.length - 1];
//   }

//   monthEntry.used = Number(monthEntry.used || 0) + Number(approvedDays || 0);
//   monthEntry.leaves_log = monthEntry.leaves_log || [];
//   monthEntry.leaves_log.push({
//     leave_id: leaveId || null,
//     from_date: fromDate || 'LEAVE',
//     to_date: toDate || fromDate || 'LEAVE',
//     applied_days: appliedDays || approvedDays || 0,
//     approved_days: approvedDays || 0,
//     paid_days: paid,
//     unpaid_days: unpaid,
//     approved_on: new Date(),
//     deduction_type: 'approved_leave',
//   });

//   rechainBalances(balance);
//   await balance.save();

//   return {
//     balance_before: before,
//     balance_after: balance.current_balance,
//     paid_days: paid,
//     unpaid_days: unpaid,
//   };
// };

// const restoreBalance = async (empId, leaveId, approvedDays) => {
//   const balance = await LeaveBalance.findOne({ emp_id: empId });
//   if (!balance) return;

//   const now = new Date();
//   const currentMonth = now.getMonth() + 1;
//   const currentYear = now.getFullYear();
  
//   const monthEntry = (balance.history || []).find(
//     (h) => Number(h.month) === currentMonth && Number(h.year) === currentYear
//   );

//   if (monthEntry) {
//     monthEntry.used = Math.max(0, Number(monthEntry.used || 0) - Number(approvedDays || 0));
//     if (leaveId) {
//       monthEntry.leaves_log = (monthEntry.leaves_log || []).filter(
//         (l) => !l.leave_id || String(l.leave_id) !== String(leaveId)
//       );
//     }
//   }

//   rechainBalances(balance);
//   await balance.save();
// };

// const manualCredit = async (req, res) => {
//   try {
//     const { emp_id, days, month, year } = req.body;
//     if (!emp_id || !days) {
//       return res.status(400).json({ success: false, message: 'Employee and days required' });
//     }

//     const balance = await getOrCreateBalance(emp_id);
//     const val = Math.abs(parseFloat(days));
    
//     const now = new Date();
//     const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
//     const targetYear = year ? parseInt(year, 10) : now.getFullYear();

//     let monthEntry = balance.history.find(
//       (h) => Number(h.month) === targetMonth && Number(h.year) === targetYear
//     );
//     if (!monthEntry) {
//       balance.history.push({
//         month: targetMonth,
//         year: targetYear,
//         opening_balance: 0,
//         credited: 0,
//         used: 0,
//         closing_balance: 0,
//         leaves_log: [],
//       });
//       monthEntry = balance.history[balance.history.length - 1];
//     }

//     monthEntry.credited = Number(monthEntry.credited || 0) + val;
//     monthEntry.leaves_log = monthEntry.leaves_log || [];
//     monthEntry.leaves_log.push({
//       from_date: 'MANUAL_CREDIT',
//       to_date: 'MANUAL_CREDIT',
//       approved_days: val,
//       paid_days: val,
//       unpaid_days: 0,
//       approved_on: new Date(),
//       is_adjustment: true,
//       adjustment_type: 'add',
//       adjustment_reason: 'Manual credit by admin',
//       adjusted_by: req.employee?.name || req.user?.name || 'Admin',
//     });

//     rechainBalances(balance);
//     await balance.save();

//     res.json({ success: true, message: `${days} leaves credited`, data: balance });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// const adjustLeaveBalance = async (req, res) => {
//   try {
//     const { emp_id, days, reason, adjustment_type, month, year } = req.body;

//     if (!emp_id || !days || isNaN(parseFloat(days)) || !reason) {
//       return res.status(400).json({ success: false, message: 'All fields required' });
//     }

//     const employee = await Employee.findById(emp_id);
//     if (!employee) {
//       return res.status(404).json({ success: false, message: 'Employee not found' });
//     }

//     const daysValue = Math.abs(parseFloat(days));
//     const isAdd = adjustment_type === 'add';
//     const balance = await getOrCreateBalance(emp_id);

//     const before = Number(balance.current_balance || 0);

//     const now = new Date();
//     const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
//     const targetYear = year ? parseInt(year, 10) : now.getFullYear();

//     let monthEntry = (balance.history || []).find(
//       (h) => Number(h.month) === targetMonth && Number(h.year) === targetYear
//     );

//     if (!monthEntry) {
//       balance.history.push({
//         month: targetMonth,
//         year: targetYear,
//         opening_balance: 0,
//         credited: 0,
//         used: 0,
//         closing_balance: 0,
//         leaves_log: [],
//       });
//       monthEntry = balance.history[balance.history.length - 1];
//     }

//     if (isAdd) {
//       monthEntry.credited = Number(monthEntry.credited || 0) + daysValue;
//     } else {
//       monthEntry.used = Number(monthEntry.used || 0) + daysValue;
//     }

//     monthEntry.leaves_log = monthEntry.leaves_log || [];
//     monthEntry.leaves_log.push({
//       leave_id: null,
//       from_date: 'ADJUSTMENT',
//       to_date: 'ADJUSTMENT',
//       applied_days: 0,
//       approved_days: daysValue,
//       paid_days: isAdd ? daysValue : 0,
//       unpaid_days: !isAdd ? daysValue : 0,
//       approved_on: new Date(),
//       is_adjustment: true,
//       adjustment_type: isAdd ? 'add' : 'deduct',
//       adjustment_reason: reason.trim(),
//       adjusted_by: req.employee?.name || req.user?.name || 'Super Admin',
//     });

//     rechainBalances(balance);
//     await balance.save();

//     res.json({
//       success: true,
//       message: `${isAdd ? 'Added' : 'Deducted'} ${daysValue} leave(s) for ${employee.name}.`,
//       data: {
//         employee: { name: employee.name, emp_code: employee.emp_code },
//         balance_before: before,
//         balance_after: balance.current_balance,
//         adjustment: isAdd ? daysValue : -daysValue,
//         reason: reason.trim(),
//       },
//     });
//   } catch (err) {
//     console.error('Adjust leave balance error:', err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// const getAllEmployeesWithBalance = async (req, res) => {
//   try {
//     const { company_id, search, month, year } = req.query;

//     const filter = {
//       status: 'approved',
//       role: { $in: ['employee', 'manager'] },
//     };

//     if (company_id && company_id !== 'all') filter.company_id = company_id;

//     if (search && search.trim() !== '') {
//       filter.$or = [
//         { name: { $regex: search.trim(), $options: 'i' } },
//         { emp_code: { $regex: search.trim(), $options: 'i' } },
//         { department: { $regex: search.trim(), $options: 'i' } },
//       ];
//     }

//     const employees = await Employee.find(filter)
//       .populate('company_id', 'name code')
//       .select('name emp_code email department designation company_id worker_type joining_date')
//       .sort({ name: 1 })
//       .lean();

//     const selectedMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;
//     const selectedYear = year ? parseInt(year, 10) : new Date().getFullYear();

//     const empIds = employees.map((e) => e._id);
//     const balances = await LeaveBalance.find({ emp_id: { $in: empIds } }).lean();
//     const balanceMap = {};
//     balances.forEach((b) => {
//       balanceMap[String(b.emp_id)] = b;
//     });

//     const employeesWithBalance = [];

//     for (const emp of employees) {
//       const bal = balanceMap[String(emp._id)];
//       const historyList = bal?.history || [];

//       const formattedHistory = await buildDisplayHistory(emp._id, historyList, emp.worker_type);

//       const monthEntry = formattedHistory.find(
//         (h) => Number(h.month) === selectedMonth && Number(h.year) === selectedYear
//       );

//       const adjustments = [];
//       formattedHistory.forEach((h) => {
//         (h.leaves_log || []).forEach((log) => {
//           if (
//             log.is_adjustment ||
//             log.from_date === 'ADJUSTMENT' ||
//             log.from_date === 'MANUAL_CREDIT' ||
//             log.adjustment_reason
//           ) {
//             adjustments.push({
//               month: h.month,
//               year: h.year,
//               type: log.adjustment_type || 'add',
//               days: log.approved_days || 0,
//               reason: log.adjustment_reason || 'Manual Adjustment',
//               by: log.adjusted_by || 'Admin',
//               on: log.approved_on,
//             });
//           }
//         });
//       });

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
//         current_balance: formattedHistory[0]?.closing_balance ?? (bal?.current_balance || 0),
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
//         history: formattedHistory,
//         adjustments,
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

// const getAdjustmentHistory = async (req, res) => {
//   try {
//     const { emp_id, company_id, search } = req.query;
//     const filter = {};
//     if (emp_id) filter.emp_id = emp_id;
//     if (company_id && company_id !== 'all') filter.company_id = company_id;

//     const balances = await LeaveBalance.find(filter)
//       .populate('emp_id', 'name emp_code department')
//       .populate('company_id', 'name code')
//       .lean();

//     const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//     let adjustments = [];

//     balances.forEach((balance) => {
//       (balance.history || []).forEach((monthEntry) => {
//         (monthEntry.leaves_log || []).forEach((log) => {
//           const isAdj =
//             log.is_adjustment ||
//             log.from_date === 'ADJUSTMENT' ||
//             log.from_date === 'MANUAL_CREDIT' ||
//             !!log.adjustment_reason;

//           if (!isAdj) return;

//           adjustments.push({
//             _id: log._id,
//             emp_id: balance.emp_id?._id || balance.emp_id,
//             employee_name: balance.name || balance.emp_id?.name || '—',
//             emp_code: balance.emp_code || balance.emp_id?.emp_code || '—',
//             department: balance.emp_id?.department || '',
//             company: balance.company_id,
//             company_name: balance.company_id?.name || '',
//             company_code: balance.company_id?.code || '',
//             month: monthEntry.month,
//             year: monthEntry.year,
//             month_label: `${MONTHS[(monthEntry.month || 1) - 1]} ${monthEntry.year}`,
//             adjustment_type: log.adjustment_type || 'add',
//             days: log.approved_days || 0,
//             reason: log.adjustment_reason || 'Manual Adjustment',
//             adjusted_by: log.adjusted_by || 'Admin',
//             adjusted_on: log.approved_on || null,
//           });
//         });
//       });
//     });

//     if (search && search.trim()) {
//       const q = search.trim().toLowerCase();
//       adjustments = adjustments.filter(
//         (a) =>
//           (a.employee_name || '').toLowerCase().includes(q) ||
//           (a.emp_code || '').toLowerCase().includes(q) ||
//           (a.reason || '').toLowerCase().includes(q) ||
//           (a.company_name || '').toLowerCase().includes(q) ||
//           (a.company_code || '').toLowerCase().includes(q)
//       );
//     }

//     adjustments.sort((a, b) => new Date(b.adjusted_on || 0) - new Date(a.adjusted_on || 0));

//     res.json({ success: true, count: adjustments.length, data: adjustments });
//   } catch (err) {
//     console.error('Get adjustment history error:', err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// const deleteAdjustment = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const balance = await LeaveBalance.findOne({ 'history.leaves_log._id': id });

//     if (!balance) {
//       return res.status(404).json({ success: false, message: 'Adjustment record not found' });
//     }

//     let found = false;
//     let daysValue = 0;
//     let isAdd = false;

//     for (let i = 0; i < balance.history.length; i++) {
//       const monthEntry = balance.history[i];
//       if (monthEntry.leaves_log && monthEntry.leaves_log.length > 0) {
//         const logIndex = monthEntry.leaves_log.findIndex(l => l._id && String(l._id) === id);
        
//         if (logIndex !== -1) {
//           const log = monthEntry.leaves_log[logIndex];
//           daysValue = Number(log.approved_days || 0);
//           isAdd = log.adjustment_type !== 'deduct';

//           monthEntry.leaves_log.splice(logIndex, 1);

//           if (isAdd) {
//             monthEntry.credited = Math.max(0, Number(monthEntry.credited || 0) - daysValue);
//           } else {
//             monthEntry.used = Math.max(0, Number(monthEntry.used || 0) - daysValue);
//           }

//           found = true;
//           break;
//         }
//       }
//     }

//     if (!found) {
//       return res.status(404).json({ success: false, message: 'Adjustment log could not be deleted' });
//     }

//     rechainBalances(balance);
//     await balance.save();

//     res.json({ success: true, message: 'Adjustment deleted and balance reverted successfully' });
//   } catch (err) {
//     console.error('Delete adjustment error:', err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // 🌟 EXPORTS (Dono Naming Convention Aliased so Node Router won't crash)
// module.exports = {
//   // Original names
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
//   deleteAdjustment,

//   // Alias names used in Redux/Routes
//   fetchMyBalance: getMyBalance,
//   fetchEmployeeBalance: getEmployeeBalance,
//   fetchAllEmployeesWithBalance: getAllEmployeesWithBalance,
//   fetchAdjustmentHistory: getAdjustmentHistory,
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

// Re-chains all opening & closing balances properly across months
const rechainBalances = (balance) => {
  if (!balance.history) return;

  balance.history.sort((a, b) => {
    if (Number(a.year) !== Number(b.year)) return Number(a.year) - Number(b.year);
    return Number(a.month) - Number(b.month);
  });

  let running = 0;
  let totCredited = 0;
  let totUsed = 0;

  balance.history.forEach((h) => {
    h.opening_balance = running;
    const credited = Number(h.credited || 0);
    const used = Number(h.used || 0);
    h.closing_balance = Math.max(0, running + credited - used);
    running = h.closing_balance;

    totCredited += credited;
    totUsed += used;
  });

  balance.current_balance = running;
  balance.total_credited = totCredited;
  balance.total_used = totUsed;
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
        opening_balance: 0,
        credited,
        used: 0,
        closing_balance: 0,
        leaves_log: [],
        credited_on: new Date(),
      });
      changed = true;
    }

    m++;
    if (m > 12) { m = 1; y++; }
  }

  if (changed) {
    rechainBalances(balance);
    await balance.save();
  }

  return balance;
};

const recalculateAndFixLeaveBalance = async (empIdOrBalance) => {
  if (typeof empIdOrBalance === 'object' && empIdOrBalance?._id) return empIdOrBalance;
  return LeaveBalance.findOne({ emp_id: empIdOrBalance });
};

// READ-ONLY DISPLAY BUILDER
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

const getMyBalance = async (req, res) => {
  try {
    const empId = req.employee?._id || req.user?._id;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    await backfillBalance(empId);

    const balance = await LeaveBalance.findOne({ emp_id: empId }).lean();
    if (!balance) {
      return res.json({
        success: true,
        data: { current_balance: 0, total_credited: 0, total_used: 0, history: [] },
      });
    }

    const formattedHistory = await buildDisplayHistory(
      empId,
      balance.history,
      req.employee?.worker_type || req.user?.worker_type
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
    const emp_id = req.params.emp_id || req.params.empId;
    const balance = await LeaveBalance.findOne({ emp_id }).lean();
    if (!balance) {
      return res.json({ success: true, data: { current_balance: 0, total_used: 0 } });
    }
    res.json({ success: true, data: balance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🆕 Support for backdated leaves inside standard admin deductions
const deductBalance = async (empId, leaveId, approvedDays, fromDate, toDate, appliedDays) => {
  const balance = await getOrCreateBalance(empId);

  const before = Number(balance.current_balance || 0);
  const paid = Math.min(before, Number(approvedDays || 0));
  const unpaid = Math.max(0, Number(approvedDays || 0) - paid);

  // Parse target month/year from leave fromDate for accurate historical ledger placement
  const pFrom = parseDateParts(fromDate);
  const targetMonth = pFrom ? pFrom.month : (new Date().getMonth() + 1);
  const targetYear = pFrom ? pFrom.year : new Date().getFullYear();

  let monthEntry = (balance.history || []).find(
    (h) => Number(h.month) === targetMonth && Number(h.year) === targetYear
  );

  if (!monthEntry) {
    balance.history.push({
      month: targetMonth,
      year: targetYear,
      opening_balance: 0,
      credited: 0,
      used: 0,
      closing_balance: 0,
      leaves_log: [],
    });
    monthEntry = balance.history[balance.history.length - 1];
  }

  monthEntry.used = Number(monthEntry.used || 0) + Number(approvedDays || 0);
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

  rechainBalances(balance);
  await balance.save();

  return {
    balance_before: before,
    balance_after: balance.current_balance,
    paid_days: paid,
    unpaid_days: unpaid,
  };
};

const restoreBalance = async (empId, leaveId, approvedDays) => {
  const balance = await LeaveBalance.findOne({ emp_id: empId });
  if (!balance) return;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthEntry = (balance.history || []).find(
    (h) => Number(h.month) === currentMonth && Number(h.year) === currentYear
  );

  if (monthEntry) {
    monthEntry.used = Math.max(0, Number(monthEntry.used || 0) - Number(approvedDays || 0));
    if (leaveId) {
      monthEntry.leaves_log = (monthEntry.leaves_log || []).filter(
        (l) => !l.leave_id || String(l.leave_id) !== String(leaveId)
      );
    }
  }

  rechainBalances(balance);
  await balance.save();
};

const manualCredit = async (req, res) => {
  try {
    const { emp_id, days, month, year } = req.body;
    if (!emp_id || !days) {
      return res.status(400).json({ success: false, message: 'Employee and days required' });
    }

    const balance = await getOrCreateBalance(emp_id);
    const val = Math.abs(parseFloat(days));
    const now = new Date();
    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();

    let monthEntry = balance.history.find(
      (h) => Number(h.month) === targetMonth && Number(h.year) === targetYear
    );
    if (!monthEntry) {
      balance.history.push({
        month: targetMonth,
        year: targetYear,
        opening_balance: 0,
        credited: 0,
        used: 0,
        closing_balance: 0,
        leaves_log: [],
      });
      monthEntry = balance.history[balance.history.length - 1];
    }

    monthEntry.credited = Number(monthEntry.credited || 0) + val;
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
      adjusted_by: req.employee?.name || req.user?.name || 'Admin',
    });

    rechainBalances(balance);
    await balance.save();

    res.json({ success: true, message: `${days} leaves credited`, data: balance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adjustLeaveBalance = async (req, res) => {
  try {
    const { emp_id, days, reason, adjustment_type, month, year } = req.body;

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

    const now = new Date();
    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();

    let monthEntry = (balance.history || []).find(
      (h) => Number(h.month) === targetMonth && Number(h.year) === targetYear
    );

    if (!monthEntry) {
      balance.history.push({
        month: targetMonth,
        year: targetYear,
        opening_balance: 0,
        credited: 0,
        used: 0,
        closing_balance: 0,
        leaves_log: [],
      });
      monthEntry = balance.history[balance.history.length - 1];
    }

    if (isAdd) {
      monthEntry.credited = Number(monthEntry.credited || 0) + daysValue;
    } else {
      monthEntry.used = Number(monthEntry.used || 0) + daysValue;
    }

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
      adjusted_by: req.employee?.name || req.user?.name || 'Super Admin',
    });

    rechainBalances(balance);
    await balance.save();

    res.json({
      success: true,
      message: `${isAdd ? 'Added' : 'Deducted'} ${daysValue} leave(s) for ${employee.name}.`,
      data: {
        employee: { name: employee.name, emp_code: employee.emp_code },
        balance_before: before,
        balance_after: balance.current_balance,
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
            _id: log._id,
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

const deleteAdjustment = async (req, res) => {
  try {
    const { id } = req.params;

    const balance = await LeaveBalance.findOne({ 'history.leaves_log._id': id });

    if (!balance) {
      return res.status(404).json({ success: false, message: 'Adjustment record not found' });
    }

    let found = false;
    let daysValue = 0;
    let isAdd = false;

    for (let i = 0; i < balance.history.length; i++) {
      const monthEntry = balance.history[i];
      if (monthEntry.leaves_log && monthEntry.leaves_log.length > 0) {
        const logIndex = monthEntry.leaves_log.findIndex(l => l._id && String(l._id) === id);
        if (logIndex !== -1) {
          const log = monthEntry.leaves_log[logIndex];
          daysValue = Number(log.approved_days || 0);
          isAdd = log.adjustment_type !== 'deduct';

          monthEntry.leaves_log.splice(logIndex, 1);

          if (isAdd) {
            monthEntry.credited = Math.max(0, Number(monthEntry.credited || 0) - daysValue);
          } else {
            monthEntry.used = Math.max(0, Number(monthEntry.used || 0) - daysValue);
          }

          found = true;
          break;
        }
      }
    }

    if (!found) {
      return res.status(404).json({ success: false, message: 'Adjustment log could not be deleted' });
    }

    rechainBalances(balance);
    await balance.save();

    res.json({ success: true, message: 'Adjustment deleted and balance reverted successfully' });
  } catch (err) {
    console.error('Delete adjustment error:', err);
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
  deleteAdjustment,

  fetchMyBalance: getMyBalance,
  fetchEmployeeBalance: getEmployeeBalance,
  fetchAllEmployeesWithBalance: getAllEmployeesWithBalance,
  fetchAdjustmentHistory: getAdjustmentHistory,
};