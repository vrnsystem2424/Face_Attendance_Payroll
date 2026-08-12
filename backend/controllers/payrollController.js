
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

const FREE_LEAVES_PER_MONTH = 1;

const getLateStartDay = (month, year) => {
  if (month === 7 && year === 2026) return 6;
  return 1;
};

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
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(y, m-1, d).getDay()];
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

const normalizeDate = (dateStr) => {
  const [d, m, y] = dateStr.split('/').map(Number);
  return `${d}/${m}/${y}`;
};

// ════════════════════════════════════════════
// 🎯 PAYROLL CALCULATION - TOTAL DAYS BASED
// ════════════════════════════════════════════
const calculateEmployeePayroll = async (employee, month, year, settings) => {
  const monthlySalary = employee.monthly_salary || 0;
  const holidays = settings?.holidays || [];
  const weeklyOffSetting = settings?.weekly_off || ['Sunday'];
  const lateStartDay = getLateStartDay(month, year);
  const allDates = getDatesInMonth(month, year);
  const holidaySet = new Set(holidays.map(h => h.date));

  const totalDaysInMonth = new Date(year, month, 0).getDate();

  const attendanceRecords = await Attendance.find({ emp_id: employee._id, date: { $in: allDates } });
  const allLeaves = await Leave.find({ emp_id: employee._id, status: 'approved' });

  const monthLeaves = allLeaves.filter(l => {
    const [d, m, y] = l.from_date.split('/').map(Number);
    return m === month && y === year;
  });

  // LEAVES
  let fullDayLeaves = 0;
  let halfDayLeaves = 0;

  monthLeaves.forEach(l => {
    if (l.is_half_day) halfDayLeaves += 1;
    else fullDayLeaves += (l.leave_days || l.approved_days || 1);
  });

  // Approved leave dates
  const halfDayLeaveDates = new Set();
  const fullLeaveDates = new Set();
  
  monthLeaves.forEach(l => {
    if (l.is_half_day) {
      halfDayLeaveDates.add(normalizeDate(l.from_date));
    } else {
      const [fd, fm, fy] = l.from_date.split('/').map(Number);
      const [td, tm, ty] = l.to_date.split('/').map(Number);
      const startDate = new Date(fy, fm - 1, fd);
      const endDate = new Date(ty, tm - 1, td);
      
      for (let curr = new Date(startDate); curr <= endDate; curr.setDate(curr.getDate() + 1)) {
        const key = `${curr.getDate()}/${curr.getMonth() + 1}/${curr.getFullYear()}`;
        fullLeaveDates.add(key);
      }
    }
  });

  // Count Sundays, Holidays, Working Days
  let sundayCount = 0, holidayCount = 0, workingDaysCount = 0;
  for (const dateStr of allDates) {
    const dayName = getDayName(dateStr);
    if (holidaySet.has(dateStr)) holidayCount++;
    else if (weeklyOffSetting.includes(dayName)) sundayCount++;
    else workingDaysCount++;
  }

  // ════════════════════════════════════════
  // ATTENDANCE
  // ════════════════════════════════════════
  let totalWorkedMinutes = 0, totalCheckins = 0, sundayWorked = 0;
  let weekdayCheckins = 0;
  let lateCount = 0, halfDayCount = 0, ignoredLateCount = 0;
  let hdLeaveWithAttendance = 0;
  const lateDates = [], halfDayDates = [];
  const today = new Date();
  const todayDate = today.getDate();
  const isCurrentMonth = (month === today.getMonth() + 1 && year === today.getFullYear());

  for (const dateStr of allDates) {
    const [d] = dateStr.split('/').map(Number);
    const dayName = getDayName(dateStr);
    if (isCurrentMonth && d > todayDate) continue;

    const att = attendanceRecords.find(a => a.date === dateStr);
    if (att && att.in_time) {
      totalCheckins++;
      const isSunday = weeklyOffSetting.includes(dayName);
      
      if (isSunday) {
        sundayWorked++;
      } else {
        weekdayCheckins++;
      }
      
      if (att.out_time) totalWorkedMinutes += calculateWorkingMinutes(att.in_time, att.out_time);

      const wasOnSite = att.in_location_status === 'on-site';
      const status = getAttendanceStatus(att.in_time, att.out_time);
      
      const normalizedDate = normalizeDate(dateStr);
      const isHalfDayLeaveDay = halfDayLeaveDates.has(normalizedDate);
      const isFullLeaveDay = fullLeaveDates.has(normalizedDate);
      
      if (isHalfDayLeaveDay) hdLeaveWithAttendance++;
      
      if (d >= lateStartDay) {
        if (wasOnSite) {
          if (isHalfDayLeaveDay || isFullLeaveDay) {
            // Skip - leave day
          } else if (!isSunday) {
            if (status.is_late) { lateCount++; lateDates.push(dateStr); }
            if (status.is_half_day) { halfDayCount++; halfDayDates.push(dateStr); }
          }
        }
      } else {
        if (status.is_late || status.is_half_day) ignoredLateCount++;
      }
    }
  }

  // ════════════════════════════════════════
  // 🎯 PRESENT CALCULATION (Weekdays only)
  // ════════════════════════════════════════
  const presentDays = Math.max(0, weekdayCheckins - halfDayCount - hdLeaveWithAttendance + (hdLeaveWithAttendance * 0.5));
  const halfDayValue = halfDayCount * 0.5;
  const lateLeaveDeduction = calculateLateLeaveDeduction(lateCount);

  // Leave balance
  const leaveBalance = await LeaveBalance.findOne({ emp_id: employee._id });
  let openingBalance = 0, creditedThisMonth = FREE_LEAVES_PER_MONTH;
  if (leaveBalance) {
    const entry = leaveBalance.history?.find(h => Number(h.month) === Number(month) && Number(h.year) === Number(year));
    if (entry) {
      openingBalance = entry.opening_balance || 0;
      creditedThisMonth = entry.credited || FREE_LEAVES_PER_MONTH;
    } else {
      openingBalance = leaveBalance.current_balance || 0;
    }
  }
  const totalAvailable = openingBalance + creditedThisMonth;

  // HD + Late + Leave balance se paid
  const halfDayDeduction = halfDayCount * 0.5;
  const totalLeavesDays = fullDayLeaves + (halfDayLeaves * 0.5);
  const totalNeeded = totalLeavesDays + lateLeaveDeduction + halfDayDeduction;
  const paidLeaves = Math.min(totalNeeded, totalAvailable);
  const unpaidLeaves = Math.max(0, totalNeeded - totalAvailable);
  const carryForward = Math.max(0, totalAvailable - paidLeaves);

  // 🆕 Weekly Off = Full sundayCount (always paid)
  const weeklyOffPaid = sundayCount;
  const holidaysPaid = holidayCount;

  // ════════════════════════════════════════
  // 🎯 FINAL DAYS
  // = Present + Sunday Worked + Weekly Off + Holidays + HD + Paid Leaves - Late
  // (Absent/Unpaid automatically excluded - they're not in present count)
  // ════════════════════════════════════════
  const finalPayableDaysRaw = presentDays + sundayWorked + weeklyOffPaid + holidaysPaid + halfDayValue + paidLeaves - lateLeaveDeduction;
  const finalPayableDays = Math.min(Math.max(0, finalPayableDaysRaw), totalDaysInMonth);

  // Salary
  const perDayRate = totalDaysInMonth > 0 ? (monthlySalary / totalDaysInMonth) : 0;
  let progressPercent = totalDaysInMonth > 0 ? (finalPayableDays / totalDaysInMonth) * 100 : 0;
  progressPercent = Math.min(progressPercent, 100);
  const earned = Math.min(Math.round(perDayRate * finalPayableDays), monthlySalary);
  const cut = Math.max(0, monthlySalary - earned);

  // Absent (weekday, no attendance, no leave)
  let absentDays = 0;
  for (const dateStr of allDates) {
    const [d] = dateStr.split('/').map(Number);
    const dayName = getDayName(dateStr);
    if (isCurrentMonth && d > todayDate) continue;
    if (holidaySet.has(dateStr)) continue;
    if (weeklyOffSetting.includes(dayName)) continue;
    
    const normalizedDate = normalizeDate(dateStr);
    const att = attendanceRecords.find(a => a.date === dateStr);
    const hasAttendance = att && att.in_time;
    const isLeave = fullLeaveDates.has(normalizedDate) || halfDayLeaveDates.has(normalizedDate);
    
    if (!hasAttendance && !isLeave) absentDays++;
  }

  console.log(`\n📊 ${employee.name} (${employee.emp_code}):`);
  console.log(`   📅 Total: ${totalDaysInMonth} | Working: ${workingDaysCount} | Sundays: ${sundayCount} | Holidays: ${holidayCount}`);
  console.log(`   👤 Weekday Present: ${presentDays} | Sunday Worked: ${sundayWorked} (bonus) | Absent: ${absentDays}`);
  console.log(`   ☀️  Weekly Off: ${weeklyOffPaid} | Holiday Paid: ${holidaysPaid}`);
  console.log(`   ⏰ Late: ${lateCount}(-${lateLeaveDeduction}d) | HD: ${halfDayCount}(-${halfDayDeduction}d)`);
  console.log(`   📋 Leaves: ${fullDayLeaves}F + ${halfDayLeaves}HD = ${totalLeavesDays}d | Paid: ${paidLeaves} | Unpaid: ${unpaidLeaves}`);
  console.log(`   💰 Balance: ${totalAvailable} | Carry: ${carryForward}`);
  console.log(`   💵 Per Day: ₹${perDayRate.toFixed(2)}`);
  console.log(`   🎯 Final: ${presentDays}+${sundayWorked}+${weeklyOffPaid}+${holidaysPaid}+${halfDayValue}+${paidLeaves}-${lateLeaveDeduction} = ${finalPayableDays}/${totalDaysInMonth}`);
  console.log(`   💵 Earned: ₹${earned} | Cut: ₹${cut}`);

  return {
    emp_id: employee._id,
    emp_code: employee.emp_code,
    name: employee.name,
    department: employee.department,
    designation: employee.designation,
    monthly_salary: monthlySalary,
    total_working_days: totalDaysInMonth,
    actual_working_days: workingDaysCount,
    total_present: presentDays,
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
    leave_credited: creditedThisMonth,
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
    is_site_worker: false,
    late_start_day: lateStartDay,
    ignored_absent_count: 0,
    compensatory_offs: 0,
    present_days: presentDays,
    days_based: { progress_percent: parseFloat(progressPercent.toFixed(2)), earned, deduction: cut, net_payable: earned, payable_days: finalPayableDays, per_day_rate: parseFloat(perDayRate.toFixed(2)) },
    hours_based: { progress_percent: parseFloat(progressPercent.toFixed(2)), earned, deduction: cut, net_payable: earned },
    total_earned_days: earned,
    total_deduction_days: cut,
  };
};

// ════════════════════════════════════════════
// GET COMPANY PAYROLL
// ════════════════════════════════════════════
const getCompanyPayroll = async (req, res) => {
  try {
    const { company_id, department, month, year } = req.query;
    if (!company_id) return res.status(400).json({ success: false, message: 'company_id required' });

    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();
    const company = await Company.findById(company_id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const settings = await MonthlySettings.findOne({ company_id, month: currentMonth, year: currentYear });

    console.log(`\n📊 PAYROLL: ${company.name} - ${currentMonth}/${currentYear}\n`);

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
          employees: [], summary: { total_employees: 0 }
        }
      });
    }

    const payrollData = [];
    for (const emp of employees) {
      payrollData.push(await calculateEmployeePayroll(emp, currentMonth, currentYear, settings));
    }

    const anyBalance = await LeaveBalance.findOne({ 
      emp_id: { $in: employees.map(e => e._id) },
      'history.payroll_finalized': true,
      'history.month': currentMonth,
      'history.year': currentYear
    });
    const isFinalized = !!anyBalance;

    const summary = {
      total_employees: payrollData.length,
      total_monthly_salary: payrollData.reduce((s, p) => s + p.monthly_salary, 0),
      total_present: payrollData.reduce((s, p) => s + p.total_present, 0),
      total_absent: payrollData.reduce((s, p) => s + (p.total_absent || 0), 0),
      total_late: payrollData.reduce((s, p) => s + (p.late_count || 0), 0),
      total_half_day: payrollData.reduce((s, p) => s + (p.half_day_count || 0), 0),
      total_leaves: payrollData.reduce((s, p) => s + (p.full_day_leaves || 0), 0),
      total_paid_leaves: payrollData.reduce((s, p) => s + (p.paid_leave_days || 0), 0),
      total_unpaid_leaves: payrollData.reduce((s, p) => s + (p.unpaid_leave_days || 0), 0),
      total_earned: payrollData.reduce((s, p) => s + p.earned_salary, 0),
      total_deduction: payrollData.reduce((s, p) => s + p.total_deduction, 0),
      total_net_payable: payrollData.reduce((s, p) => s + p.net_payable, 0),
      total_carry_forward: payrollData.reduce((s, p) => s + (p.leave_closing_balance || 0), 0),
      total_sunday_worked: payrollData.reduce((s, p) => s + (p.sunday_worked || 0), 0),
      total_earned_days: payrollData.reduce((s, p) => s + p.earned_salary, 0),
      total_deduction_days: payrollData.reduce((s, p) => s + p.total_deduction, 0),
      total_earned_hours: payrollData.reduce((s, p) => s + p.earned_salary, 0),
      total_deduction_hours: payrollData.reduce((s, p) => s + p.total_deduction, 0),
    };

    console.log(`\n✅ ${summary.total_employees} emps | Earned: ₹${summary.total_earned} | Cut: ₹${summary.total_deduction}\n`);

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
          free_paid_leaves: FREE_LEAVES_PER_MONTH,
          late_start_day: getLateStartDay(currentMonth, currentYear),
        },
        employees: payrollData,
        summary,
      },
    });
  } catch (error) {
    console.error('getCompanyPayroll error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════════
// FINALIZE PAYROLL
// ════════════════════════════════════════════
const finalizePayroll = async (req, res) => {
  try {
    const { company_id, month, year, department } = req.body;

    if (!company_id || !month || !year) {
      return res.status(400).json({ success: false, message: 'company_id, month, year required' });
    }

    const currentMonth = parseInt(month);
    const currentYear = parseInt(year);

    const company = await Company.findById(company_id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const settings = await MonthlySettings.findOne({ company_id, month: currentMonth, year: currentYear });

    const filter = { company_id, status: 'approved', role: { $ne: 'super_admin' } };
    if (department && department !== 'all') filter.department = department;

    const employees = await Employee.find(filter);
    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'No employees found' });
    }

    const results = [];
    let alreadyFinalizedCount = 0;
    let processedCount = 0;

    for (const emp of employees) {
      const payroll = await calculateEmployeePayroll(emp, currentMonth, currentYear, settings);

      let balance = await LeaveBalance.findOne({ emp_id: emp._id });
      if (!balance) {
        balance = await LeaveBalance.create({
          emp_id: emp._id,
          emp_code: emp.emp_code,
          name: emp.name,
          company_id: emp.company_id,
          current_balance: 0,
          total_credited: 0,
          total_used: 0,
          history: [],
        });
      }

      let monthEntry = balance.history.find(
        h => Number(h.month) === currentMonth && Number(h.year) === currentYear
      );

      if (!monthEntry) {
        balance.history.push({
          month: currentMonth,
          year: currentYear,
          opening_balance: balance.current_balance,
          credited: FREE_LEAVES_PER_MONTH,
          used: 0,
          closing_balance: balance.current_balance + FREE_LEAVES_PER_MONTH,
          leaves_log: [],
        });
        balance.current_balance += FREE_LEAVES_PER_MONTH;
        balance.total_credited += FREE_LEAVES_PER_MONTH;
        monthEntry = balance.history[balance.history.length - 1];
      }

      if (monthEntry.payroll_finalized) {
        alreadyFinalizedCount++;
        results.push({
          name: emp.name,
          emp_code: emp.emp_code,
          status: 'already_finalized',
          balance: balance.current_balance,
        });
        continue;
      }

      const totalDeductFromBalance = payroll.paid_leave_days || 0;

      if (totalDeductFromBalance > 0) {
        const beforeBalance = balance.current_balance;
        balance.current_balance = Math.max(0, balance.current_balance - totalDeductFromBalance);
        balance.total_used += totalDeductFromBalance;

        monthEntry.used += totalDeductFromBalance;
        monthEntry.closing_balance = balance.current_balance;

        monthEntry.leaves_log.push({
          leave_id: null,
          from_date: 'PAYROLL',
          to_date: 'PAYROLL',
          applied_days: 0,
          approved_days: totalDeductFromBalance,
          paid_days: totalDeductFromBalance,
          unpaid_days: 0,
          approved_on: new Date(),
          is_payroll_deduction: true,
          payroll_month: currentMonth,
          payroll_year: currentYear,
          hd_deducted: payroll.half_day_deduction || 0,
          late_deducted: payroll.late_leave_deduction || 0,
          full_leave_deducted: payroll.full_day_leaves || 0,
        });

        console.log(`✅ ${emp.name}: Cut ${totalDeductFromBalance} | ${beforeBalance} → ${balance.current_balance}`);
      }

      monthEntry.payroll_finalized = true;
      monthEntry.finalized_on = new Date();
      monthEntry.finalized_by = req.employee?.name || 'System';

      await balance.save();
      processedCount++;

      results.push({
        name: emp.name,
        emp_code: emp.emp_code,
        status: 'finalized',
        deducted: totalDeductFromBalance,
        balance_after: balance.current_balance,
      });
    }

    return res.json({
      success: true,
      message: `Payroll finalized! ${processedCount} processed, ${alreadyFinalizedCount} already finalized`,
      data: {
        month: currentMonth,
        year: currentYear,
        total_employees: employees.length,
        processed: processedCount,
        already_finalized: alreadyFinalizedCount,
        results,
      },
    });
  } catch (error) {
    console.error('finalizePayroll error:', error);
    return res.status(500).json({ success: false, message: 'Finalize failed', error: error.message });
  }
};

const getCompanyDepartments = async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ success: false, message: 'company_id required' });
    const departments = await Employee.distinct('department', { company_id, status: 'approved' });
    return res.json({ success: true, data: departments.filter(d => d && d.trim() !== '') });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};



// ════════════════════════════════════════════
// 🆕 GET MY SALARY (Employee's own payroll)
// ════════════════════════════════════════════
const getMySalary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const employee = req.employee;  // From auth middleware

    if (!employee) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();

    const settings = await MonthlySettings.findOne({
      company_id: employee.company_id,
      month: currentMonth,
      year: currentYear,
    });

    // Full employee data with company
    const fullEmployee = await Employee.findById(employee._id).populate('company_id');
    
    if (!fullEmployee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Calculate payroll
    const payroll = await calculateEmployeePayroll(fullEmployee, currentMonth, currentYear, settings);

    // Check if finalized
    const balance = await LeaveBalance.findOne({ emp_id: employee._id });
    let isFinalized = false;
    if (balance) {
      const entry = balance.history?.find(
        h => Number(h.month) === currentMonth && Number(h.year) === currentYear
      );
      isFinalized = entry?.payroll_finalized || false;
    }

    return res.json({
      success: true,
      data: {
        company: {
          name: fullEmployee.company_id?.name,
          code: fullEmployee.company_id?.code,
        },
        month: currentMonth,
        year: currentYear,
        month_name: new Date(currentYear, currentMonth - 1).toLocaleString('en-US', { month: 'long' }),
        is_finalized: isFinalized,
        payroll,
      },
    });
  } catch (error) {
    console.error('getMySalary error:', error);
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