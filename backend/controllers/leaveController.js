// controllers/leaveController.js

const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const LeaveBalance = require('../models/LeaveBalance');

// ════════════════════════════════════════
// HELPER: Get IST timestamp
// ════════════════════════════════════════
const getISTTimestamp = () => {
  const now = new Date();
  const istOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  };
  const formatter = new Intl.DateTimeFormat('en-IN', istOptions);
  const parts = formatter.formatToParts(now);
  return `${parts.find(p => p.type === 'day').value}/${parts.find(p => p.type === 'month').value}/${parts.find(p => p.type === 'year').value} ${parts.find(p => p.type === 'hour').value}:${parts.find(p => p.type === 'minute').value}:${parts.find(p => p.type === 'second').value}`;
};

// ════════════════════════════════════════
// APPLY LEAVE (Employee)
// ════════════════════════════════════════
const applyLeave = async (req, res) => {
  try {
    const {
      from_date, to_date, shift, leave_type,
      reason, is_half_day, half_day_period,
    } = req.body;

    if (!from_date || !to_date || !leave_type || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled'
      });
    }

    if (is_half_day && from_date !== to_date) {
      return res.status(400).json({
        success: false,
        message: 'Half day leave should be for single date only'
      });
    }

    if (is_half_day && !half_day_period) {
      return res.status(400).json({
        success: false,
        message: 'Specify first or second half'
      });
    }

    const employee = await Employee.findById(req.employee._id)
      .populate('leave_approval_manager', 'name')
      .populate('company_id', 'name code');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (!employee.leave_approval_manager) {
      return res.status(400).json({
        success: false,
        message: 'No manager assigned. Contact admin.'
      });
    }

    const parseDate = (str) => {
      if (!str) return null;
      if (str.includes('-')) {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
      }
      if (str.includes('/')) {
        const [d, m, y] = str.split('/').map(Number);
        return new Date(y, m - 1, d);
      }
      return new Date(str);
    };

    const calculateDays = (fromStr, toStr, isHalfDay = false) => {
      if (isHalfDay) return 0.5;
      const from = parseDate(fromStr);
      const to = parseDate(toStr);
      if (!from || !to || isNaN(from.getTime()) || isNaN(to.getTime())) return 1;
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays || 1;
    };

    const normalizeDate = (str) => {
      if (!str) return '';
      if (str.includes('/')) return str;
      if (str.includes('-')) {
        const [y, m, d] = str.split('-').map(Number);
        return `${d}/${m}/${y}`;
      }
      return str;
    };

    const applied_days = calculateDays(from_date, to_date, is_half_day);

    if (isNaN(applied_days) || applied_days < 0.5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range',
      });
    }

    const normalizedFrom = normalizeDate(from_date);
    const normalizedTo = normalizeDate(to_date);

    const leave = await Leave.create({
      emp_id: employee._id,
      emp_code: employee.emp_code,
      name: employee.name,
      company_id: employee.company_id._id,
      department: employee.department || '',
      manager_id: employee.leave_approval_manager._id,
      manager_name: employee.leave_approval_manager.name,
      from_date: normalizedFrom,
      to_date: normalizedTo,
      shift: shift || 'General',
      leave_type,
      is_half_day: is_half_day || false,
      half_day_period: is_half_day ? half_day_period : '',
      leave_days: applied_days,
      applied_days: applied_days,
      approved_days: 0,
      paid_days: 0,
      unpaid_days: 0,
      balance_before: 0,
      balance_after: 0,
      reason,
      submission_date_ist: getISTTimestamp(),
    });

    console.log(`✅ Leave applied: ${employee.name} | ${applied_days} day(s)`);

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leave,
    });
  } catch (err) {
    console.error('❌ Leave apply error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// MY LEAVES (Employee)
// ════════════════════════════════════════
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ emp_id: req.employee._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// MY LEAVE STATS
// ════════════════════════════════════════
const getMyLeaveStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();

    const leaves = await Leave.find({
      emp_id: req.employee._id,
      status: 'approved',
    });

    const monthLeaves = leaves.filter(l => {
      const [d, m, y] = l.from_date.split('/').map(Number);
      return m === currentMonth && y === currentYear;
    });

    // 🆕 Use approved_days instead of leave_days
    const totalDays = monthLeaves.reduce((sum, l) => sum + (l.approved_days || l.leave_days || 0), 0);
    const totalCount = monthLeaves.length;

    const byType = { casual: 0, sick: 0, emergency: 0, other: 0 };
    monthLeaves.forEach(l => {
      if (byType[l.leave_type] !== undefined) {
        byType[l.leave_type] += l.approved_days || l.leave_days || 0;
      }
    });

    res.json({
      success: true,
      data: {
        month: currentMonth,
        year: currentYear,
        total_leave_days: totalDays,
        total_applications: totalCount,
        by_type: byType,
        leaves: monthLeaves,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// ALL LEAVES (Admin)
// ════════════════════════════════════════
const getAllLeaves = async (req, res) => {
  try {
    const { status } = req.query;

    let filter = {};

    // Super admin sees all
    if (req.employee.role === 'super_admin') {
      filter = {};
    } 
    // 🆕 Regular admin with assigned_manager - sees ONLY that manager's leaves
    else if (req.employee.role === 'admin' && req.employee.assigned_manager) {
      const managerName = req.employee.assigned_manager.trim();
      const companyId = req.employee.company_id?._id || req.employee.company_id;
      
      // Find all employees whose leave_approval_manager matches (case-insensitive)
      const Employee = require('../models/Employee');
      const managedEmployees = await Employee.find({
        company_id: companyId,
        leave_approval_manager: { $regex: new RegExp(`^${managerName}$`, 'i') }
      }).select('_id name');
      
      const managedEmpIds = managedEmployees.map(e => e._id);
      
      console.log(`🎯 Manager Admin: ${req.employee.name} → Manager: ${managerName}`);
      console.log(`   Found ${managedEmployees.length} employees managed by ${managerName}`);
      console.log(`   Employees: ${managedEmployees.map(e => e.name).join(', ')}`);
      
      filter = {
        company_id: companyId,
        emp_id: { $in: managedEmpIds },  // Filter by managed employees
      };
    }
    // Regular admin - sees all of company
    else {
      filter = { company_id: req.employee.company_id?._id || req.employee.company_id };
    }

    if (status) filter.status = status;

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .populate('emp_id', 'name emp_code email')
      .populate('manager_id', 'name')
      .populate('company_id', 'name code');

    console.log(`📋 Returning ${leaves.length} leaves for ${req.employee.name}`);

    res.json({ success: true, data: leaves });
  } catch (err) {
    console.error('Get all leaves error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// ════════════════════════════════════════
// 🆕 APPROVE LEAVE with PARTIAL DAYS
// ════════════════════════════════════════
const approveLeave = async (req, res) => {
  try {
    const { 
      approved_days,     // 🆕 Kitne din approve karne hain
      paid_days,         // 🆕 Kitne paid (from balance)
      unpaid_days,       // 🆕 Kitne unpaid (deduct)
      remark 
    } = req.body;

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave already ${leave.status}`
      });
    }

    // 🆕 Validate approved_days
    const finalApprovedDays = parseFloat(approved_days) || leave.applied_days;
    
    if (finalApprovedDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Approved days must be greater than 0'
      });
    }

    if (finalApprovedDays > leave.applied_days) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve more than applied (${leave.applied_days} days)`
      });
    }

    // 🆕 Get employee balance
    const balance = await LeaveBalance.findOne({ emp_id: leave.emp_id });
    const currentBalance = balance?.current_balance || 0;

    // 🆕 Auto-calculate paid/unpaid if not provided
    let finalPaidDays = parseFloat(paid_days);
    let finalUnpaidDays = parseFloat(unpaid_days);

    if (isNaN(finalPaidDays) || isNaN(finalUnpaidDays)) {
      // Auto split based on balance
      finalPaidDays = Math.min(finalApprovedDays, currentBalance);
      finalUnpaidDays = Math.max(0, finalApprovedDays - currentBalance);
    }

    // Validate split
    if (finalPaidDays + finalUnpaidDays !== finalApprovedDays) {
      return res.status(400).json({
        success: false,
        message: `Paid + Unpaid must equal approved days (${finalApprovedDays})`
      });
    }

    // 🆕 Update leave
    leave.status = 'approved';
    leave.approved_days = finalApprovedDays;
    leave.paid_days = finalPaidDays;
    leave.unpaid_days = finalUnpaidDays;
    leave.balance_before = currentBalance;
    leave.balance_after = Math.max(0, currentBalance - finalPaidDays);
    leave.approved_by = req.employee._id;
    leave.approved_by_role = req.employee.role;

    if (req.employee.role === 'manager') {
      leave.manager_remark = remark || `Approved ${finalApprovedDays} day(s)`;
      leave.manager_action_date = new Date();
    } else {
      leave.admin_remark = remark || `Approved ${finalApprovedDays} day(s) by admin`;
    }

    await leave.save();

    // 🆕 Update leave balance (deduct paid days)
    if (balance && finalPaidDays > 0) {
      balance.current_balance = Math.max(0, currentBalance - finalPaidDays);
      balance.total_used = (balance.total_used || 0) + finalPaidDays;
      
      if (balance.current_month) {
        balance.current_month.used = (balance.current_month.used || 0) + finalPaidDays;
      }
      
      await balance.save();
      console.log(`💰 Balance updated: ${currentBalance} → ${balance.current_balance}`);
    }

    console.log(`✅ Leave APPROVED: ${leave.name}`);
    console.log(`   Applied: ${leave.applied_days} | Approved: ${finalApprovedDays}`);
    console.log(`   Paid: ${finalPaidDays} | Unpaid: ${finalUnpaidDays}`);

    res.json({
      success: true,
      message: `Leave approved: ${finalApprovedDays} day(s) (${finalPaidDays} paid, ${finalUnpaidDays} unpaid)`,
      data: leave
    });
  } catch (err) {
    console.error('❌ Approve error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// REJECT LEAVE
// ════════════════════════════════════════
const rejectLeave = async (req, res) => {
  try {
    const { remark } = req.body;

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave already ${leave.status}`
      });
    }

    leave.status = 'rejected';
    leave.approved_days = 0;
    leave.paid_days = 0;
    leave.unpaid_days = 0;
    leave.approved_by = req.employee._id;
    leave.approved_by_role = req.employee.role;

    if (req.employee.role === 'manager') {
      leave.manager_remark = remark || 'Rejected';
      leave.manager_action_date = new Date();
    } else {
      leave.admin_remark = remark || 'Rejected by admin';
    }

    await leave.save();

    console.log(`❌ Leave REJECTED: ${leave.name} | Reason: ${remark}`);

    res.json({
      success: true,
      message: 'Leave rejected',
      data: leave
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// DELETE LEAVE
// ════════════════════════════════════════
const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    if (leave.emp_id.toString() !== req.employee._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete pending leaves'
      });
    }

    await Leave.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Leave deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// SUPER ADMIN — GET ALL LEAVES
// ════════════════════════════════════════
const getAllLeavesSuperAdmin = async (req, res) => {
  try {
    const { company_id, status, search } = req.query;

    let filter = {};

    if (status && status !== 'all') filter.status = status;
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { emp_code: searchRegex },
      ];
    }

    let leaves = await Leave.find(filter)
      .populate({
        path: 'emp_id',
        select: 'name emp_code department company_id',
        populate: { path: 'company_id', select: 'name code' },
      })
      .populate('company_id', 'name code')
      .sort({ createdAt: -1 });

    leaves = leaves.map((leave) => {
      const leaveObj = leave.toObject();
      if (!leaveObj.company_id || !leaveObj.company_id.name) {
        if (leaveObj.emp_id?.company_id) {
          leaveObj.company_id = leaveObj.emp_id.company_id;
        }
      }
      return leaveObj;
    });

    if (company_id && company_id !== 'all') {
      leaves = leaves.filter((l) => {
        const compId = l.company_id?._id?.toString() || l.company_id?.toString();
        return compId === company_id;
      });
    }

    return res.json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ════════════════════════════════════════
// SUPER ADMIN — APPROVE (with partial)
// ════════════════════════════════════════
const superAdminApproveLeave = async (req, res) => {
  try {
    const { approved_days, paid_days, unpaid_days, admin_remark } = req.body;

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave nahi mili' });
    }

    const finalApprovedDays = parseFloat(approved_days) || leave.applied_days;
    
    if (finalApprovedDays > leave.applied_days) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve more than ${leave.applied_days} days`
      });
    }

    const balance = await LeaveBalance.findOne({ emp_id: leave.emp_id });
    const currentBalance = balance?.current_balance || 0;

    let finalPaidDays = parseFloat(paid_days);
    let finalUnpaidDays = parseFloat(unpaid_days);

    if (isNaN(finalPaidDays) || isNaN(finalUnpaidDays)) {
      finalPaidDays = Math.min(finalApprovedDays, currentBalance);
      finalUnpaidDays = Math.max(0, finalApprovedDays - currentBalance);
    }

    leave.status = 'approved';
    leave.approved_days = finalApprovedDays;
    leave.paid_days = finalPaidDays;
    leave.unpaid_days = finalUnpaidDays;
    leave.balance_before = currentBalance;
    leave.balance_after = Math.max(0, currentBalance - finalPaidDays);
    leave.approved_by = req.employee._id;
    leave.approved_by_role = 'super_admin';
    leave.manager_action_date = new Date();
    leave.admin_remark = admin_remark || `Approved ${finalApprovedDays} day(s) by Super Admin`;

    await leave.save();

    // Update balance
    if (balance && finalPaidDays > 0) {
      balance.current_balance = Math.max(0, currentBalance - finalPaidDays);
      balance.total_used = (balance.total_used || 0) + finalPaidDays;
      if (balance.current_month) {
        balance.current_month.used = (balance.current_month.used || 0) + finalPaidDays;
      }
      await balance.save();
    }

    return res.json({
      success: true,
      message: `Approved ${finalApprovedDays} day(s)`,
      data: leave,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════
// SUPER ADMIN — REJECT
// ════════════════════════════════════════
const superAdminRejectLeave = async (req, res) => {
  try {
    const { admin_remark } = req.body;

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave nahi mili' });
    }

    leave.status = 'rejected';
    leave.approved_by = req.employee._id;
    leave.approved_by_role = 'super_admin';
    leave.manager_action_date = new Date();
    leave.admin_remark = admin_remark || 'Rejected by Super Admin';
    leave.approved_days = 0;
    leave.paid_days = 0;
    leave.unpaid_days = 0;

    await leave.save();

    return res.json({
      success: true,
      message: 'Leave rejected',
      data: leave,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════
// SUPER ADMIN — DELETE
// ════════════════════════════════════════
const superAdminDeleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave nahi mili' });
    }

    await Leave.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Leave deleted',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getMyLeaveStats,
  getAllLeavesSuperAdmin,
  superAdminApproveLeave,
  superAdminRejectLeave,
  superAdminDeleteLeave,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  deleteLeave,
};