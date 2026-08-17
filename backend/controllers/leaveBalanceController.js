




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
// 🆕 IMPROVED HELPER: Credit monthly free leaves
// - System launch: July 2026
// - Skip months BEFORE July 2026
// - Duplicate prevention (STRICT)
// - 1 leave per month
// ════════════════════════════════════════
const creditMonthlyLeaves = async (empId, currentMonth, currentYear) => {
  // 🎯 SYSTEM START DATE
  const SYSTEM_START_MONTH = 7;
  const SYSTEM_START_YEAR = 2026;

  // 🆕 Skip months BEFORE system launch
  if (currentYear < SYSTEM_START_YEAR || 
      (currentYear === SYSTEM_START_YEAR && currentMonth < SYSTEM_START_MONTH)) {
    return;
  }

  const balance = await getOrCreateBalance(empId);
  const employee = await Employee.findById(empId);

  if (!employee) return balance;

  const settings = await MonthlySettings.findOne({
    company_id: employee.company_id,
    month: currentMonth,
    year: currentYear,
  });

  const freeLeaves = settings?.free_leaves || 1;

  // 🆕 STRICT DUPLICATE CHECK - Number comparison
  const existingEntry = balance.history.find(
    h => Number(h.month) === Number(currentMonth) && Number(h.year) === Number(currentYear)
  );

  if (existingEntry) {
    console.log(`⏭️  ALREADY credited ${employee.name} for ${currentMonth}/${currentYear} - SKIP`);
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
  console.log(`✅ Credited 1 leave to ${employee.name} for ${currentMonth}/${currentYear}`);
  return balance;
};

// ════════════════════════════════════════
// 🆕 IMPROVED HELPER: Backfill missed months
// From system start (July 2026) to current month
// ════════════════════════════════════════
// const backfillBalance = async (empId) => {
//   const employee = await Employee.findById(empId);
//   if (!employee) return;

//   // 🎯 SYSTEM START
//   const SYSTEM_START_MONTH = 7;
//   const SYSTEM_START_YEAR = 2026;

//   const today = new Date();
//   const currentM = today.getMonth() + 1;
//   const currentY = today.getFullYear();

//   // Start from system launch
//   let m = SYSTEM_START_MONTH;
//   let y = SYSTEM_START_YEAR;

//   // Loop until current month
//   while (y < currentY || (y === currentY && m <= currentM)) {
//     await creditMonthlyLeaves(empId, m, y);
//     m++;
//     if (m > 12) { m = 1; y++; }
//   }
// };



// ════════════════════════════════════════
// ✅ FIXED - BACKFILL - Joining date se start
// ════════════════════════════════════════
const backfillBalance = async (empId) => {
  const employee = await Employee.findById(empId);
  if (!employee) return;

  // System start date
  const SYSTEM_START_MONTH = 7;
  const SYSTEM_START_YEAR = 2026;

  const today = new Date();
  const currentM = today.getMonth() + 1;
  const currentY = today.getFullYear();

  // ✅ Default = system start
  let startMonth = SYSTEM_START_MONTH;
  let startYear = SYSTEM_START_YEAR;

  // ✅ Agar joining_date set hai
  if (employee.joining_date && employee.joining_date.trim() !== '') {
    const parts = employee.joining_date.trim().split('/').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const [joinDay, joinMonth, joinYear] = parts;

      // Joining system start se baad hai?
      const joiningIsAfterSystemStart =
        joinYear > SYSTEM_START_YEAR ||
        (joinYear === SYSTEM_START_YEAR && joinMonth > SYSTEM_START_MONTH);

      if (joiningIsAfterSystemStart) {
        // Joining month se start karo
        startMonth = joinMonth;
        startYear = joinYear;
        console.log(`📅 ${employee.name}: Leave credit from joining month ${joinMonth}/${joinYear}`);
      } else {
        // Joining system start se pehle = system start se
        console.log(`📅 ${employee.name}: Joining before system start, using system start ${SYSTEM_START_MONTH}/${SYSTEM_START_YEAR}`);
      }
    }
  } else {
    // joining_date set nahi = purane employee = system start se (existing behavior)
    console.log(`📅 ${employee.name}: No joining date, using system start`);
  }

  // Loop from startMonth to current month
  let m = startMonth;
  let y = startYear;

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

    const currentMonthData = balance.history.find(
      h => Number(h.month) === Number(currentMonth) && Number(h.year) === Number(currentYear)
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
        history: balance.history.slice(-12),
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
// DEDUCT FROM BALANCE (when leave approved)
// ════════════════════════════════════════
const deductBalance = async (empId, leaveId, approvedDays, fromDate, toDate, appliedDays) => {
  const balance = await getOrCreateBalance(empId);
  await backfillBalance(empId);

  const updated = await LeaveBalance.findOne({ emp_id: empId });

  const balanceBefore = updated.current_balance;
  const paidDays = Math.min(approvedDays, balanceBefore);
  const unpaidDays = Math.max(0, approvedDays - balanceBefore);
  const balanceAfter = Math.max(0, balanceBefore - approvedDays);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let monthEntry = updated.history.find(
    h => Number(h.month) === Number(currentMonth) && Number(h.year) === Number(currentYear)
  );

  if (!monthEntry) {
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
// RESTORE BALANCE
// ════════════════════════════════════════
const restoreBalance = async (empId, leaveId, approvedDays) => {
  const balance = await LeaveBalance.findOne({ emp_id: empId });
  if (!balance) return;

  balance.current_balance += approvedDays;
  balance.total_used = Math.max(0, balance.total_used - approvedDays);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthEntry = balance.history.find(
    h => Number(h.month) === Number(currentMonth) && Number(h.year) === Number(currentYear)
  );

  if (monthEntry) {
    monthEntry.used = Math.max(0, monthEntry.used - approvedDays);
    monthEntry.closing_balance += approvedDays;
    monthEntry.leaves_log = monthEntry.leaves_log.filter(
      l => l.leave_id && l.leave_id.toString() !== leaveId.toString()
    );
  }

  await balance.save();
};

// ════════════════════════════════════════
// MANUAL CREDIT (Admin)
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

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let monthEntry = balance.history.find(
      h => Number(h.month) === Number(currentMonth) && Number(h.year) === Number(currentYear)
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

// ════════════════════════════════════════
// SUPER ADMIN - ADJUST LEAVE BALANCE
// ════════════════════════════════════════
const adjustLeaveBalance = async (req, res) => {
  try {
    const { emp_id, days, reason, adjustment_type } = req.body;

    if (!emp_id) {
      return res.status(400).json({ success: false, message: 'Employee select karo' });
    }

    if (!days || isNaN(parseFloat(days))) {
      return res.status(400).json({ success: false, message: 'Valid days daalo' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Reason dena zaroori hai' });
    }

    const employee = await Employee.findById(emp_id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee nahi mila' });
    }

    const daysValue = parseFloat(days);
    const isAdd = adjustment_type === 'add';
    const finalDays = isAdd ? Math.abs(daysValue) : -Math.abs(daysValue);

    const balance = await getOrCreateBalance(emp_id);

    const balanceBefore = balance.current_balance;
    const balanceAfter = Math.max(0, balanceBefore + finalDays);

    balance.current_balance = balanceAfter;

    if (isAdd) {
      balance.total_credited += Math.abs(finalDays);
    } else {
      balance.total_used += Math.abs(finalDays);
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let monthEntry = balance.history.find(
      h => Number(h.month) === Number(currentMonth) && Number(h.year) === Number(currentYear)
    );

    if (!monthEntry) {
      monthEntry = {
        month: currentMonth,
        year: currentYear,
        opening_balance: balanceBefore,
        credited: 0,
        used: 0,
        closing_balance: balanceBefore,
        leaves_log: [],
      };
      balance.history.push(monthEntry);
      monthEntry = balance.history[balance.history.length - 1];
    }

    if (isAdd) {
      monthEntry.credited += Math.abs(finalDays);
    } else {
      monthEntry.used += Math.abs(finalDays);
    }
    monthEntry.closing_balance = balanceAfter;

    monthEntry.leaves_log.push({
      leave_id: null,
      from_date: 'ADJUSTMENT',
      to_date: 'ADJUSTMENT',
      applied_days: 0,
      approved_days: Math.abs(finalDays),
      paid_days: isAdd ? Math.abs(finalDays) : 0,
      unpaid_days: !isAdd ? Math.abs(finalDays) : 0,
      approved_on: new Date(),
      is_adjustment: true,
      adjustment_type: isAdd ? 'add' : 'deduct',
      adjustment_reason: reason.trim(),
      adjusted_by: req.employee.name,
    });

    await balance.save();

    console.log(`✅ Leave Adjustment: ${employee.name} | ${isAdd ? '+' : '-'}${Math.abs(finalDays)}`);

    res.json({
      success: true,
      message: `${isAdd ? 'Added' : 'Deducted'} ${Math.abs(finalDays)} leaves. Balance: ${balanceBefore} → ${balanceAfter}`,
      data: {
        employee: { name: employee.name, emp_code: employee.emp_code },
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        adjustment: finalDays,
        reason: reason.trim(),
      },
    });
  } catch (err) {
    console.error('Adjust leave balance error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// SUPER ADMIN - GET ALL EMPLOYEES WITH BALANCE
// ════════════════════════════════════════
const getAllEmployeesWithBalance = async (req, res) => {
  try {
    const { company_id, search } = req.query;

    const filter = {
      status: 'approved',
      role: { $in: ['employee', 'manager'] },
    };

    if (company_id && company_id !== 'all') {
      filter.company_id = company_id;
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { emp_code: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const employees = await Employee.find(filter)
      .populate('company_id', 'name code')
      .select('name emp_code email department designation company_id')
      .sort({ name: 1 });

    const balances = await LeaveBalance.find({
      emp_id: { $in: employees.map(e => e._id) }
    });

    const balanceMap = {};
    balances.forEach(b => {
      balanceMap[b.emp_id.toString()] = b;
    });

    const employeesWithBalance = employees.map(emp => {
      const bal = balanceMap[emp._id.toString()];
      return {
        _id: emp._id,
        name: emp.name,
        emp_code: emp.emp_code,
        email: emp.email,
        department: emp.department,
        designation: emp.designation,
        company: emp.company_id,
        current_balance: bal?.current_balance || 0,
        total_credited: bal?.total_credited || 0,
        total_used: bal?.total_used || 0,
      };
    });

    res.json({
      success: true,
      count: employeesWithBalance.length,
      data: employeesWithBalance,
    });
  } catch (err) {
    console.error('Get all employees with balance error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// SUPER ADMIN - GET ADJUSTMENT HISTORY
// ════════════════════════════════════════
const getAdjustmentHistory = async (req, res) => {
  try {
    const { emp_id } = req.query;

    const filter = {};
    if (emp_id) filter.emp_id = emp_id;

    const balances = await LeaveBalance.find(filter)
      .populate('emp_id', 'name emp_code')
      .populate('company_id', 'name code');

    const adjustments = [];

    balances.forEach(balance => {
      balance.history.forEach(monthEntry => {
        monthEntry.leaves_log.forEach(log => {
          if (log.is_adjustment) {
            adjustments.push({
              _id: log._id,
              employee_name: balance.name,
              emp_code: balance.emp_code,
              company: balance.company_id,
              month: monthEntry.month,
              year: monthEntry.year,
              adjustment_type: log.adjustment_type,
              days: log.approved_days,
              reason: log.adjustment_reason,
              adjusted_by: log.adjusted_by,
              adjusted_on: log.approved_on,
            });
          }
        });
      });
    });

    adjustments.sort((a, b) => new Date(b.adjusted_on) - new Date(a.adjusted_on));

    res.json({
      success: true,
      count: adjustments.length,
      data: adjustments,
    });
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
};