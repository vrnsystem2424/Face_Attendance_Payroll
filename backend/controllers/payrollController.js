

// const Employee = require('../models/Employee');
// const Attendance = require('../models/Attendance');
// const Leave = require('../models/Leave');
// const MonthlySettings = require('../models/MonthlySettings');
// const Company = require('../models/Company');
// const LeaveBalance = require('../models/LeaveBalance');
// const {
//   getAttendanceStatus,
//   calculateLateLeaveDeduction,
// } = require('../utils/attendanceStatus');

// const FREE_LEAVES_OFFICE = 1;
// const FREE_LEAVES_SITE_RCC = 2;

// const getFreeLeavesCount = async (employee) => {
//   if (!employee.company_id) return FREE_LEAVES_OFFICE;
//   let isRCC = false;
//   if (typeof employee.company_id === 'object' && employee.company_id.code) {
//     isRCC = employee.company_id.code.toUpperCase() === 'RCC';
//   } else {
//     try {
//       const company = await Company.findById(employee.company_id).lean();
//       if (company && company.code && company.code.toUpperCase() === 'RCC') {
//         isRCC = true;
//       }
//     } catch (err) {
//       console.error("Error finding company for free leaves count:", err.message);
//     }
//   }
//   if (employee.worker_type === 'site' && isRCC) {
//     return FREE_LEAVES_SITE_RCC;
//   }
//   return FREE_LEAVES_OFFICE;
// };

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
//   if (str.includes('PM')) {
//     period = 'PM';
//     str = str.replace('PM', '').trim();
//   } else if (str.includes('AM')) {
//     period = 'AM';
//     str = str.replace('AM', '').trim();
//   }
//   const parts = str.split(':').map(Number);
//   if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
//   let hours = parts[0];
//   const minutes = parts[1];
//   if (period === 'PM' && hours !== 12) hours += 12;
//   if (period === 'AM' && hours === 12) hours = 0;
//   return hours * 60 + minutes;
// };

// const getJoiningDate = (employee) => {
//   const raw = employee.joining_date || employee.createdAt;
//   if (!raw) return new Date(0);
//   const p = parseDateParts(raw);
//   if (p) return new Date(p.year, p.month - 1, p.day);
//   const dt = new Date(raw);
//   if (!isNaN(dt.getTime())) {
//     return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
//   }
//   return new Date(0);
// };

// const getFreeLeavesForMonth = (employee, month, year, maxLeaves) => {
//   const joinDate = getJoiningDate(employee);
//   if (joinDate.getTime() === 0) return maxLeaves;
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

// const getLateStartDay = (month, year) => {
//   if (month === 7 && year === 2026) return 6;
//   return 1;
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
//   return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
//     new Date(y, m - 1, d).getDay()
//   ];
// };

// const getDatesInMonth = (month, year) => {
//   const dates = [];
//   const daysInMonth = new Date(year, month, 0).getDate();
//   for (let d = 1; d <= daysInMonth; d++) dates.push(`${d}/${month}/${year}`);
//   return dates;
// };

// const formatHours = (totalMinutes) => {
//   if (!totalMinutes || totalMinutes < 0) return '0h 0m';
//   return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
// };

// const calculateEmployeePayroll = async (employee, month, year, settings) => {
//   const empJoinDate = getJoiningDate(employee);
//   const joinDateOnly = new Date(empJoinDate.getFullYear(), empJoinDate.getMonth(), empJoinDate.getDate());
//   const payrollEnd = new Date(year, month, 0);
//   if (joinDateOnly.getTime() > 0 && joinDateOnly > payrollEnd) return null;
//   const monthlySalary = employee.monthly_salary || 0;
//   const holidays = settings?.holidays || [];
//   const weeklyOffSetting = settings?.weekly_off || ['Sunday'];
//   const lateStartDay = getLateStartDay(month, year);
//   const allDates = getDatesInMonth(month, year);
  
//   const isOfficialSiteWorker = employee.worker_type === 'site';
//   const isFSR = employee.worker_type === 'fsr'; 
//   const maxLeaves = await getFreeLeavesCount(employee);
//   const holidaySet = new Set();
//   holidays.forEach((h) => {
//     const p = parseDateParts(h.date);
//     if (p) holidaySet.add(p.key);
//   });
//   const totalDaysInMonth = new Date(year, month, 0).getDate();
//   const allEmpAttendance = await Attendance.find({ emp_id: employee._id });
//   const attendanceRecords = allEmpAttendance.filter((a) => {
//     const p = parseDateParts(a.date);
//     return p && p.month === month && p.year === year;
//   });
//   const allLeaves = await Leave.find({ emp_id: employee._id, status: 'approved' });
//   const monthStart = new Date(year, month - 1, 1);
//   const monthEnd = new Date(year, month, 0);
//   const halfDayLeaveDates = new Set();
//   const fullLeaveDates = new Set();
//   let fullDayLeaves = 0;
//   let halfDayLeaves = 0;
//   allLeaves.forEach((l) => {
//     if (!l.from_date || !l.to_date) return;
//     const pFrom = parseDateParts(l.from_date);
//     const pTo = parseDateParts(l.to_date);
//     if (!pFrom || !pTo) return;
//     const leaveStart = new Date(pFrom.year, pFrom.month - 1, pFrom.day);
//     const leaveEnd = new Date(pTo.year, pTo.month - 1, pTo.day);
//     if (leaveEnd < monthStart || leaveStart > monthEnd) return;
//     if (joinDateOnly.getTime() > 0 && leaveEnd < joinDateOnly) return;
//     if (l.is_half_day) {
//       if (pFrom.month === month && pFrom.year === year && (joinDateOnly.getTime() === 0 || leaveStart >= joinDateOnly)) {
//         halfDayLeaveDates.add(pFrom.key);
//         halfDayLeaves += 1;
//       }
//     } else {
//       let clampStart = leaveStart < monthStart ? new Date(monthStart) : new Date(leaveStart);
//       const clampEnd = leaveEnd > monthEnd ? new Date(monthEnd) : new Date(leaveEnd);
//       if (joinDateOnly.getTime() > 0 && clampStart < joinDateOnly) clampStart = new Date(joinDateOnly);
//       let daysInThisMonth = 0;
//       for (let curr = new Date(clampStart); curr <= clampEnd; curr.setDate(curr.getDate() + 1)) {
//         const key = `${curr.getDate()}/${curr.getMonth() + 1}/${curr.getFullYear()}`;
//         fullLeaveDates.add(key);
//         daysInThisMonth++;
//       }
//       fullDayLeaves += daysInThisMonth;
//     }
//   });
//   let sundayCount = 0;
//   let holidayCount = 0;
//   let workingDaysCount = 0;
//   for (const dateStr of allDates) {
//     const [d] = dateStr.split('/').map(Number);
//     const currDate = new Date(year, month - 1, d);
//     if (joinDateOnly.getTime() > 0 && currDate < joinDateOnly) continue;
//     const dayName = getDayName(dateStr);
//     if (holidaySet.has(dateStr)) {
//       holidayCount++;
//     } else if (weeklyOffSetting.includes(dayName)) {
//       if (!isOfficialSiteWorker) sundayCount++;
//       else workingDaysCount++;
//     } else {
//       workingDaysCount++;
//     }
//   }
//   let totalWorkedMinutes = 0;
//   let totalCheckins = 0;
//   let sundayWorked = 0;
//   let weekdayCheckins = 0;
//   let lateCount = 0;
//   let halfDayCount = 0;
//   let ignoredLateCount = 0;
//   let hdLeaveWithAttendance = 0;
//   const lateDates = [];
//   const halfDayDates = [];
//   const today = new Date();
//   const todayDate = today.getDate();
//   const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();
//   let holidaysWorked = 0;
//   for (const dateStr of allDates) {
//     const [d] = dateStr.split('/').map(Number);
//     const currDate = new Date(year, month - 1, d);
//     if (joinDateOnly.getTime() > 0 && currDate < joinDateOnly) continue;
//     if (isCurrentMonth && d > todayDate) continue;
//     const dayName = getDayName(dateStr);
//     const isWeeklyOff = weeklyOffSetting.includes(dayName);
//     const att = attendanceRecords.find((a) => {
//       const p = parseDateParts(a.date);
//       return p && p.key === dateStr;
//     });
//     if (att && att.in_time) {
//       totalCheckins++;
      
//       if (holidaySet.has(dateStr)) holidaysWorked++;
//       if (isOfficialSiteWorker) {
//         weekdayCheckins++;
//         if (isWeeklyOff) sundayWorked++;
//       } else {
//         if (isWeeklyOff) sundayWorked++;
//         else weekdayCheckins++;
//       }
//       if (att.out_time) {
//         totalWorkedMinutes += calculateWorkingMinutes(att.in_time, att.out_time);
//       }
//       const inMinutes = parseTimeToMinutes(att.in_time);
//       const isHalfDayFromTime = inMinutes !== null && inMinutes >= 720;
//       const isLateFromTime = inMinutes !== null && inMinutes > 585;
//       const status = getAttendanceStatus(att.in_time, att.out_time);
//       const isHalfDayDay = isHalfDayFromTime || att.is_half_day === true || status.is_half_day === true || att.daily_status === 'half-day';
//       const isLateDay = !isHalfDayDay && (isLateFromTime || att.is_late === true || status.is_late === true || att.daily_status === 'late');
//       const isHalfDayLeaveDay = halfDayLeaveDates.has(dateStr);
//       const isFullLeaveDay = fullLeaveDates.has(dateStr);
//       if (isHalfDayLeaveDay) hdLeaveWithAttendance++;
//       if (!isOfficialSiteWorker) {
//         if (d >= lateStartDay) {
//           if (!isHalfDayLeaveDay && !isFullLeaveDay) {
//             if (isHalfDayDay && !isWeeklyOff) {
//               halfDayCount++;
//               halfDayDates.push(dateStr);
//             } else if (isLateDay) {
//               lateCount++;
//               lateDates.push(dateStr);
//             }
//           }
//         } else if (isLateDay || isHalfDayDay) {
//           ignoredLateCount++;
//         }
//       }
//     }
//   }
//   let presentDays = 0;
//   if (isFSR) {
//     const totalActualCheckins = weekdayCheckins + sundayWorked;
//     presentDays = Math.max(0, totalActualCheckins - (halfDayCount * 0.5) - (hdLeaveWithAttendance * 0.5));
//   } else {
//     presentDays = Math.max(0, weekdayCheckins - (halfDayCount * 0.5) - (hdLeaveWithAttendance * 0.5));
//   }
//   const halfDayValue = halfDayCount * 0.5;
//   const lateLeaveDeduction = calculateLateLeaveDeduction(lateCount);
//   const creditedThisMonth = getFreeLeavesForMonth(employee, month, year, maxLeaves);
//   const leaveBalance = await LeaveBalance.findOne({ emp_id: employee._id });
//   let openingBalance = 0;
//   let effectiveCredited = creditedThisMonth;
//   if (leaveBalance) {
//     const entry = leaveBalance.history?.find((h) => Number(h.month) === Number(month) && Number(h.year) === Number(year));
//     if (entry) {
//       openingBalance = Number(entry.opening_balance || 0);
//       effectiveCredited = entry.credited !== undefined && entry.credited !== null ? Number(entry.credited) : creditedThisMonth;
//     } else {
//       openingBalance = Number(leaveBalance.current_balance || 0);
//     }
//   }
//   const totalAvailable = openingBalance + effectiveCredited;

//   // 👈 FIXED HD DEDUCTION: Total HDs (attendance + leaves) * 0.5
//   const totalHalfDaysCount = halfDayCount + halfDayLeaves;
//   const halfDayDeduction = totalHalfDaysCount * 0.5;
  
//   const totalLeavesDays = fullDayLeaves + halfDayLeaves * 0.5;
//   const totalNeeded = totalLeavesDays + lateLeaveDeduction + (halfDayCount * 0.5);
  
//   const paidLeaves = Math.min(totalNeeded, totalAvailable);
//   const unpaidLeaves = Math.max(0, totalNeeded - totalAvailable);
//   const carryForward = Math.max(0, totalAvailable - paidLeaves);
//   let weeklyOffPaid = 0;
//   let holidaysPaid = 0;
//   let sundayBonus = 0;
  
//   if (isFSR) {
//   weeklyOffPaid = sundayCount;  // poore Sundays ka W/O milega (chahe Sunday pe aaye ya na aaye)
//   sundayBonus = 0; 
//   holidaysPaid = Math.max(0, holidayCount - holidaysWorked); 
// } else if (isOfficialSiteWorker) {
//     weeklyOffPaid = 0;
//     holidaysPaid = 0;
//     sundayBonus = 0;
//   } else {
//     weeklyOffPaid = sundayCount;
//     holidaysPaid = holidayCount;
//     sundayBonus = sundayWorked;
//   }
  
//   const finalPayableDaysRaw = presentDays + sundayBonus + weeklyOffPaid + holidaysPaid + paidLeaves - lateLeaveDeduction;
//   const finalPayableDays = Math.min(Math.max(0, finalPayableDaysRaw), totalDaysInMonth);
//   const perDayRate = totalDaysInMonth > 0 ? monthlySalary / totalDaysInMonth : 0;
//   let progressPercent = totalDaysInMonth > 0 ? (finalPayableDays / totalDaysInMonth) * 100 : 0;
//   progressPercent = Math.min(progressPercent, 100);
//   const earned = Math.min(Math.round(perDayRate * finalPayableDays), monthlySalary);
//   const cut = Math.max(0, monthlySalary - earned);
//   let absentDays = 0;
//   for (const dateStr of allDates) {
//     const [d] = dateStr.split('/').map(Number);
//     const currDate = new Date(year, month - 1, d);
//     if (joinDateOnly.getTime() > 0 && currDate < joinDateOnly) continue;
//     if (isCurrentMonth && d > todayDate) continue;
//     const dayName = getDayName(dateStr);
//     if (holidaySet.has(dateStr)) continue;
//     if (!isOfficialSiteWorker && weeklyOffSetting.includes(dayName)) continue;
//     const att = attendanceRecords.find((a) => {
//       const p = parseDateParts(a.date);
//       return p && p.key === dateStr;
//     });
//     const hasAttendance = att && att.in_time;
//     const isLeave = fullLeaveDates.has(dateStr) || halfDayLeaveDates.has(dateStr);
//     if (!hasAttendance && !isLeave) absentDays++;
//   }
//   return {
//     emp_id: employee._id,
//     emp_code: employee.emp_code,
//     name: employee.name,
//     department: employee.department,
//     designation: employee.designation,
//     worker_type: employee.worker_type, 
//     is_fsr: isFSR, 
//     monthly_salary: monthlySalary,
//     total_working_days: totalDaysInMonth,
//     actual_working_days: workingDaysCount,
//     total_present: presentDays, 
//     holidays_worked: holidaysWorked,
//     total_checkins: totalCheckins,
//     weekday_checkins: weekdayCheckins,
//     total_absent: absentDays,
//     absent_days: absentDays,
//     late_count: lateCount,
//     ignored_late_count: ignoredLateCount,
//     late_leave_deduction: lateLeaveDeduction,
//     late_dates: lateDates,
//     half_day_count: halfDayCount,
//     half_day_value: halfDayValue, 
//     half_day_deduction: halfDayDeduction, // 👈 Correctly returning 1 for 2 HDs
//     half_day_dates: halfDayDates,
//     half_day_leave_count: halfDayLeaves,
//     full_day_leaves: fullDayLeaves,
//     total_leave_approved: totalLeavesDays,
//     leave_opening_balance: openingBalance,
//     leave_credited: effectiveCredited,
//     leave_available: totalAvailable,
//     paid_leave_days: paidLeaves,
//     unpaid_leave_days: unpaidLeaves,
//     leave_closing_balance: carryForward,
//     final_payable_days: finalPayableDays,
//     sunday_worked: sundayWorked,
//     sunday_count: sundayCount,
//     weekly_off_paid: weeklyOffPaid,
//     holiday_count: holidayCount,
//     holiday_paid: holidaysPaid,
//     total_days_in_month: totalDaysInMonth,
//     per_day_rate: parseFloat(perDayRate.toFixed(2)),
//     progress_percent: parseFloat(progressPercent.toFixed(2)),
//     earned_salary: earned,
//     total_deduction: cut,
//     net_payable: earned,
//     worked_hours: formatHours(totalWorkedMinutes),
//     worked_minutes: totalWorkedMinutes,
//     is_site_worker: isOfficialSiteWorker,
//     late_start_day: lateStartDay,
//     ignored_absent_count: 0,
//     compensatory_offs: 0,
//     present_days: presentDays,
//     days_based: {
//       progress_percent: parseFloat(progressPercent.toFixed(2)),
//       earned,
//       deduction: cut,
//       net_payable: earned,
//       payable_days: finalPayableDays,
//       per_day_rate: parseFloat(perDayRate.toFixed(2)),
//     },
//     hours_based: {
//       progress_percent: parseFloat(progressPercent.toFixed(2)),
//       earned,
//       deduction: cut,
//       net_payable: earned,
//     },
//     total_earned_days: earned,
//     total_deduction_days: cut,
//   };
// };

// const getCompanyPayroll = async (req, res) => {
//   try {
//     const { company_id, department, month, year } = req.query;
//     if (!company_id) return res.status(400).json({ success: false, message: 'company_id required' });
//     const currentMonth = parseInt(month, 10) || new Date().getMonth() + 1;
//     const currentYear = parseInt(year, 10) || new Date().getFullYear();
//     const company = await Company.findById(company_id);
//     if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
//     const settings = await MonthlySettings.findOne({ company_id, month: currentMonth, year: currentYear });
//     const filter = { company_id, status: 'approved', role: { $ne: 'super_admin' } };
//     if (department && department !== 'all') filter.department = department;
//     const employees = await Employee.find(filter).sort({ name: 1 });
//     if (employees.length === 0) {
//       return res.json({
//         success: true,
//         data: {
//           company: { name: company.name, code: company.code, address: company.address },
//           month: currentMonth, year: currentYear,
//           month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }),
//           employees: [], summary: { total_employees: 0 },
//         },
//       });
//     }
//     const payrollData = [];
//     for (const emp of employees) {
//       const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
//       if (payroll) payrollData.push(payroll);
//     }
//     const anyBalance = await LeaveBalance.findOne({
//       emp_id: { $in: employees.map((e) => e._id) },
//       'history.payroll_finalized': true,
//       'history.month': currentMonth, 'history.year': currentYear,
//     });
//     const isFinalized = !!anyBalance;
    
//     const summary = {
//       total_employees: payrollData.length,
//       total_monthly_salary: payrollData.reduce((s, p) => s + p.monthly_salary, 0),
//       total_checkins: payrollData.reduce((s, p) => s + (p.total_checkins || 0), 0),
//       total_wo: payrollData.reduce((s, p) => s + (p.weekly_off_paid || 0), 0),
//       total_holiday: payrollData.reduce((s, p) => s + (p.holiday_paid || 0), 0),
//       total_late: payrollData.reduce((s, p) => s + (p.late_count || 0), 0),
//       total_late_deduction: payrollData.reduce((s, p) => s + (p.late_leave_deduction || 0), 0),
//       total_half_day: payrollData.reduce((s, p) => s + ((p.half_day_count || 0) + (p.half_day_leave_count || 0)), 0),
//       total_hd_deduction: payrollData.reduce((s, p) => s + (p.half_day_deduction || 0), 0),
//       total_leaves: payrollData.reduce((s, p) => s + (p.full_day_leaves || 0), 0),
//       total_paid_leaves: payrollData.reduce((s, p) => s + (p.paid_leave_days || 0), 0),
//       total_carry_forward: payrollData.reduce((s, p) => s + (p.leave_closing_balance || 0), 0),
//       total_earned: payrollData.reduce((s, p) => s + p.earned_salary, 0),
//       total_deduction: payrollData.reduce((s, p) => s + p.total_deduction, 0),
//       total_net_payable: payrollData.reduce((s, p) => s + p.net_payable, 0),
//     };
    
//     return res.json({
//       success: true,
//       data: {
//         company: { _id: company._id, name: company.name, code: company.code, address: company.address },
//         month: currentMonth, year: currentYear,
//         month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }),
//         department: department || 'all',
//         is_finalized: isFinalized,
//         settings: {
//           daily_hours: settings?.daily_hours || 8,
//           holidays_count: (settings?.holidays || []).length,
//           weekly_off: settings?.weekly_off || ['Sunday'],
//           free_paid_leaves_office: FREE_LEAVES_OFFICE,
//           free_paid_leaves_site_rcc: FREE_LEAVES_SITE_RCC,
//           late_start_day: getLateStartDay(currentMonth, currentYear),
//         },
//         employees: payrollData,
//         summary,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: 'Server error', error: error.message });
//   }
// };

// const finalizePayroll = async (req, res) => {
//   try {
//     const { company_id, month, year, department } = req.body;
//     if (!company_id || !month || !year) return res.status(400).json({ success: false, message: 'company_id, month, year required' });
//     const currentMonth = parseInt(month, 10);
//     const currentYear = parseInt(year, 10);
//     const company = await Company.findById(company_id);
//     if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
//     const settings = await MonthlySettings.findOne({ company_id, month: currentMonth, year: currentYear });
//     const filter = { company_id, status: 'approved', role: { $ne: 'super_admin' } };
//     if (department && department !== 'all') filter.department = department;
//     const employees = await Employee.find(filter);
//     if (employees.length === 0) return res.status(404).json({ success: false, message: 'No employees found' });
//     let recalculateAndFixLeaveBalance = null;
//     try { recalculateAndFixLeaveBalance = require('./leaveBalanceController').recalculateAndFixLeaveBalance; } catch (e) {}
//     const results = [];
//     let alreadyFinalizedCount = 0;
//     let processedCount = 0;
//     for (const emp of employees) {
//       const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
//       if (!payroll) continue;
//       const creditedThisMonth = payroll.leave_credited || 0;
//       let balance = await LeaveBalance.findOne({ emp_id: emp._id });
//       if (!balance) {
//         balance = await LeaveBalance.create({
//           emp_id: emp._id, emp_code: emp.emp_code, name: emp.name, company_id: emp.company_id,
//           current_balance: 0, total_credited: 0, total_used: 0, history: [],
//         });
//       }
//       let monthEntry = balance.history.find((h) => Number(h.month) === currentMonth && Number(h.year) === currentYear);
//       if (!monthEntry) {
//         balance.history.push({
//           month: currentMonth, year: currentYear, opening_balance: balance.current_balance || 0,
//           credited: creditedThisMonth, used: 0, closing_balance: balance.current_balance || 0, leaves_log: [],
//         });
//         monthEntry = balance.history[balance.history.length - 1];
//       }
//       if (monthEntry.payroll_finalized) {
//         alreadyFinalizedCount++;
//         results.push({ name: emp.name, emp_code: emp.emp_code, status: 'already_finalized', balance: balance.current_balance });
//         continue;
//       }
//       monthEntry.credited = creditedThisMonth;
//       monthEntry.leaves_log = (monthEntry.leaves_log || []).filter(
//         (l) => !(l.is_payroll_deduction || l.from_date === 'PAYROLL' || l.from_date === 'LATE_CUT' || l.from_date === 'HALFDAY_CUT')
//       );
//       const fullLeaveDays = Number(payroll.full_day_leaves || 0) + Number(payroll.half_day_leave_count || 0) * 0.5;
//       const lateCutDays = Number(payroll.late_leave_deduction || 0);
//       const hdCutDays = Number(payroll.half_day_deduction || 0);
//       const paidLeaveDays = Number(payroll.paid_leave_days || 0);
//       if (fullLeaveDays > 0) {
//         monthEntry.leaves_log.push({
//           leave_id: null, from_date: 'LEAVE', to_date: 'LEAVE', applied_days: fullLeaveDays, approved_days: fullLeaveDays,
//           paid_days: Math.min(fullLeaveDays, paidLeaveDays), unpaid_days: Math.max(0, fullLeaveDays - paidLeaveDays),
//           approved_on: new Date(), is_payroll_deduction: true, deduction_type: 'approved_leave', note: 'Approved leave days used in payroll',
//         });
//       }
//       if (lateCutDays > 0) {
//         monthEntry.leaves_log.push({
//           leave_id: null, from_date: 'LATE_CUT', to_date: 'LATE_CUT', applied_days: lateCutDays, approved_days: lateCutDays,
//           paid_days: lateCutDays, unpaid_days: 0, approved_on: new Date(), is_payroll_deduction: true, deduction_type: 'late_cut',
//           late_count: payroll.late_count || 0, note: `Late cut: ${payroll.late_count || 0} late → ${lateCutDays} day(s) leave deducted`,
//         });
//       }
//       if (hdCutDays > 0) {
//         monthEntry.leaves_log.push({
//           leave_id: null, from_date: 'HALFDAY_CUT', to_date: 'HALFDAY_CUT', applied_days: hdCutDays, approved_days: hdCutDays,
//           paid_days: hdCutDays, unpaid_days: 0, approved_on: new Date(), is_payroll_deduction: true, deduction_type: 'halfday_cut',
//           half_day_count: payroll.half_day_count || 0, note: `Half-day attendance cut: ${payroll.half_day_count || 0} HD → ${hdCutDays} day(s)`,
//         });
//       }
//       monthEntry.used = paidLeaveDays;
//       monthEntry.late_cut_days = lateCutDays;
//       monthEntry.halfday_cut_days = hdCutDays;
//       monthEntry.approved_leave_days = fullLeaveDays;
//       monthEntry.payroll_finalized = true;
//       monthEntry.finalized_on = new Date();
//       monthEntry.finalized_by = req.employee?.name || 'System';
//       if (typeof recalculateAndFixLeaveBalance === 'function') {
//         await recalculateAndFixLeaveBalance(balance);
//       } else {
//         const before = Number(balance.current_balance || 0);
//         balance.current_balance = Math.max(0, before + creditedThisMonth - paidLeaveDays);
//         balance.total_credited = Number(balance.total_credited || 0) + creditedThisMonth;
//         balance.total_used = Number(balance.total_used || 0) + paidLeaveDays;
//         monthEntry.closing_balance = balance.current_balance;
//         await balance.save();
//       }
//       processedCount++;
//       results.push({ name: emp.name, emp_code: emp.emp_code, status: 'finalized', paid_leave_days: paidLeaveDays, late_cut: lateCutDays, halfday_cut: hdCutDays, balance_after: balance.current_balance });
//     }
//     return res.json({ success: true, message: `Payroll finalized! ${processedCount} processed, ${alreadyFinalizedCount} already finalized`, data: { month: currentMonth, year: currentYear, total_employees: employees.length, processed: processedCount, already_finalized: alreadyFinalizedCount, results } });
//   } catch (error) { return res.status(500).json({ success: false, message: 'Finalize failed', error: error.message }); }
// };

// const getCompanyDepartments = async (req, res) => {
//   try {
//     const { company_id } = req.query;
//     if (!company_id) return res.status(400).json({ success: false, message: 'company_id required' });
//     const departments = await Employee.distinct('department', { company_id, status: 'approved' });
//     return res.json({ success: true, data: departments.filter((d) => d && d.trim() !== '') });
//   } catch (error) { return res.status(500).json({ success: false, message: 'Server error', error: error.message }); }
// };

// const getMySalary = async (req, res) => {
//   try {
//     const { month, year } = req.query;
//     const employee = req.employee;
//     if (!employee) return res.status(401).json({ success: false, message: 'Not authenticated' });
//     const currentMonth = parseInt(month, 10) || new Date().getMonth() + 1;
//     const currentYear = parseInt(year, 10) || new Date().getFullYear();
//     const settings = await MonthlySettings.findOne({ company_id: employee.company_id, month: currentMonth, year: currentYear });
//     const fullEmployee = await Employee.findById(employee._id).populate('company_id');
//     if (!fullEmployee) return res.status(404).json({ success: false, message: 'Employee not found' });
//     const payroll = await calculateEmployeePayroll(fullEmployee, currentMonth, currentYear, settings);
//     if (!payroll) {
//       return res.json({ success: true, data: { company: { name: fullEmployee.company_id?.name, code: fullEmployee.company_id?.code }, month: currentMonth, year: currentYear, month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }), is_finalized: false, payroll: null, message: "You haven't joined yet for this payroll period." } });
//     }
//     const balance = await LeaveBalance.findOne({ emp_id: employee._id });
//     let isFinalized = false;
//     if (balance) {
//       const entry = balance.history?.find((h) => Number(h.month) === currentMonth && Number(h.year) === currentYear);
//       isFinalized = entry?.payroll_finalized || false;
//     }
//     return res.json({ success: true, data: { company: { name: fullEmployee.company_id?.name, code: fullEmployee.company_id?.code }, month: currentMonth, year: currentYear, month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }), is_finalized: isFinalized, payroll } });
//   } catch (error) { return res.status(500).json({ success: false, message: 'Server error', error: error.message }); }
// };

// module.exports = {
//   getCompanyPayroll,
//   getCompanyDepartments,
//   calculateEmployeePayroll,
//   finalizePayroll,
//   getMySalary,
// };








const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const MonthlySettings = require('../models/MonthlySettings');
const Company = require('../models/Company');
const LeaveBalance = require('../models/LeaveBalance');
const {
  getAttendanceStatus,
  calculateLateLeaveDeduction,
} = require('../utils/attendanceStatus');

const FREE_LEAVES_OFFICE = 1;
const FREE_LEAVES_SITE_RCC = 2;

const getFreeLeavesCount = async (employee) => {
  if (!employee.company_id) return FREE_LEAVES_OFFICE;
  let isRCC = false;
  if (typeof employee.company_id === 'object' && employee.company_id.code) {
    isRCC = employee.company_id.code.toUpperCase() === 'RCC';
  } else {
    try {
      const company = await Company.findById(employee.company_id).lean();
      if (company && company.code && company.code.toUpperCase() === 'RCC') {
        isRCC = true;
      }
    } catch (err) {
      console.error("Error finding company for free leaves count:", err.message);
    }
  }
  if (employee.worker_type === 'site' && isRCC) {
    return FREE_LEAVES_SITE_RCC;
  }
  return FREE_LEAVES_OFFICE;
};

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
  if (str.includes('PM')) {
    period = 'PM';
    str = str.replace('PM', '').trim();
  } else if (str.includes('AM')) {
    period = 'AM';
    str = str.replace('AM', '').trim();
  }
  const parts = str.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  let hours = parts[0];
  const minutes = parts[1];
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const getJoiningDate = (employee) => {
  const raw = employee.joining_date || employee.createdAt;
  if (!raw) return new Date(0);
  const p = parseDateParts(raw);
  if (p) return new Date(p.year, p.month - 1, p.day);
  const dt = new Date(raw);
  if (!isNaN(dt.getTime())) {
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }
  return new Date(0);
};

const getFreeLeavesForMonth = (employee, month, year, maxLeaves) => {
  const joinDate = getJoiningDate(employee);
  if (joinDate.getTime() === 0) return maxLeaves;
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

const getLateStartDay = (month, year) => {
  if (month === 7 && year === 2026) return 6;
  return 1;
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
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    new Date(y, m - 1, d).getDay()
  ];
};

const getDatesInMonth = (month, year) => {
  const dates = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) dates.push(`${d}/${month}/${year}`);
  return dates;
};

const formatHours = (totalMinutes) => {
  if (!totalMinutes || totalMinutes < 0) return '0h 0m';
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
};

const calculateEmployeePayroll = async (employee, month, year, settings) => {
  const empJoinDate = getJoiningDate(employee);
  const joinDateOnly = new Date(empJoinDate.getFullYear(), empJoinDate.getMonth(), empJoinDate.getDate());
  const payrollEnd = new Date(year, month, 0);
  if (joinDateOnly.getTime() > 0 && joinDateOnly > payrollEnd) return null;

  const monthlySalary = employee.monthly_salary || 0;
  const holidays = settings?.holidays || [];
  const weeklyOffSetting = settings?.weekly_off || ['Sunday'];
  const lateStartDay = getLateStartDay(month, year);
  const allDates = getDatesInMonth(month, year);
  
  const isOfficialSiteWorker = employee.worker_type === 'site';
  const isFSR = employee.worker_type === 'fsr'; 
  const maxLeaves = await getFreeLeavesCount(employee);

  const holidaySet = new Set();
  holidays.forEach((h) => {
    const p = parseDateParts(h.date);
    if (p) holidaySet.add(p.key);
  });

  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const allEmpAttendance = await Attendance.find({ emp_id: employee._id });
  const attendanceRecords = allEmpAttendance.filter((a) => {
    const p = parseDateParts(a.date);
    return p && p.month === month && p.year === year;
  });

  const allLeaves = await Leave.find({ emp_id: employee._id, status: 'approved' });
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  const halfDayLeaveDates = new Set();
  const fullLeaveDates = new Set();
  let fullDayLeaves = 0;
  let halfDayLeaves = 0;

  allLeaves.forEach((l) => {
    if (!l.from_date || !l.to_date) return;
    const pFrom = parseDateParts(l.from_date);
    const pTo = parseDateParts(l.to_date);
    if (!pFrom || !pTo) return;

    const leaveStart = new Date(pFrom.year, pFrom.month - 1, pFrom.day);
    const leaveEnd = new Date(pTo.year, pTo.month - 1, pTo.day);

    if (leaveEnd < monthStart || leaveStart > monthEnd) return;
    if (joinDateOnly.getTime() > 0 && leaveEnd < joinDateOnly) return;

    if (l.is_half_day) {
      if (pFrom.month === month && pFrom.year === year && (joinDateOnly.getTime() === 0 || leaveStart >= joinDateOnly)) {
        halfDayLeaveDates.add(pFrom.key);
        halfDayLeaves += 1;
      }
    } else {
      let clampStart = leaveStart < monthStart ? new Date(monthStart) : new Date(leaveStart);
      const clampEnd = leaveEnd > monthEnd ? new Date(monthEnd) : new Date(leaveEnd);
      if (joinDateOnly.getTime() > 0 && clampStart < joinDateOnly) clampStart = new Date(joinDateOnly);

      let daysInThisMonth = 0;
      for (let curr = new Date(clampStart); curr <= clampEnd; curr.setDate(curr.getDate() + 1)) {
        const key = `${curr.getDate()}/${curr.getMonth() + 1}/${curr.getFullYear()}`;
        fullLeaveDates.add(key);
        daysInThisMonth++;
      }
      fullDayLeaves += daysInThisMonth;
    }
  });

  let sundayCount = 0;
  let holidayCount = 0;
  let workingDaysCount = 0;

  for (const dateStr of allDates) {
    const [d] = dateStr.split('/').map(Number);
    const currDate = new Date(year, month - 1, d);
    if (joinDateOnly.getTime() > 0 && currDate < joinDateOnly) continue;

    const dayName = getDayName(dateStr);
    if (holidaySet.has(dateStr)) {
      holidayCount++;
    } else if (weeklyOffSetting.includes(dayName)) {
      if (!isOfficialSiteWorker) sundayCount++;
      else workingDaysCount++;
    } else {
      workingDaysCount++;
    }
  }

  let totalWorkedMinutes = 0;
  let totalCheckins = 0;
  let sundayWorked = 0;
  let weekdayCheckins = 0;
  let lateCount = 0;
  let halfDayCount = 0;
  let ignoredLateCount = 0;
  let hdLeaveWithAttendance = 0;
  const lateDates = [];
  const halfDayDates = [];

  const today = new Date();
  const todayDate = today.getDate();
  const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();
  let holidaysWorked = 0;

  for (const dateStr of allDates) {
    const [d] = dateStr.split('/').map(Number);
    const currDate = new Date(year, month - 1, d);
    if (joinDateOnly.getTime() > 0 && currDate < joinDateOnly) continue;
    if (isCurrentMonth && d > todayDate) continue;

    const dayName = getDayName(dateStr);
    const isWeeklyOff = weeklyOffSetting.includes(dayName);

    const att = attendanceRecords.find((a) => {
      const p = parseDateParts(a.date);
      return p && p.key === dateStr;
    });

    if (att && att.in_time) {
      totalCheckins++;
      
      if (holidaySet.has(dateStr)) holidaysWorked++;

      if (isOfficialSiteWorker) {
        weekdayCheckins++;
        if (isWeeklyOff) sundayWorked++;
      } else {
        if (isWeeklyOff) sundayWorked++;
        else weekdayCheckins++;
      }

      if (att.out_time) {
        totalWorkedMinutes += calculateWorkingMinutes(att.in_time, att.out_time);
      }

      const inMinutes = parseTimeToMinutes(att.in_time);
      const isHalfDayFromTime = inMinutes !== null && inMinutes >= 720;
      const isLateFromTime = inMinutes !== null && inMinutes > 585;

      const status = getAttendanceStatus(att.in_time, att.out_time);
      const isHalfDayDay = isHalfDayFromTime || att.is_half_day === true || status.is_half_day === true || att.daily_status === 'half-day';
      const isLateDay = !isHalfDayDay && (isLateFromTime || att.is_late === true || status.is_late === true || att.daily_status === 'late');

      const isHalfDayLeaveDay = halfDayLeaveDates.has(dateStr);
      const isFullLeaveDay = fullLeaveDates.has(dateStr);

      if (isHalfDayLeaveDay) hdLeaveWithAttendance++;

      if (!isOfficialSiteWorker) {
        if (d >= lateStartDay) {
          if (!isHalfDayLeaveDay && !isFullLeaveDay) {
            if (isHalfDayDay && !isWeeklyOff) {
              halfDayCount++;
              halfDayDates.push(dateStr);
            } else if (isLateDay) {
              lateCount++;
              lateDates.push(dateStr);
            }
          }
        } else if (isLateDay || isHalfDayDay) {
          ignoredLateCount++;
        }
      }
    }
  }

  let presentDays = 0;
  if (isFSR) {
    const totalActualCheckins = weekdayCheckins + sundayWorked;
    presentDays = Math.max(0, totalActualCheckins - (halfDayCount * 0.5) - (hdLeaveWithAttendance * 0.5));
  } else {
    presentDays = Math.max(0, weekdayCheckins - (halfDayCount * 0.5) - (hdLeaveWithAttendance * 0.5));
  }

  const halfDayValue = halfDayCount * 0.5;
  const lateLeaveDeduction = calculateLateLeaveDeduction(lateCount);
  const creditedThisMonth = getFreeLeavesForMonth(employee, month, year, maxLeaves);

  // ====================== FIXED LEAVE BALANCE LOGIC ======================
  const leaveBalance = await LeaveBalance.findOne({ emp_id: employee._id });
  let openingBalance = 0;
  let effectiveCredited = creditedThisMonth;

  if (leaveBalance) {
    const entry = leaveBalance.history?.find(
      (h) => Number(h.month) === Number(month) && Number(h.year) === Number(year)
    );

    if (entry) {
      openingBalance = Number(entry.opening_balance || 0);
      effectiveCredited =
        entry.credited !== undefined && entry.credited !== null
          ? Number(entry.credited)
          : creditedThisMonth;
    } else {
      // History entry nahi mila → previous month ka closing use karo
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;

      const prevEntry = leaveBalance.history?.find(
        (h) => Number(h.month) === prevMonth && Number(h.year) === prevYear
      );

      if (prevEntry) {
        openingBalance = Number(prevEntry.closing_balance || 0);
      } else {
        openingBalance = 0;
      }
    }
  }

  const totalAvailable = openingBalance + effectiveCredited;
  // ======================================================================

  // Fixed HD deduction (no double counting)
  const totalHalfDaysCount = halfDayCount + halfDayLeaves;
  const halfDayDeduction = totalHalfDaysCount * 0.5;
  
  const totalLeavesDays = fullDayLeaves + halfDayLeaves * 0.5;
  const totalNeeded = totalLeavesDays + lateLeaveDeduction + (halfDayCount * 0.5);
  
  const paidLeaves = Math.min(totalNeeded, totalAvailable);
  const unpaidLeaves = Math.max(0, totalNeeded - totalAvailable);
  const carryForward = Math.max(0, totalAvailable - paidLeaves);

  let weeklyOffPaid = 0;
  let holidaysPaid = 0;
  let sundayBonus = 0;
  
  if (isFSR) {
    weeklyOffPaid = sundayCount;
    sundayBonus = 0; 
    holidaysPaid = Math.max(0, holidayCount - holidaysWorked); 
  } else if (isOfficialSiteWorker) {
    weeklyOffPaid = 0;
    holidaysPaid = 0;
    sundayBonus = 0;
  } else {
    weeklyOffPaid = sundayCount;
    holidaysPaid = holidayCount;
    sundayBonus = sundayWorked;
  }
  
  const finalPayableDaysRaw = presentDays + sundayBonus + weeklyOffPaid + holidaysPaid + paidLeaves - lateLeaveDeduction;
  const finalPayableDays = Math.min(Math.max(0, finalPayableDaysRaw), totalDaysInMonth);

  const perDayRate = totalDaysInMonth > 0 ? monthlySalary / totalDaysInMonth : 0;
  let progressPercent = totalDaysInMonth > 0 ? (finalPayableDays / totalDaysInMonth) * 100 : 0;
  progressPercent = Math.min(progressPercent, 100);

  const earned = Math.min(Math.round(perDayRate * finalPayableDays), monthlySalary);
  const cut = Math.max(0, monthlySalary - earned);

  let absentDays = 0;
  for (const dateStr of allDates) {
    const [d] = dateStr.split('/').map(Number);
    const currDate = new Date(year, month - 1, d);
    if (joinDateOnly.getTime() > 0 && currDate < joinDateOnly) continue;
    if (isCurrentMonth && d > todayDate) continue;

    const dayName = getDayName(dateStr);
    if (holidaySet.has(dateStr)) continue;
    if (!isOfficialSiteWorker && weeklyOffSetting.includes(dayName)) continue;

    const att = attendanceRecords.find((a) => {
      const p = parseDateParts(a.date);
      return p && p.key === dateStr;
    });
    const hasAttendance = att && att.in_time;
    const isLeave = fullLeaveDates.has(dateStr) || halfDayLeaveDates.has(dateStr);

    if (!hasAttendance && !isLeave) absentDays++;
  }

  return {
    emp_id: employee._id,
    emp_code: employee.emp_code,
    name: employee.name,
    department: employee.department,
    designation: employee.designation,
    worker_type: employee.worker_type, 
    is_fsr: isFSR, 
    monthly_salary: monthlySalary,
    total_working_days: totalDaysInMonth,
    actual_working_days: workingDaysCount,
    total_present: presentDays, 
    holidays_worked: holidaysWorked,
    total_checkins: totalCheckins,
    weekday_checkins: weekdayCheckins,
    total_absent: absentDays,
    absent_days: absentDays,
    late_count: lateCount,
    ignored_late_count: ignoredLateCount,
    late_leave_deduction: lateLeaveDeduction,
    late_dates: lateDates,
    half_day_count: halfDayCount,
    half_day_value: halfDayValue, 
    half_day_deduction: halfDayDeduction,
    half_day_dates: halfDayDates,
    half_day_leave_count: halfDayLeaves,
    full_day_leaves: fullDayLeaves,
    total_leave_approved: totalLeavesDays,
    leave_opening_balance: openingBalance,
    leave_credited: effectiveCredited,
    leave_available: totalAvailable,
    paid_leave_days: paidLeaves,
    unpaid_leave_days: unpaidLeaves,
    leave_closing_balance: carryForward,
    final_payable_days: finalPayableDays,
    sunday_worked: sundayWorked,
    sunday_count: sundayCount,
    weekly_off_paid: weeklyOffPaid,
    holiday_count: holidayCount,
    holiday_paid: holidaysPaid,
    total_days_in_month: totalDaysInMonth,
    per_day_rate: parseFloat(perDayRate.toFixed(2)),
    progress_percent: parseFloat(progressPercent.toFixed(2)),
    earned_salary: earned,
    total_deduction: cut,
    net_payable: earned,
    worked_hours: formatHours(totalWorkedMinutes),
    worked_minutes: totalWorkedMinutes,
    is_site_worker: isOfficialSiteWorker,
    late_start_day: lateStartDay,
    ignored_absent_count: 0,
    compensatory_offs: 0,
    present_days: presentDays,
    days_based: {
      progress_percent: parseFloat(progressPercent.toFixed(2)),
      earned,
      deduction: cut,
      net_payable: earned,
      payable_days: finalPayableDays,
      per_day_rate: parseFloat(perDayRate.toFixed(2)),
    },
    hours_based: {
      progress_percent: parseFloat(progressPercent.toFixed(2)),
      earned,
      deduction: cut,
      net_payable: earned,
    },
    total_earned_days: earned,
    total_deduction_days: cut,
  };
};

const getCompanyPayroll = async (req, res) => {
  try {
    const { company_id, department, month, year } = req.query;
    if (!company_id) return res.status(400).json({ success: false, message: 'company_id required' });

    const currentMonth = parseInt(month, 10) || new Date().getMonth() + 1;
    const currentYear = parseInt(year, 10) || new Date().getFullYear();

    const company = await Company.findById(company_id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const settings = await MonthlySettings.findOne({ company_id, month: currentMonth, year: currentYear });

    const filter = { company_id, status: 'approved', role: { $ne: 'super_admin' } };
    if (department && department !== 'all') filter.department = department;

    const employees = await Employee.find(filter).sort({ name: 1 });

    if (employees.length === 0) {
      return res.json({
        success: true,
        data: {
          company: { name: company.name, code: company.code, address: company.address },
          month: currentMonth, year: currentYear,
          month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }),
          employees: [], summary: { total_employees: 0 },
        },
      });
    }

    const payrollData = [];
    for (const emp of employees) {
      const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
      if (payroll) payrollData.push(payroll);
    }

    const anyBalance = await LeaveBalance.findOne({
      emp_id: { $in: employees.map((e) => e._id) },
      'history.payroll_finalized': true,
      'history.month': currentMonth, 'history.year': currentYear,
    });
    const isFinalized = !!anyBalance;
    
    const summary = {
      total_employees: payrollData.length,
      total_monthly_salary: payrollData.reduce((s, p) => s + p.monthly_salary, 0),
      total_checkins: payrollData.reduce((s, p) => s + (p.total_checkins || 0), 0),
      total_wo: payrollData.reduce((s, p) => s + (p.weekly_off_paid || 0), 0),
      total_holiday: payrollData.reduce((s, p) => s + (p.holiday_paid || 0), 0),
      total_late: payrollData.reduce((s, p) => s + (p.late_count || 0), 0),
      total_late_deduction: payrollData.reduce((s, p) => s + (p.late_leave_deduction || 0), 0),
      total_half_day: payrollData.reduce((s, p) => s + ((p.half_day_count || 0) + (p.half_day_leave_count || 0)), 0),
      total_hd_deduction: payrollData.reduce((s, p) => s + (p.half_day_deduction || 0), 0),
      total_leaves: payrollData.reduce((s, p) => s + (p.full_day_leaves || 0), 0),
      total_paid_leaves: payrollData.reduce((s, p) => s + (p.paid_leave_days || 0), 0),
      total_carry_forward: payrollData.reduce((s, p) => s + (p.leave_closing_balance || 0), 0),
      total_earned: payrollData.reduce((s, p) => s + p.earned_salary, 0),
      total_deduction: payrollData.reduce((s, p) => s + p.total_deduction, 0),
      total_net_payable: payrollData.reduce((s, p) => s + p.net_payable, 0),
    };
    
    return res.json({
      success: true,
      data: {
        company: { _id: company._id, name: company.name, code: company.code, address: company.address },
        month: currentMonth, year: currentYear,
        month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }),
        department: department || 'all',
        is_finalized: isFinalized,
        settings: {
          daily_hours: settings?.daily_hours || 8,
          holidays_count: (settings?.holidays || []).length,
          weekly_off: settings?.weekly_off || ['Sunday'],
          free_paid_leaves_office: FREE_LEAVES_OFFICE,
          free_paid_leaves_site_rcc: FREE_LEAVES_SITE_RCC,
          late_start_day: getLateStartDay(currentMonth, currentYear),
        },
        employees: payrollData,
        summary,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const finalizePayroll = async (req, res) => {
  try {
    const { company_id, month, year, department } = req.body;
    if (!company_id || !month || !year) return res.status(400).json({ success: false, message: 'company_id, month, year required' });

    const currentMonth = parseInt(month, 10);
    const currentYear = parseInt(year, 10);

    const company = await Company.findById(company_id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const settings = await MonthlySettings.findOne({ company_id, month: currentMonth, year: currentYear });

    const filter = { company_id, status: 'approved', role: { $ne: 'super_admin' } };
    if (department && department !== 'all') filter.department = department;

    const employees = await Employee.find(filter);
    if (employees.length === 0) return res.status(404).json({ success: false, message: 'No employees found' });

    let recalculateAndFixLeaveBalance = null;
    try { 
      recalculateAndFixLeaveBalance = require('./leaveBalanceController').recalculateAndFixLeaveBalance; 
    } catch (e) {}

    const results = [];
    let alreadyFinalizedCount = 0;
    let processedCount = 0;

    for (const emp of employees) {
      const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);
      if (!payroll) continue;

      const creditedThisMonth = payroll.leave_credited || 0;
      let balance = await LeaveBalance.findOne({ emp_id: emp._id });

      if (!balance) {
        balance = await LeaveBalance.create({
          emp_id: emp._id, emp_code: emp.emp_code, name: emp.name, company_id: emp.company_id,
          current_balance: 0, total_credited: 0, total_used: 0, history: [],
        });
      }

      let monthEntry = balance.history.find((h) => Number(h.month) === currentMonth && Number(h.year) === currentYear);

      if (!monthEntry) {
        balance.history.push({
          month: currentMonth, year: currentYear, 
          opening_balance: balance.current_balance || 0,
          credited: creditedThisMonth, used: 0, 
          closing_balance: balance.current_balance || 0, 
          leaves_log: [],
        });
        monthEntry = balance.history[balance.history.length - 1];
      }

      if (monthEntry.payroll_finalized) {
        alreadyFinalizedCount++;
        results.push({ 
          name: emp.name, emp_code: emp.emp_code, 
          status: 'already_finalized', balance: balance.current_balance 
        });
        continue;
      }

      monthEntry.credited = creditedThisMonth;
      monthEntry.leaves_log = (monthEntry.leaves_log || []).filter(
        (l) => !(l.is_payroll_deduction || l.from_date === 'PAYROLL' || l.from_date === 'LATE_CUT' || l.from_date === 'HALFDAY_CUT')
      );

      const fullLeaveDays = Number(payroll.full_day_leaves || 0) + Number(payroll.half_day_leave_count || 0) * 0.5;
      const lateCutDays = Number(payroll.late_leave_deduction || 0);
      const hdCutDays = Number(payroll.half_day_deduction || 0);
      const paidLeaveDays = Number(payroll.paid_leave_days || 0);

      if (fullLeaveDays > 0) {
        monthEntry.leaves_log.push({
          leave_id: null, from_date: 'LEAVE', to_date: 'LEAVE', 
          applied_days: fullLeaveDays, approved_days: fullLeaveDays,
          paid_days: Math.min(fullLeaveDays, paidLeaveDays), 
          unpaid_days: Math.max(0, fullLeaveDays - paidLeaveDays),
          approved_on: new Date(), is_payroll_deduction: true, 
          deduction_type: 'approved_leave', note: 'Approved leave days used in payroll',
        });
      }

      if (lateCutDays > 0) {
        monthEntry.leaves_log.push({
          leave_id: null, from_date: 'LATE_CUT', to_date: 'LATE_CUT', 
          applied_days: lateCutDays, approved_days: lateCutDays,
          paid_days: lateCutDays, unpaid_days: 0, approved_on: new Date(), 
          is_payroll_deduction: true, deduction_type: 'late_cut',
          late_count: payroll.late_count || 0, 
          note: `Late cut: ${payroll.late_count || 0} late → ${lateCutDays} day(s) leave deducted`,
        });
      }

      if (hdCutDays > 0) {
        monthEntry.leaves_log.push({
          leave_id: null, from_date: 'HALFDAY_CUT', to_date: 'HALFDAY_CUT', 
          applied_days: hdCutDays, approved_days: hdCutDays,
          paid_days: hdCutDays, unpaid_days: 0, approved_on: new Date(), 
          is_payroll_deduction: true, deduction_type: 'halfday_cut',
          half_day_count: payroll.half_day_count || 0, 
          note: `Half-day attendance cut: ${payroll.half_day_count || 0} HD → ${hdCutDays} day(s)`,
        });
      }

      monthEntry.used = paidLeaveDays;
      monthEntry.late_cut_days = lateCutDays;
      monthEntry.halfday_cut_days = hdCutDays;
      monthEntry.approved_leave_days = fullLeaveDays;
      monthEntry.payroll_finalized = true;
      monthEntry.finalized_on = new Date();
      monthEntry.finalized_by = req.employee?.name || 'System';

      if (typeof recalculateAndFixLeaveBalance === 'function') {
        await recalculateAndFixLeaveBalance(balance);
      } else {
        const before = Number(balance.current_balance || 0);
        balance.current_balance = Math.max(0, before + creditedThisMonth - paidLeaveDays);
        balance.total_credited = Number(balance.total_credited || 0) + creditedThisMonth;
        balance.total_used = Number(balance.total_used || 0) + paidLeaveDays;
        monthEntry.closing_balance = balance.current_balance;
        await balance.save();
      }

      processedCount++;
      results.push({ 
        name: emp.name, emp_code: emp.emp_code, 
        status: 'finalized', 
        paid_leave_days: paidLeaveDays, 
        late_cut: lateCutDays, 
        halfday_cut: hdCutDays, 
        balance_after: balance.current_balance 
      });
    }

    return res.json({ 
      success: true, 
      message: `Payroll finalized! ${processedCount} processed, ${alreadyFinalizedCount} already finalized`, 
      data: { 
        month: currentMonth, year: currentYear, 
        total_employees: employees.length, 
        processed: processedCount, 
        already_finalized: alreadyFinalizedCount, 
        results 
      } 
    });
  } catch (error) { 
    return res.status(500).json({ success: false, message: 'Finalize failed', error: error.message }); 
  }
};

const getCompanyDepartments = async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ success: false, message: 'company_id required' });
    const departments = await Employee.distinct('department', { company_id, status: 'approved' });
    return res.json({ success: true, data: departments.filter((d) => d && d.trim() !== '') });
  } catch (error) { 
    return res.status(500).json({ success: false, message: 'Server error', error: error.message }); 
  }
};

const getMySalary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const employee = req.employee;
    if (!employee) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const currentMonth = parseInt(month, 10) || new Date().getMonth() + 1;
    const currentYear = parseInt(year, 10) || new Date().getFullYear();

    const settings = await MonthlySettings.findOne({ 
      company_id: employee.company_id, 
      month: currentMonth, 
      year: currentYear 
    });

    const fullEmployee = await Employee.findById(employee._id).populate('company_id');
    if (!fullEmployee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const payroll = await calculateEmployeePayroll(fullEmployee, currentMonth, currentYear, settings);

    if (!payroll) {
      return res.json({ 
        success: true, 
        data: { 
          company: { name: fullEmployee.company_id?.name, code: fullEmployee.company_id?.code }, 
          month: currentMonth, year: currentYear, 
          month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }), 
          is_finalized: false, 
          payroll: null, 
          message: "You haven't joined yet for this payroll period." 
        } 
      });
    }

    const balance = await LeaveBalance.findOne({ emp_id: employee._id });
    let isFinalized = false;
    if (balance) {
      const entry = balance.history?.find(
        (h) => Number(h.month) === currentMonth && Number(h.year) === currentYear
      );
      isFinalized = entry?.payroll_finalized || false;
    }

    return res.json({ 
      success: true, 
      data: { 
        company: { name: fullEmployee.company_id?.name, code: fullEmployee.company_id?.code }, 
        month: currentMonth, year: currentYear, 
        month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }), 
        is_finalized: isFinalized, 
        payroll 
      } 
    });
  } catch (error) { 
    return res.status(500).json({ success: false, message: 'Server error', error: error.message }); 
  }
};

module.exports = {
  getCompanyPayroll,
  getCompanyDepartments,
  calculateEmployeePayroll,
  finalizePayroll,
  getMySalary,
};