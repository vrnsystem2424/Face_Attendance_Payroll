// controllers/leaveController.js

const Leave = require('../models/Leave');
const Employee = require('../models/Employee');

// ════════════════════════════════════════
// HELPER: Get IST formatted timestamp
// ════════════════════════════════════════
const getISTTimestamp = () => {
  const now = new Date();
  const istOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  const formatter = new Intl.DateTimeFormat('en-IN', istOptions);
  const parts = formatter.formatToParts(now);
  
  return `${parts.find(p => p.type === 'day').value}/${parts.find(p => p.type === 'month').value}/${parts.find(p => p.type === 'year').value} ${parts.find(p => p.type === 'hour').value}:${parts.find(p => p.type === 'minute').value}:${parts.find(p => p.type === 'second').value}`;
};

// ════════════════════════════════════════
// HELPER: Calculate days between dates
// ════════════════════════════════════════
const calculateDays = (fromDate, toDate, isHalfDay = false) => {
  if (isHalfDay) return 0.5;
  
  // Parse "D/M/YYYY" format
  const parseDate = (str) => {
    const [d, m, y] = str.split('/');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  };

  const from = parseDate(fromDate);
  const to = parseDate(toDate);
  const diffTime = Math.abs(to - from);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

// ════════════════════════════════════════
// APPLY LEAVE (Employee)
// ════════════════════════════════════════
const applyLeave = async (req, res) => {
  try {
    const {
      from_date,
      to_date,
      shift,
      leave_type,
      reason,
      is_half_day,
      half_day_period,
    } = req.body;

    // Basic validation
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

    // 🆕 SMART DATE PARSER — handles both "D/M/YYYY" and "YYYY-MM-DD"
    const parseDate = (str) => {
      if (!str) return null;
      
      // Case 1: HTML date input format "2026-05-29"
      if (str.includes('-')) {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
      }
      
      // Case 2: Old format "D/M/YYYY"
      if (str.includes('/')) {
        const [d, m, y] = str.split('/').map(Number);
        return new Date(y, m - 1, d);
      }
      
      return new Date(str);
    };

    // 🆕 SMART CALCULATE DAYS
    const calculateDays = (fromStr, toStr, isHalfDay = false) => {
      if (isHalfDay) return 0.5;
      
      const from = parseDate(fromStr);
      const to = parseDate(toStr);
      
      // 🔧 Validation — if dates are invalid, return 1
      if (!from || !to || isNaN(from.getTime()) || isNaN(to.getTime())) {
        console.log('⚠️  Invalid dates:', { fromStr, toStr, from, to });
        return 1;
      }
      
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays || 1;
    };

    // 🆕 NORMALIZE DATE TO "D/M/YYYY" FORMAT (for storage consistency)
    const normalizeDate = (str) => {
      if (!str) return '';
      
      // If already in D/M/YYYY format, return as-is
      if (str.includes('/')) return str;
      
      // Convert from "2026-05-29" to "29/5/2026"
      if (str.includes('-')) {
        const [y, m, d] = str.split('-').map(Number);
        return `${d}/${m}/${y}`;
      }
      
      return str;
    };

    const applied_days = calculateDays(from_date, to_date, is_half_day);

    // 🔧 Safety check — ensure it's a valid number
    if (isNaN(applied_days) || applied_days < 0.5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range',
      });
    }

    // 🆕 Store dates in consistent D/M/YYYY format
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

    console.log(`✅ Leave applied: ${employee.name} | ${applied_days} day(s) | Dates: ${normalizedFrom} → ${normalizedTo}`);

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
// MY LEAVE STATS (current month leave count)
// ════════════════════════════════════════
const getMyLeaveStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = parseInt(month) || new Date().getMonth() + 1;
    const currentYear = parseInt(year) || new Date().getFullYear();

    // Get all approved leaves
    const leaves = await Leave.find({
      emp_id: req.employee._id,
      status: 'approved',
    });

    // Filter by month/year (from_date matches)
    const monthLeaves = leaves.filter(l => {
      const [d, m, y] = l.from_date.split('/').map(Number);
      return m === currentMonth && y === currentYear;
    });

    const totalDays = monthLeaves.reduce((sum, l) => sum + (l.leave_days || 0), 0);
    const totalCount = monthLeaves.length;

    const byType = {
      casual: 0,
      sick: 0,
      emergency: 0,
      other: 0,
    };
    monthLeaves.forEach(l => {
      if (byType[l.leave_type] !== undefined) {
        byType[l.leave_type] += l.leave_days || 0;
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

    const filter = req.employee.role === 'super_admin'
      ? {}
      : { company_id: req.employee.company_id?._id || req.employee.company_id };

    if (status) filter.status = status;

    const leaves = await Leave.find(filter)
      .sort({ createdAt: -1 })
      .populate('emp_id', 'name emp_code email')
      .populate('manager_id', 'name')
      .populate('company_id', 'name code');

    res.json({ success: true, data: leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// APPROVE LEAVE (Manager or Admin)
// ════════════════════════════════════════
const approveLeave = async (req, res) => {
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

    leave.status = 'approved';
    leave.approved_by = req.employee._id;
    leave.approved_by_role = req.employee.role;

    if (req.employee.role === 'manager') {
      leave.manager_remark = remark || 'Approved';
      leave.manager_action_date = new Date();
    } else {
      leave.admin_remark = remark || 'Approved by admin';
    }

    await leave.save();

    res.json({
      success: true,
      message: 'Leave approved',
      data: leave
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════
// REJECT LEAVE (Manager or Admin)
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
    leave.approved_by = req.employee._id;
    leave.approved_by_role = req.employee.role;

    if (req.employee.role === 'manager') {
      leave.manager_remark = remark || 'Rejected';
      leave.manager_action_date = new Date();
    } else {
      leave.admin_remark = remark || 'Rejected by admin';
    }

    await leave.save();

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
// DELETE LEAVE (only if pending)
// ════════════════════════════════════════
const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    // Only owner can delete pending leave
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




////// superr admin

// ════════════════════════════════════════════
// 🆕 SUPER ADMIN — GET ALL LEAVES (all companies)
// ════════════════════════════════════════════
const getAllLeavesSuperAdmin = async (req, res) => {
  try {
    const { company_id, status, search } = req.query;

    let filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { emp_code: searchRegex },
      ];
    }

    // Fetch leaves with employee populated (employee has company_id)
    let leaves = await Leave.find(filter)
      .populate({
        path: 'emp_id',
        select: 'name emp_code department company_id',
        populate: {
          path: 'company_id',
          select: 'name code',
        },
      })
      .populate('company_id', 'name code')   // also try direct populate
      .sort({ createdAt: -1 });

    // 🔧 Smart fallback — get company info from employee if leave.company_id missing
    leaves = leaves.map((leave) => {
      const leaveObj = leave.toObject();

      // If leave.company_id is missing/null, get from emp_id.company_id
      if (!leaveObj.company_id || !leaveObj.company_id.name) {
        if (leaveObj.emp_id?.company_id) {
          leaveObj.company_id = leaveObj.emp_id.company_id;
        }
      }

      return leaveObj;
    });

    // Apply company filter AFTER populate (since data may come from emp)
    if (company_id && company_id !== 'all') {
      leaves = leaves.filter((l) => {
        const compId = l.company_id?._id?.toString() || l.company_id?.toString();
        return compId === company_id;
      });
    }

    // Debug log
    if (leaves.length > 0) {
      console.log('✅ Sample leave company:', leaves[0].company_id);
    }

    return res.json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (error) {
    console.log('❌ getAllLeavesSuperAdmin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ════════════════════════════════════════════
// 🆕 SUPER ADMIN — APPROVE LEAVE
// ════════════════════════════════════════════
const superAdminApproveLeave = async (req, res) => {
  try {
    const { admin_remark } = req.body;

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave nahi mili' });
    }

    if (leave.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Already approved' });
    }

    leave.status = 'approved';
    leave.approved_by = req.employee._id;
    leave.approved_by_role = 'super_admin';
    leave.manager_action_date = new Date();
    leave.admin_remark = admin_remark || 'Approved by Super Admin';

    // Default paid days if not set
    if (!leave.approved_days) {
      leave.approved_days = leave.leave_days || 1;
      leave.paid_days = leave.approved_days;
      leave.unpaid_days = 0;
    }

    await leave.save();

    return res.json({
      success: true,
      message: 'Leave approve ho gayi',
      data: leave,
    });
  } catch (error) {
    console.log('superAdminApproveLeave error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════════
// 🆕 SUPER ADMIN — REJECT LEAVE
// ════════════════════════════════════════════
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
      message: 'Leave reject ho gayi',
      data: leave,
    });
  } catch (error) {
    console.log('superAdminRejectLeave error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ════════════════════════════════════════════
// 🆕 SUPER ADMIN — DELETE LEAVE
// ════════════════════════════════════════════
const superAdminDeleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave nahi mili' });
    }

    await Leave.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Leave delete ho gayi',
    });
  } catch (error) {
    console.log('superAdminDeleteLeave error:', error);
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