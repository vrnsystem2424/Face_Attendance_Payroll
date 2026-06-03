// controllers/leaveBalanceController.js

const LeaveBalance = require('../models/LeaveBalance');
const Employee = require('../models/Employee');
const MonthlySettings = require('../models/MonthlySettings');

// ════════════════════════════════════════
// HELPER: Get/Create balance for employee
// ════════════════════════════════════════
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

// ════════════════════════════════════════
// HELPER: Credit monthly free leaves
// Called when fetching balance — auto credits
// ════════════════════════════════════════
const creditMonthlyLeaves = async (empId, currentMonth, currentYear) => {
  const balance = await getOrCreateBalance(empId);
  const employee = await Employee.findById(empId);

  if (!employee) return balance;

  // Get free leaves from monthly settings
  const settings = await MonthlySettings.findOne({
    company_id: employee.company_id,
    month: currentMonth,
    year: currentYear,
  });

  const freeLeaves = settings?.free_leaves || 2;

  // Check if already credited this month
  const alreadyCredited = balance.history.some(
    h => h.month === currentMonth && h.year === currentYear
  );

  if (alreadyCredited) return balance;

  // Check joining month — don't backfill old months
  const joinDate = new Date(employee.createdAt);
  const joinMonth = joinDate.getMonth() + 1;
  const joinYear = joinDate.getFullYear();

  // Don't credit for months before joining
  if (currentYear < joinYear || (currentYear === joinYear && currentMonth < joinMonth)) {
    return balance;
  }

  // Credit new month
  const opening = balance.current_balance;
  const closing = opening + freeLeaves;

  balance.history.push({
    month: currentMonth,
    year: currentYear,
    opening_balance: opening,
    credited: freeLeaves,
    used: 0,
    closing_balance: closing,
    leaves_log: [],
    credited_on: new Date(),
  });

  balance.current_balance = closing;
  balance.total_credited += freeLeaves;
  balance.last_credited_month = currentMonth;
  balance.last_credited_year = currentYear;

  await balance.save();
  return balance;
};

// ════════════════════════════════════════
// HELPER: Backfill missed months
// If employee was approved in Jan but no leaves added, this catches up
// ════════════════════════════════════════
const backfillBalance = async (empId) => {
  const employee = await Employee.findById(empId);
  if (!employee) return;

  const joinDate = new Date(employee.createdAt);
  let m = joinDate.getMonth() + 1;
  let y = joinDate.getFullYear();

  const today = new Date();
  const currentM = today.getMonth() + 1;
  const currentY = today.getFullYear();

  // Loop from joining month to current month
  while (y < currentY || (y === currentY && m <= currentM)) {
    await creditMonthlyLeaves(empId, m, y);
    m++;
    if (m > 12) { m = 1; y++; }
  }
};

// ════════════════════════════════════════
// GET MY BALANCE (Employee)
// ════════════════════════════════════════
const getMyBalance = async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Auto-credit (backfill if needed)
    await backfillBalance(req.employee._id);

    const balance = await LeaveBalance.findOne({ emp_id: req.employee._id });

    if (!balance) {
      return res.json({
        success: true,
        data: {
          current_balance: 0,
          total_credited: 0,
          total_used: 0,
          history: [],
        }
      });
    }

    // Find current month info
    const currentMonthData = balance.history.find(
      h => h.month === currentMonth && h.year === currentYear
    );

    res.json({
      success: true,
      data: {
        current_balance: balance.current_balance,
        total_credited: balance.total_credited,
        total_used: balance.total_used,

        current_month: {
          month: currentMonth,
          year: currentYear,
          opening_balance: currentMonthData?.opening_balance || 0,
          credited: currentMonthData?.credited || 0,
          used: currentMonthData?.used || 0,
          closing_balance: balance.current_balance,
        },

        history: balance.history.slice(-12),  // Last 12 months
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// GET EMPLOYEE BALANCE (Manager/Admin)
// ════════════════════════════════════════
const getEmployeeBalance = async (req, res) => {
  try {
    const { emp_id } = req.params;

    await backfillBalance(emp_id);
    const balance = await LeaveBalance.findOne({ emp_id }).populate('emp_id', 'name emp_code');

    if (!balance) {
      return res.json({
        success: true,
        data: { current_balance: 0, total_used: 0 }
      });
    }

    res.json({ success: true, data: balance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// DEDUCT FROM BALANCE (called when leave approved)
// ════════════════════════════════════════
const deductBalance = async (empId, leaveId, approvedDays, fromDate, toDate, appliedDays) => {
  const balance = await getOrCreateBalance(empId);
  await backfillBalance(empId);

  const updated = await LeaveBalance.findOne({ emp_id: empId });

  const balanceBefore = updated.current_balance;
  const paidDays = Math.min(approvedDays, balanceBefore);
  const unpaidDays = Math.max(0, approvedDays - balanceBefore);
  const balanceAfter = Math.max(0, balanceBefore - approvedDays);

  // Get current month entry
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let monthEntry = updated.history.find(
    h => h.month === currentMonth && h.year === currentYear
  );

  if (!monthEntry) {
    // Create entry if not exists
    monthEntry = {
      month: currentMonth,
      year: currentYear,
      opening_balance: balanceBefore,
      credited: 0,
      used: 0,
      closing_balance: balanceBefore,
      leaves_log: [],
    };
    updated.history.push(monthEntry);
    monthEntry = updated.history[updated.history.length - 1];
  }

  // Update month entry
  monthEntry.used += approvedDays;
  monthEntry.closing_balance = balanceAfter;
  monthEntry.leaves_log.push({
    leave_id: leaveId,
    from_date: fromDate,
    to_date: toDate,
    applied_days: appliedDays,
    approved_days: approvedDays,
    paid_days: paidDays,
    unpaid_days: unpaidDays,
    approved_on: new Date(),
  });

  // Update main balance
  updated.current_balance = balanceAfter;
  updated.total_used += approvedDays;

  await updated.save();

  return {
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    paid_days: paidDays,
    unpaid_days: unpaidDays,
  };
};

// ════════════════════════════════════════
// RESTORE BALANCE (if leave rejected after approval — admin override)
// ════════════════════════════════════════
const restoreBalance = async (empId, leaveId, approvedDays) => {
  const balance = await LeaveBalance.findOne({ emp_id: empId });
  if (!balance) return;

  // Add days back
  balance.current_balance += approvedDays;
  balance.total_used = Math.max(0, balance.total_used - approvedDays);

  // Update current month entry
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthEntry = balance.history.find(
    h => h.month === currentMonth && h.year === currentYear
  );

  if (monthEntry) {
    monthEntry.used = Math.max(0, monthEntry.used - approvedDays);
    monthEntry.closing_balance += approvedDays;
    monthEntry.leaves_log = monthEntry.leaves_log.filter(
      l => l.leave_id.toString() !== leaveId.toString()
    );
  }

  await balance.save();
};

// ════════════════════════════════════════
// MANUAL CREDIT (Admin can give bonus leaves)
// ════════════════════════════════════════
const manualCredit = async (req, res) => {
  try {
    const { emp_id, days, reason } = req.body;

    if (!emp_id || !days) {
      return res.status(400).json({ success: false, message: 'Employee and days required' });
    }

    const balance = await getOrCreateBalance(emp_id);
    balance.current_balance += parseFloat(days);
    balance.total_credited += parseFloat(days);

    // Add to current month history
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let monthEntry = balance.history.find(
      h => h.month === currentMonth && h.year === currentYear
    );

    if (monthEntry) {
      monthEntry.credited += parseFloat(days);
      monthEntry.closing_balance = balance.current_balance;
    }

    await balance.save();

    res.json({
      success: true,
      message: `${days} leaves credited`,
      data: balance,
    });
  } catch (err) {
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
};