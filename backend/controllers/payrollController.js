

// // backend/controllers/payrollController.js

// const Employee = require('../models/Employee');
// const Attendance = require('../models/Attendance');
// const Leave = require('../models/Leave');
// const MonthlySettings = require('../models/MonthlySettings');
// const Company = require('../models/Company');
// const LeaveBalance = require('../models/LeaveBalance');

// const FREE_LEAVES_PER_MONTH = 2;

// // ════════════════════════════════════════════
// // HELPERS
// // ════════════════════════════════════════════

// const parseTimeToMinutes = (timeStr) => {
//   if (!timeStr) return null;
//   const parts = timeStr.trim().split(' ');
//   if (parts.length !== 2) return null;
//   const [time, period] = parts;
//   let [hours, minutes] = time.split(':').map(Number);
//   if (isNaN(hours) || isNaN(minutes)) return null;
//   if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
//   if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
//   return hours * 60 + minutes;
// };

// const calculateWorkingMinutes = (inTime, outTime) => {
//   if (!inTime || !outTime) return 0;
//   const inMin = parseTimeToMinutes(inTime);
//   const outMin = parseTimeToMinutes(outTime);
//   if (inMin === null || outMin === null) return 0;
//   let diff = outMin - inMin;
//   if (diff < 0) diff += 24 * 60;
//   return diff;
// };

// const getDayName = (dateStr) => {
//   const [d, m, y] = dateStr.split('/').map(Number);
//   const date = new Date(y, m - 1, d);
//   return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
// };

// const getDatesInMonth = (month, year) => {
//   const dates = [];
//   const daysInMonth = new Date(year, month, 0).getDate();
//   for (let d = 1; d <= daysInMonth; d++) {
//     dates.push(`${d}/${month}/${year}`);
//   }
//   return dates;
// };

// const formatHours = (totalMinutes) => {
//   if (!totalMinutes || totalMinutes < 0) return '0h 0m';
//   const hours = Math.floor(totalMinutes / 60);
//   const minutes = totalMinutes % 60;
//   return `${hours}h ${minutes}m`;
// };

// // ════════════════════════════════════════════
// // SMART OFF DAY DETECTION (Per Employee)
// // ════════════════════════════════════════════
// const detectOffDays = (allDates, attendanceRecords) => {
//   const attendedDates = new Set(
//     attendanceRecords.filter(a => a.in_time).map(a => a.date)
//   );

//   const weeks = [];
//   let currentWeek = [];

//   for (const dateStr of allDates) {
//     const [d, m, y] = dateStr.split('/').map(Number);
//     const date = new Date(y, m - 1, d);
//     const dayIdx = date.getDay();

//     if (dayIdx === 0 && currentWeek.length > 0) {
//       weeks.push(currentWeek);
//       currentWeek = [];
//     }

//     currentWeek.push({
//       dateStr,
//       dayName: getDayName(dateStr),
//       dayIdx,
//       attended: attendedDates.has(dateStr),
//     });
//   }
//   if (currentWeek.length > 0) weeks.push(currentWeek);

//   const offDates = new Set();

//   for (const week of weeks) {
//     const sundayInWeek = week.find(d => d.dayIdx === 0);
//     const sundayAttended = sundayInWeek?.attended || false;

//     if (!sundayAttended) {
//       if (sundayInWeek) offDates.add(sundayInWeek.dateStr);
//     } else {
//       const notAttendedDays = week.filter(d => !d.attended && d.dayIdx !== 0);
//       if (notAttendedDays.length > 0) {
//         offDates.add(notAttendedDays[0].dateStr);
//       }
//     }
//   }

//   return offDates;
// };

// // ════════════════════════════════════════════
// // 🎯 PAYROLL CALCULATION (Per Employee) — DUAL METHOD
// // ════════════════════════════════════════════
// const calculateEmployeePayroll = async (employee, month, year, settings) => {
//   const monthlySalary = employee.monthly_salary || 0;
//   const dailyHours = settings?.daily_hours || 8;
//   const dailyMinutes = dailyHours * 60;
//   const holidays = settings?.holidays || [];

//   // ────────────────────────────────────────
//   // 1. All dates + holidays
//   // ────────────────────────────────────────
//   const allDates = getDatesInMonth(month, year);
//   const holidaySet = new Set(holidays.map(h => h.date));

//   // ────────────────────────────────────────
//   // 2. Fetch attendance & leaves
//   // ────────────────────────────────────────
//   const attendanceRecords = await Attendance.find({
//     emp_id: employee._id,
//     date: { $in: allDates },
//   });

//   const allLeaves = await Leave.find({
//     emp_id: employee._id,
//     status: 'approved',
//   });

//   const monthLeaves = allLeaves.filter(l => {
//     const [d, m, y] = l.from_date.split('/').map(Number);
//     return m === month && y === year;
//   });

//   const totalLeavesTaken = monthLeaves.reduce((sum, l) => sum + (l.leave_days || 1), 0);

//   // Build leave date set
//   const leaveDateSet = new Set();
//   monthLeaves.forEach(l => {
//     const [fd, fm, fy] = l.from_date.split('/').map(Number);
//     const [td, tm, ty] = l.to_date.split('/').map(Number);
//     const fromDate = new Date(fy, fm - 1, fd);
//     const toDate = new Date(ty, tm - 1, td);
//     const current = new Date(fromDate);
//     while (current <= toDate) {
//       leaveDateSet.add(`${current.getDate()}/${current.getMonth() + 1}/${current.getFullYear()}`);
//       current.setDate(current.getDate() + 1);
//     }
//   });

//   // ────────────────────────────────────────
//   // 3. SMART DETECT OFF DAYS
//   // ────────────────────────────────────────
//   const offDates = detectOffDays(allDates, attendanceRecords);

//   // ────────────────────────────────────────
//   // 4. Working days count
//   // ────────────────────────────────────────
//   let totalWorkingDays = 0;
//   let offDayCount = 0;
//   let holidayCount = 0;

//   for (const dateStr of allDates) {
//     if (offDates.has(dateStr)) {
//       offDayCount++;
//     } else if (holidaySet.has(dateStr)) {
//       holidayCount++;
//     } else {
//       totalWorkingDays++;
//     }
//   }

//   // ────────────────────────────────────────
//   // 5. Required hours
//   // ────────────────────────────────────────
//   const autoHours = totalWorkingDays * dailyHours;
//   const requiredHours = settings?.required_hours
//     ? Number(settings.required_hours)
//     : autoHours;
//   const requiredMinutes = requiredHours * 60;

//   // ────────────────────────────────────────
//   // 🎯 6. PROCESS ATTENDANCE
//   // ────────────────────────────────────────
//   let totalWorkedMinutes = 0;
//   let presentDays = 0;
//   let sundayWorked = 0;

//   const today = new Date();
//   const todayDate = today.getDate();
//   const isCurrentMonth = (month === today.getMonth() + 1 && year === today.getFullYear());

//   for (const dateStr of allDates) {
//     const [d] = dateStr.split('/').map(Number);
//     const dayName = getDayName(dateStr);

//     if (isCurrentMonth && d > todayDate) continue;

//     const attendance = attendanceRecords.find(a => a.date === dateStr);

//     if (attendance && attendance.in_time) {
//       presentDays++;
//       if (dayName === 'Sunday') sundayWorked++;
//       if (attendance.out_time) {
//         totalWorkedMinutes += calculateWorkingMinutes(attendance.in_time, attendance.out_time);
//       }
//     }
//   }

//   // ABSENT = Working days pe nahi aaya (excluding off, holidays, leaves)
//   let expectedWorkDays = 0;
//   for (const dateStr of allDates) {
//     const [d] = dateStr.split('/').map(Number);
//     if (isCurrentMonth && d > todayDate) continue;
//     if (offDates.has(dateStr)) continue;
//     if (holidaySet.has(dateStr)) continue;
//     if (leaveDateSet.has(dateStr)) continue;
//     expectedWorkDays++;
//   }

//   const absentDays = Math.max(0, expectedWorkDays - presentDays);

//   // ────────────────────────────────────────
//   // 7. Leave Balance (Carry Forward)
//   // ────────────────────────────────────────
//   const leaveBalance = await LeaveBalance.findOne({ emp_id: employee._id });

//   let openingBalance = 0;
//   let creditedThisMonth = FREE_LEAVES_PER_MONTH;

//   if (leaveBalance) {
//     const monthEntry = leaveBalance.history.find(h => h.month === month && h.year === year);
//     if (monthEntry) {
//       openingBalance = monthEntry.opening_balance || 0;
//       creditedThisMonth = monthEntry.credited || FREE_LEAVES_PER_MONTH;
//     } else {
//       openingBalance = leaveBalance.current_balance || 0;
//     }
//   }

//   // ────────────────────────────────────────
//   // 🎯 8. SMART LEAVE LOGIC
//   // ────────────────────────────────────────
//   const compensatoryOffs = sundayWorked;
//   const effectiveLeaves = Math.max(0, totalLeavesTaken - compensatoryOffs);
//   const totalAvailableLeaves = openingBalance + creditedThisMonth;
//   const paidLeaves = Math.min(effectiveLeaves, totalAvailableLeaves);
//   const unpaidLeaves = Math.max(0, effectiveLeaves - totalAvailableLeaves);
//   const carryForward = Math.max(0, totalAvailableLeaves - effectiveLeaves);

//   // ────────────────────────────────────────
//   // 🎯 9. SALARY CALCULATION (DUAL METHOD)
//   // ────────────────────────────────────────

//   const perDayRate = totalWorkingDays > 0 ? (monthlySalary / totalWorkingDays) : 0;
//   const perHourRate = requiredHours > 0 ? (monthlySalary / requiredHours) : 0;

//   // ═══ METHOD 1: HOURS BASED ═══
//   const paidLeaveMinutes = paidLeaves * dailyMinutes;
//   const totalWorkingHourMinutes = totalWorkedMinutes + paidLeaveMinutes;

//   let hoursProgressPercent = 0;
//   if (requiredMinutes > 0) {
//     hoursProgressPercent = (totalWorkingHourMinutes / requiredMinutes) * 100;
//   }
//   const cappedHoursProgress = Math.min(hoursProgressPercent, 100);
//   const hoursBasedEarned = Math.round((monthlySalary * cappedHoursProgress) / 100);
//   const hoursBasedDeduction = monthlySalary - hoursBasedEarned;

//   // ═══ METHOD 2: DAYS BASED ═══
//   const payableDays = presentDays + paidLeaves;
//   let daysProgressPercent = 0;
//   if (totalWorkingDays > 0) {
//     daysProgressPercent = (payableDays / totalWorkingDays) * 100;
//   }
//   const cappedDaysProgress = Math.min(daysProgressPercent, 100);
//   const daysBasedEarned = Math.round(perDayRate * payableDays);
//   const daysBasedDeduction = Math.max(0, monthlySalary - daysBasedEarned);
//   const absentDeduction = Math.round(perDayRate * absentDays);
//   const unpaidLeaveDeduction = Math.round(perDayRate * unpaidLeaves);

//   // ═══ DEFAULT (backward compatibility) — Using HOURS method ═══
//   const earnedSalary = hoursBasedEarned;
//   const totalDeduction = hoursBasedDeduction;
//   const netPayable = earnedSalary;
//   const progressPercent = hoursProgressPercent;
//   const deductionPercent = Math.max(0, 100 - progressPercent);

//   // ────────────────────────────────────────
//   // Debug Log
//   // ────────────────────────────────────────
//   console.log(`📊 ${employee.name} (${employee.emp_code}):`);
//   console.log(`   📅 Working Days: ${totalWorkingDays} | Off: ${offDayCount} | Holiday: ${holidayCount}`);
//   console.log(`   👤 Present: ${presentDays} | Absent: ${absentDays} | Leaves: ${totalLeavesTaken}`);
//   console.log(`   ☀️  Sunday Work: ${sundayWorked} → Comp Offs: ${compensatoryOffs}`);
//   console.log(`   💼 Paid Leaves: ${paidLeaves} | Unpaid: ${unpaidLeaves} | Carry: ${carryForward}`);
//   console.log(`   ⏱️  Worked: ${formatHours(totalWorkedMinutes)} / ${requiredHours}h`);
//   console.log(`   ────────────────────────────────`);
//   console.log(`   💰 [HOURS]: ${hoursProgressPercent.toFixed(2)}% → Earned: ₹${hoursBasedEarned} | Cut: ₹${hoursBasedDeduction}`);
//   console.log(`   💰 [DAYS]:  ${daysProgressPercent.toFixed(2)}% → Earned: ₹${daysBasedEarned} | Cut: ₹${daysBasedDeduction}`);
//   console.log('   ═══════════════════════════════════');

//   return {
//     emp_id: employee._id,
//     emp_code: employee.emp_code,
//     name: employee.name,
//     department: employee.department,
//     designation: employee.designation,

//     // Salary
//     monthly_salary: monthlySalary,
//     targeted_hours: requiredHours,
//     targeted_hours_formatted: `${requiredHours}h`,

//     // Days
//     total_working_days: totalWorkingDays,
//     total_present: presentDays,
//     total_absent: absentDays,
//     present_days: presentDays,
//     absent_days: absentDays,
//     sunday_count: offDayCount,
//     holiday_count: holidayCount,
//     sunday_worked: sundayWorked,

//     // Leave Balance
//     leave_opening_balance: openingBalance,
//     leave_credited: creditedThisMonth,
//     leave_used: totalLeavesTaken,
//     leave_closing_balance: carryForward,
//     leave_available: totalAvailableLeaves,

//     // Leave Breakdown
//     payble_leave: paidLeaves,
//     paid_leave_days: paidLeaves,
//     unpaid_leave_days: unpaidLeaves,
//     total_leave_approved: totalLeavesTaken,
//     free_paid_leaves_allowed: FREE_LEAVES_PER_MONTH,
//     compensatory_offs: compensatoryOffs,
//     effective_leaves: effectiveLeaves,

//     // Hours
//     worked_hours: formatHours(totalWorkedMinutes),
//     worked_minutes: totalWorkedMinutes,
//     total_working_hour: formatHours(totalWorkingHourMinutes),
//     total_paid_hours: formatHours(totalWorkingHourMinutes),
//     total_paid_minutes: totalWorkingHourMinutes,

//     // 🆕 ═══ HOURS BASED CALCULATION ═══
//     hours_based: {
//       progress_percent: parseFloat(hoursProgressPercent.toFixed(2)),
//       capped_percent: parseFloat(cappedHoursProgress.toFixed(2)),
//       earned: hoursBasedEarned,
//       deduction: hoursBasedDeduction,
//       net_payable: hoursBasedEarned,
//       total_hours_worked: formatHours(totalWorkedMinutes),
//       paid_leave_hours: formatHours(paidLeaveMinutes),
//       total_effective_hours: formatHours(totalWorkingHourMinutes),
//     },

//     // 🆕 ═══ DAYS BASED CALCULATION ═══
//     days_based: {
//       progress_percent: parseFloat(daysProgressPercent.toFixed(2)),
//       capped_percent: parseFloat(cappedDaysProgress.toFixed(2)),
//       earned: daysBasedEarned,
//       deduction: daysBasedDeduction,
//       net_payable: daysBasedEarned,
//       payable_days: payableDays,
//       absent_deduction: absentDeduction,
//       unpaid_leave_deduction: unpaidLeaveDeduction,
//       per_day_rate: parseFloat(perDayRate.toFixed(2)),
//     },

//     // Default (backward compatibility — uses HOURS method)
//     total_progress_percent: parseFloat(progressPercent.toFixed(2)),
//     fix_salary_percent: 100,
//     deduction_percent: parseFloat(deductionPercent.toFixed(2)),
//     progress_according_percent: parseFloat(progressPercent.toFixed(2)),

//     // Salary defaults
//     hours_amount: Math.round((totalWorkedMinutes / 60) * perHourRate),
//     earned_salary: earnedSalary,
//     total_deduction: totalDeduction,
//     net_payable: netPayable,
//     unpaid_deduction: unpaidLeaveDeduction,
//     absent_deduction: absentDeduction,

//     // Rates
//     per_hour_rate: parseFloat(perHourRate.toFixed(2)),
//     per_day_rate: parseFloat(perDayRate.toFixed(2)),
//   };
// };

// // ════════════════════════════════════════════
// // GET COMPANY PAYROLL
// // ════════════════════════════════════════════
// const getCompanyPayroll = async (req, res) => {
//   try {
//     const { company_id, department, month, year } = req.query;

//     if (!company_id) {
//       return res.status(400).json({ success: false, message: 'company_id required' });
//     }

//     const currentMonth = parseInt(month) || new Date().getMonth() + 1;
//     const currentYear = parseInt(year) || new Date().getFullYear();

//     const company = await Company.findById(company_id);
//     if (!company) {
//       return res.status(404).json({ success: false, message: 'Company not found' });
//     }

//     const settings = await MonthlySettings.findOne({
//       company_id,
//       month: currentMonth,
//       year: currentYear,
//     });

//     console.log('\n═══════════════════════════════════════');
//     console.log(`📊 PAYROLL CALCULATION (DUAL METHOD)`);
//     console.log(`   Company: ${company.name}`);
//     console.log(`   Month: ${currentMonth}/${currentYear}`);
//     console.log(`   Required Hours: ${settings?.required_hours || 'auto'}`);
//     console.log(`   Free Leaves: ${FREE_LEAVES_PER_MONTH}/month`);
//     console.log(`   🆕 Sunday Work = Compensatory Off`);
//     console.log(`   🆕 Dual Calculation: Hours + Days`);
//     console.log('═══════════════════════════════════════\n');

//     const filter = {
//       company_id,
//       status: 'approved',
//       role: { $ne: 'super_admin' },
//     };
//     if (department && department !== 'all') {
//       filter.department = department;
//     }

//     const employees = await Employee.find(filter).sort({ name: 1 });

//     if (employees.length === 0) {
//       return res.json({
//         success: true,
//         data: {
//           company: { name: company.name, code: company.code, address: company.address },
//           month: currentMonth,
//           year: currentYear,
//           month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }),
//           employees: [],
//           summary: {
//             total_employees: 0,
//             total_monthly_salary: 0,
//             total_earned: 0,
//             total_earned_hours: 0,
//             total_earned_days: 0,
//             total_deduction: 0,
//             total_deduction_hours: 0,
//             total_deduction_days: 0,
//             total_net_payable: 0,
//           },
//         },
//       });
//     }

//     const payrollData = [];
//     for (const emp of employees) {
//       const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
//       payrollData.push(payroll);
//     }

//     // 🆕 DUAL SUMMARY
//     const summary = {
//       total_employees: payrollData.length,
//       total_monthly_salary: payrollData.reduce((s, p) => s + p.monthly_salary, 0),

//       // Hours based totals
//       total_earned_hours: payrollData.reduce((s, p) => s + p.hours_based.earned, 0),
//       total_deduction_hours: payrollData.reduce((s, p) => s + p.hours_based.deduction, 0),
//       total_net_payable_hours: payrollData.reduce((s, p) => s + p.hours_based.net_payable, 0),

//       // Days based totals
//       total_earned_days: payrollData.reduce((s, p) => s + p.days_based.earned, 0),
//       total_deduction_days: payrollData.reduce((s, p) => s + p.days_based.deduction, 0),
//       total_net_payable_days: payrollData.reduce((s, p) => s + p.days_based.net_payable, 0),
//       total_absent_deduction: payrollData.reduce((s, p) => s + (p.days_based.absent_deduction || 0), 0),
//       total_unpaid_leave_deduction: payrollData.reduce((s, p) => s + (p.days_based.unpaid_leave_deduction || 0), 0),

//       // Default (backward compat — uses HOURS method)
//       total_earned: payrollData.reduce((s, p) => s + p.earned_salary, 0),
//       total_deduction: payrollData.reduce((s, p) => s + p.total_deduction, 0),
//       total_net_payable: payrollData.reduce((s, p) => s + p.net_payable, 0),
//       total_hours_amount: payrollData.reduce((s, p) => s + (p.hours_amount || 0), 0),

//       // Attendance
//       total_present: payrollData.reduce((s, p) => s + p.total_present, 0),
//       total_absent: payrollData.reduce((s, p) => s + p.total_absent, 0),
//       total_leaves: payrollData.reduce((s, p) => s + p.total_leave_approved, 0),
//       total_carry_forward: payrollData.reduce((s, p) => s + (p.leave_closing_balance || 0), 0),
//       total_sunday_worked: payrollData.reduce((s, p) => s + (p.sunday_worked || 0), 0),
//       total_compensatory: payrollData.reduce((s, p) => s + (p.compensatory_offs || 0), 0),
//     };

//     console.log(`\n✅ TOTAL: ${summary.total_employees} employees`);
//     console.log(`💰 Total Salary: ₹${summary.total_monthly_salary.toLocaleString('en-IN')}`);
//     console.log(`💵 [HOURS] Earned: ₹${summary.total_earned_hours.toLocaleString('en-IN')} | Cut: ₹${summary.total_deduction_hours.toLocaleString('en-IN')}`);
//     console.log(`💵 [DAYS]  Earned: ₹${summary.total_earned_days.toLocaleString('en-IN')} | Cut: ₹${summary.total_deduction_days.toLocaleString('en-IN')}`);
//     console.log(`☀️  Sunday Work: ${summary.total_sunday_worked} | Comp Offs: ${summary.total_compensatory}\n`);

//     return res.json({
//       success: true,
//       data: {
//         company: {
//           _id: company._id,
//           name: company.name,
//           code: company.code,
//           address: company.address,
//         },
//         month: currentMonth,
//         year: currentYear,
//         month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }),
//         department: department || 'all',
//         settings: {
//           required_hours: settings?.required_hours || (payrollData[0]?.targeted_hours || 0),
//           daily_hours: settings?.daily_hours || 8,
//           holidays_count: (settings?.holidays || []).length,
//           weekly_off: settings?.weekly_off || ['Sunday'],
//           free_paid_leaves: FREE_LEAVES_PER_MONTH,
//         },
//         employees: payrollData,
//         summary,
//       },
//     });
//   } catch (error) {
//     console.error('getCompanyPayroll error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // ════════════════════════════════════════════
// // GET DEPARTMENTS
// // ════════════════════════════════════════════
// const getCompanyDepartments = async (req, res) => {
//   try {
//     const { company_id } = req.query;
//     if (!company_id) {
//       return res.status(400).json({ success: false, message: 'company_id required' });
//     }

//     const departments = await Employee.distinct('department', {
//       company_id,
//       status: 'approved',
//     });

//     return res.json({
//       success: true,
//       data: departments.filter(d => d && d.trim() !== ''),
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: 'Server error', error: error.message });
//   }
// };

// module.exports = {
//   getCompanyPayroll,
//   getCompanyDepartments,
//   calculateEmployeePayroll,
// };






// backend/controllers/payrollController.js

const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const MonthlySettings = require('../models/MonthlySettings');
const Company = require('../models/Company');
const LeaveBalance = require('../models/LeaveBalance');
const { 
  getAttendanceStatus, 
  calculateLateLeaveDeduction 
} = require('../utils/attendanceStatus');

const FREE_LEAVES_PER_MONTH = 1;  // 🆕 Changed from 2 to 1

// ════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(' ');
  if (parts.length !== 2) return null;
  const [time, period] = parts;
  let [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const calculateWorkingMinutes = (inTime, outTime) => {
  if (!inTime || !outTime) return 0;
  const inMin = parseTimeToMinutes(inTime);
  const outMin = parseTimeToMinutes(outTime);
  if (inMin === null || outMin === null) return 0;
  let diff = outMin - inMin;
  if (diff < 0) diff += 24 * 60;
  return diff;
};

const getDayName = (dateStr) => {
  const [d, m, y] = dateStr.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
};

const getDatesInMonth = (month, year) => {
  const dates = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(`${d}/${month}/${year}`);
  }
  return dates;
};

const formatHours = (totalMinutes) => {
  if (!totalMinutes || totalMinutes < 0) return '0h 0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

// ════════════════════════════════════════════
// DETECT OFF DAYS (per employee)
// ════════════════════════════════════════════
const detectOffDays = (allDates, attendanceRecords) => {
  const attendedDates = new Set(
    attendanceRecords.filter(a => a.in_time).map(a => a.date)
  );

  const weeks = [];
  let currentWeek = [];

  for (const dateStr of allDates) {
    const [d, m, y] = dateStr.split('/').map(Number);
    const date = new Date(y, m - 1, d);
    const dayIdx = date.getDay();

    if (dayIdx === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentWeek.push({
      dateStr,
      dayName: getDayName(dateStr),
      dayIdx,
      attended: attendedDates.has(dateStr),
    });
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const offDates = new Set();

  for (const week of weeks) {
    const sundayInWeek = week.find(d => d.dayIdx === 0);
    const sundayAttended = sundayInWeek?.attended || false;

    if (!sundayAttended) {
      if (sundayInWeek) offDates.add(sundayInWeek.dateStr);
    } else {
      const notAttendedDays = week.filter(d => !d.attended && d.dayIdx !== 0);
      if (notAttendedDays.length > 0) {
        offDates.add(notAttendedDays[0].dateStr);
      }
    }
  }

  return offDates;
};

// ════════════════════════════════════════════
// 🎯 PAYROLL CALCULATION with LATE/HALF-DAY LOGIC
// ════════════════════════════════════════════
const calculateEmployeePayroll = async (employee, month, year, settings) => {
  const monthlySalary = employee.monthly_salary || 0;
  const dailyHours = settings?.daily_hours || 8;
  const dailyMinutes = dailyHours * 60;
  const holidays = settings?.holidays || [];

  const allDates = getDatesInMonth(month, year);
  const holidaySet = new Set(holidays.map(h => h.date));

  const attendanceRecords = await Attendance.find({
    emp_id: employee._id,
    date: { $in: allDates },
  });

  const allLeaves = await Leave.find({
    emp_id: employee._id,
    status: 'approved',
  });

  const monthLeaves = allLeaves.filter(l => {
    const [d, m, y] = l.from_date.split('/').map(Number);
    return m === month && y === year;
  });

  const totalLeavesTaken = monthLeaves.reduce((sum, l) => sum + (l.leave_days || 1), 0);

  const leaveDateSet = new Set();
  monthLeaves.forEach(l => {
    const [fd, fm, fy] = l.from_date.split('/').map(Number);
    const [td, tm, ty] = l.to_date.split('/').map(Number);
    const fromDate = new Date(fy, fm - 1, fd);
    const toDate = new Date(ty, tm - 1, td);
    const current = new Date(fromDate);
    while (current <= toDate) {
      leaveDateSet.add(`${current.getDate()}/${current.getMonth() + 1}/${current.getFullYear()}`);
      current.setDate(current.getDate() + 1);
    }
  });

  const offDates = detectOffDays(allDates, attendanceRecords);

  let totalWorkingDays = 0;
  let offDayCount = 0;
  let holidayCount = 0;

  for (const dateStr of allDates) {
    if (offDates.has(dateStr)) {
      offDayCount++;
    } else if (holidaySet.has(dateStr)) {
      holidayCount++;
    } else {
      totalWorkingDays++;
    }
  }

  const autoHours = totalWorkingDays * dailyHours;
  const requiredHours = settings?.required_hours
    ? Number(settings.required_hours)
    : autoHours;
  const requiredMinutes = requiredHours * 60;

  // ════════════════════════════════════════
  // 🆕 PROCESS ATTENDANCE WITH LATE/HALF-DAY
  // ════════════════════════════════════════
  let totalWorkedMinutes = 0;
  let presentDays = 0;
  let sundayWorked = 0;
  let lateCount = 0;
  let halfDayCount = 0;
  const lateDates = [];
  const halfDayDates = [];

  const today = new Date();
  const todayDate = today.getDate();
  const isCurrentMonth = (month === today.getMonth() + 1 && year === today.getFullYear());

  for (const dateStr of allDates) {
    const [d] = dateStr.split('/').map(Number);
    const dayName = getDayName(dateStr);

    if (isCurrentMonth && d > todayDate) continue;

    const attendance = attendanceRecords.find(a => a.date === dateStr);

    if (attendance && attendance.in_time) {
      presentDays++;
      if (dayName === 'Sunday') sundayWorked++;
      
      if (attendance.out_time) {
        totalWorkedMinutes += calculateWorkingMinutes(attendance.in_time, attendance.out_time);
      }

      // 🆕 CHECK LATE/HALF-DAY STATUS
      const statusInfo = getAttendanceStatus(attendance.in_time, attendance.out_time);
      
      if (statusInfo.is_late) {
        lateCount++;
        lateDates.push(dateStr);
      }
      
      if (statusInfo.is_half_day) {
        halfDayCount++;
        halfDayDates.push(dateStr);
      }
    }
  }

  let expectedWorkDays = 0;
  for (const dateStr of allDates) {
    const [d] = dateStr.split('/').map(Number);
    if (isCurrentMonth && d > todayDate) continue;
    if (offDates.has(dateStr)) continue;
    if (holidaySet.has(dateStr)) continue;
    if (leaveDateSet.has(dateStr)) continue;
    expectedWorkDays++;
  }

  const absentDays = Math.max(0, expectedWorkDays - presentDays);

  // ════════════════════════════════════════
  // 🆕 CALCULATE LATE-TO-LEAVE CONVERSION
  // ════════════════════════════════════════
  const lateLeaveDeduction = calculateLateLeaveDeduction(lateCount);
  const halfDayLeaves = halfDayCount * 0.5;
  const totalLateHalfDayDeduction = lateLeaveDeduction + halfDayLeaves;

  // Leave Balance
  const leaveBalance = await LeaveBalance.findOne({ emp_id: employee._id });

  let openingBalance = 0;
  let creditedThisMonth = FREE_LEAVES_PER_MONTH;

  if (leaveBalance) {
    const monthEntry = leaveBalance.history?.find(h => h.month === month && h.year === year);
    if (monthEntry) {
      openingBalance = monthEntry.opening_balance || 0;
      creditedThisMonth = monthEntry.credited || FREE_LEAVES_PER_MONTH;
    } else {
      openingBalance = leaveBalance.current_balance || 0;
    }
  }

  // ════════════════════════════════════════
  // 🎯 SMART LEAVE LOGIC WITH LATE DEDUCTION
  // ════════════════════════════════════════
  const compensatoryOffs = sundayWorked;
  
  // Total leaves needed:
  // - Actual leaves taken
  // - Late conversion
  // - Half day conversion
  const totalLeavesNeeded = totalLeavesTaken + totalLateHalfDayDeduction;
  
  // Effective leaves after compensatory offs
  const effectiveLeaves = Math.max(0, totalLeavesNeeded - compensatoryOffs);
  const totalAvailableLeaves = openingBalance + creditedThisMonth;
  
  const paidLeaves = Math.min(effectiveLeaves, totalAvailableLeaves);
  const unpaidLeaves = Math.max(0, effectiveLeaves - totalAvailableLeaves);
  const carryForward = Math.max(0, totalAvailableLeaves - effectiveLeaves);

  // ════════════════════════════════════════
  // SALARY CALCULATION
  // ════════════════════════════════════════
  const perDayRate = totalWorkingDays > 0 ? (monthlySalary / totalWorkingDays) : 0;
  const perHourRate = requiredHours > 0 ? (monthlySalary / requiredHours) : 0;

  // HOURS BASED
  const paidLeaveMinutes = paidLeaves * dailyMinutes;
  const totalWorkingHourMinutes = totalWorkedMinutes + paidLeaveMinutes;
  let hoursProgressPercent = 0;
  if (requiredMinutes > 0) {
    hoursProgressPercent = (totalWorkingHourMinutes / requiredMinutes) * 100;
  }
  const cappedHoursProgress = Math.min(hoursProgressPercent, 100);
  const hoursBasedEarned = Math.round((monthlySalary * cappedHoursProgress) / 100);
  const hoursBasedDeduction = monthlySalary - hoursBasedEarned;

  // DAYS BASED (with late/half-day deductions)
  const payableDays = presentDays + paidLeaves - totalLateHalfDayDeduction;
  let daysProgressPercent = 0;
  if (totalWorkingDays > 0) {
    daysProgressPercent = (payableDays / totalWorkingDays) * 100;
  }
  const cappedDaysProgress = Math.min(daysProgressPercent, 100);
  const daysBasedEarned = Math.round(perDayRate * Math.max(0, payableDays));
  const daysBasedDeduction = Math.max(0, monthlySalary - daysBasedEarned);
  
  const absentDeduction = Math.round(perDayRate * absentDays);
  const unpaidLeaveDeduction = Math.round(perDayRate * unpaidLeaves);
  const lateHalfDayDeductionAmount = Math.round(perDayRate * totalLateHalfDayDeduction);

  // Default (backward compat)
  const earnedSalary = hoursBasedEarned;
  const totalDeduction = hoursBasedDeduction;
  const netPayable = earnedSalary;
  const progressPercent = hoursProgressPercent;
  const deductionPercent = Math.max(0, 100 - progressPercent);

  // Debug log
  console.log(`\n📊 ${employee.name} (${employee.emp_code}):`);
  console.log(`   📅 Working Days: ${totalWorkingDays} | Off: ${offDayCount} | Holiday: ${holidayCount}`);
  console.log(`   👤 Present: ${presentDays} | Absent: ${absentDays}`);
  console.log(`   ⏰ Late: ${lateCount} → Deduction: ${lateLeaveDeduction} days`);
  console.log(`   🕐 Half Days: ${halfDayCount} → Deduction: ${halfDayLeaves} days`);
  console.log(`   📋 Actual Leaves: ${totalLeavesTaken}`);
  console.log(`   📊 Total Leave Deduction: ${totalLateHalfDayDeduction} days`);
  console.log(`   💼 Paid: ${paidLeaves} | Unpaid: ${unpaidLeaves} | Carry: ${carryForward}`);
  console.log(`   💰 [HOURS]: ${hoursProgressPercent.toFixed(2)}% → ₹${hoursBasedEarned}`);
  console.log(`   💰 [DAYS]:  ${daysProgressPercent.toFixed(2)}% → ₹${daysBasedEarned}`);
  console.log('   ═══════════════════════════════════');

  return {
    emp_id: employee._id,
    emp_code: employee.emp_code,
    name: employee.name,
    department: employee.department,
    designation: employee.designation,

    monthly_salary: monthlySalary,
    targeted_hours: requiredHours,
    targeted_hours_formatted: `${requiredHours}h`,

    total_working_days: totalWorkingDays,
    total_present: presentDays,
    total_absent: absentDays,
    present_days: presentDays,
    absent_days: absentDays,
    sunday_count: offDayCount,
    holiday_count: holidayCount,
    sunday_worked: sundayWorked,

    // 🆕 LATE / HALF DAY STATS
    late_count: lateCount,
    half_day_count: halfDayCount,
    late_dates: lateDates,
    half_day_dates: halfDayDates,
    late_leave_deduction: lateLeaveDeduction,
    half_day_leaves: halfDayLeaves,
    total_late_half_day_deduction: totalLateHalfDayDeduction,
    late_half_day_amount: lateHalfDayDeductionAmount,

    // Leave Balance
    leave_opening_balance: openingBalance,
    leave_credited: creditedThisMonth,
    leave_used: totalLeavesTaken,
    leave_closing_balance: carryForward,
    leave_available: totalAvailableLeaves,

    payble_leave: paidLeaves,
    paid_leave_days: paidLeaves,
    unpaid_leave_days: unpaidLeaves,
    total_leave_approved: totalLeavesTaken,
    free_paid_leaves_allowed: FREE_LEAVES_PER_MONTH,
    compensatory_offs: compensatoryOffs,
    effective_leaves: effectiveLeaves,

    worked_hours: formatHours(totalWorkedMinutes),
    worked_minutes: totalWorkedMinutes,
    total_working_hour: formatHours(totalWorkingHourMinutes),
    total_paid_hours: formatHours(totalWorkingHourMinutes),
    total_paid_minutes: totalWorkingHourMinutes,

    hours_based: {
      progress_percent: parseFloat(hoursProgressPercent.toFixed(2)),
      capped_percent: parseFloat(cappedHoursProgress.toFixed(2)),
      earned: hoursBasedEarned,
      deduction: hoursBasedDeduction,
      net_payable: hoursBasedEarned,
      total_hours_worked: formatHours(totalWorkedMinutes),
      paid_leave_hours: formatHours(paidLeaveMinutes),
      total_effective_hours: formatHours(totalWorkingHourMinutes),
    },

    days_based: {
      progress_percent: parseFloat(daysProgressPercent.toFixed(2)),
      capped_percent: parseFloat(cappedDaysProgress.toFixed(2)),
      earned: daysBasedEarned,
      deduction: daysBasedDeduction,
      net_payable: daysBasedEarned,
      payable_days: payableDays,
      absent_deduction: absentDeduction,
      unpaid_leave_deduction: unpaidLeaveDeduction,
      late_half_day_deduction: lateHalfDayDeductionAmount,
      per_day_rate: parseFloat(perDayRate.toFixed(2)),
    },

    total_progress_percent: parseFloat(progressPercent.toFixed(2)),
    fix_salary_percent: 100,
    deduction_percent: parseFloat(deductionPercent.toFixed(2)),
    progress_according_percent: parseFloat(progressPercent.toFixed(2)),

    hours_amount: Math.round((totalWorkedMinutes / 60) * perHourRate),
    earned_salary: earnedSalary,
    total_deduction: totalDeduction,
    net_payable: netPayable,
    unpaid_deduction: unpaidLeaveDeduction,
    absent_deduction: absentDeduction,

    per_hour_rate: parseFloat(perHourRate.toFixed(2)),
    per_day_rate: parseFloat(perDayRate.toFixed(2)),
  };
};

// ════════════════════════════════════════════
// GET COMPANY PAYROLL
// ════════════════════════════════════════════
const getCompanyPayroll = async (req, res) => {
  try {
    const { company_id, department, month, year } = req.query;

    if (!company_id) {
      return res.status(400).json({ success: false, message: 'company_id required' });
    }

    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();

    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const settings = await MonthlySettings.findOne({
      company_id,
      month: currentMonth,
      year: currentYear,
    });

    console.log('\n═══════════════════════════════════════');
    console.log(`📊 PAYROLL WITH LATE/HALF-DAY RULES`);
    console.log(`   Company: ${company.name}`);
    console.log(`   Month: ${currentMonth}/${currentYear}`);
    console.log(`   Office: 9:30 AM - 6:30 PM`);
    console.log(`   Late Rules: 3L=0.5d | 5L=1d | Extra L=0.5d each`);
    console.log(`   Half Day: IN≥11AM or OUT≤4PM`);
    console.log(`   Free Leaves: ${FREE_LEAVES_PER_MONTH}/month`);
    console.log('═══════════════════════════════════════\n');

    const filter = {
      company_id,
      status: 'approved',
      role: { $ne: 'super_admin' },
    };
    if (department && department !== 'all') {
      filter.department = department;
    }

    const employees = await Employee.find(filter).sort({ name: 1 });

    if (employees.length === 0) {
      return res.json({
        success: true,
        data: {
          company: { name: company.name, code: company.code, address: company.address },
          month: currentMonth,
          year: currentYear,
          month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }),
          employees: [],
          summary: {
            total_employees: 0,
            total_monthly_salary: 0,
            total_earned: 0,
            total_earned_hours: 0,
            total_earned_days: 0,
            total_deduction: 0,
            total_deduction_hours: 0,
            total_deduction_days: 0,
            total_net_payable: 0,
          },
        },
      });
    }

    const payrollData = [];
    for (const emp of employees) {
      const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
      payrollData.push(payroll);
    }

    const summary = {
      total_employees: payrollData.length,
      total_monthly_salary: payrollData.reduce((s, p) => s + p.monthly_salary, 0),

      total_earned_hours: payrollData.reduce((s, p) => s + p.hours_based.earned, 0),
      total_deduction_hours: payrollData.reduce((s, p) => s + p.hours_based.deduction, 0),
      total_net_payable_hours: payrollData.reduce((s, p) => s + p.hours_based.net_payable, 0),

      total_earned_days: payrollData.reduce((s, p) => s + p.days_based.earned, 0),
      total_deduction_days: payrollData.reduce((s, p) => s + p.days_based.deduction, 0),
      total_net_payable_days: payrollData.reduce((s, p) => s + p.days_based.net_payable, 0),
      total_absent_deduction: payrollData.reduce((s, p) => s + (p.days_based.absent_deduction || 0), 0),
      total_unpaid_leave_deduction: payrollData.reduce((s, p) => s + (p.days_based.unpaid_leave_deduction || 0), 0),

      total_earned: payrollData.reduce((s, p) => s + p.earned_salary, 0),
      total_deduction: payrollData.reduce((s, p) => s + p.total_deduction, 0),
      total_net_payable: payrollData.reduce((s, p) => s + p.net_payable, 0),
      total_hours_amount: payrollData.reduce((s, p) => s + (p.hours_amount || 0), 0),

      total_present: payrollData.reduce((s, p) => s + p.total_present, 0),
      total_absent: payrollData.reduce((s, p) => s + p.total_absent, 0),
      total_leaves: payrollData.reduce((s, p) => s + p.total_leave_approved, 0),
      total_carry_forward: payrollData.reduce((s, p) => s + (p.leave_closing_balance || 0), 0),
      total_sunday_worked: payrollData.reduce((s, p) => s + (p.sunday_worked || 0), 0),
      total_compensatory: payrollData.reduce((s, p) => s + (p.compensatory_offs || 0), 0),
      
      // 🆕 Late/Half Day totals
      total_late: payrollData.reduce((s, p) => s + (p.late_count || 0), 0),
      total_half_day: payrollData.reduce((s, p) => s + (p.half_day_count || 0), 0),
      total_late_deduction_days: payrollData.reduce((s, p) => s + (p.total_late_half_day_deduction || 0), 0),
    };

    console.log(`\n✅ TOTAL: ${summary.total_employees} employees`);
    console.log(`⏰ Total Late: ${summary.total_late} | Half Day: ${summary.total_half_day}`);
    console.log(`💰 [HOURS] Earned: ₹${summary.total_earned_hours} | Cut: ₹${summary.total_deduction_hours}`);
    console.log(`💰 [DAYS]  Earned: ₹${summary.total_earned_days} | Cut: ₹${summary.total_deduction_days}\n`);

    return res.json({
      success: true,
      data: {
        company: {
          _id: company._id,
          name: company.name,
          code: company.code,
          address: company.address,
        },
        month: currentMonth,
        year: currentYear,
        month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }),
        department: department || 'all',
        settings: {
          required_hours: settings?.required_hours || (payrollData[0]?.targeted_hours || 0),
          daily_hours: settings?.daily_hours || 8,
          holidays_count: (settings?.holidays || []).length,
          weekly_off: settings?.weekly_off || ['Sunday'],
          free_paid_leaves: FREE_LEAVES_PER_MONTH,
          office_in_time: '09:30 AM',
          office_out_time: '06:30 PM',
          late_in_limit: '09:45 AM',
          half_day_in_limit: '11:00 AM',
          half_day_out_limit: '04:00 PM',
        },
        employees: payrollData,
        summary,
      },
    });
  } catch (error) {
    console.error('getCompanyPayroll error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

const getCompanyDepartments = async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) {
      return res.status(400).json({ success: false, message: 'company_id required' });
    }

    const departments = await Employee.distinct('department', {
      company_id,
      status: 'approved',
    });

    return res.json({
      success: true,
      data: departments.filter(d => d && d.trim() !== ''),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getCompanyPayroll,
  getCompanyDepartments,
  calculateEmployeePayroll,
};