// controllers/managerController.js

const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const { deductBalance } = require('./leaveBalanceController');

// ── GET MY TEAM (employees jinka manager mai hu) ──
const getMyTeam = async (req, res) => {
  try {
    const team = await Employee.find({
      leave_approval_manager: req.employee._id,
      status: 'approved'
    })
      .select('-password -face_encoding -all_encodings')
      .sort({ name: 1 });

    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET PENDING LEAVES (jo mujhe approve karne hain) ──
const getPendingLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      manager_id: req.employee._id,
      status: 'pending'
    })
      .populate('emp_id', 'name emp_code department')
      .populate('company_id', 'name code')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET ALL LEAVES (mere team ki) ──
const getAllMyLeaves = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { manager_id: req.employee._id };
    if (status) filter.status = status;

    const leaves = await Leave.find(filter)
      .populate('emp_id', 'name emp_code department')
      .populate('company_id', 'name code')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── APPROVE LEAVE ──
const approveLeave = async (req, res) => {
  try {
    const { remark, approved_days } = req.body;

    if (!approved_days || approved_days <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Approved days required (must be > 0)'
      });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave nahi mili' });
    }

    if (leave.manager_id?.toString() !== req.employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Yeh leave aapke assigned nahi hai'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave already ${leave.status} hai`
      });
    }

    // Validate approved days
    if (approved_days > leave.applied_days) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve more than applied (${leave.applied_days} days)`
      });
    }

    // Deduct from balance + calculate paid/unpaid
    const balanceResult = await deductBalance(
      leave.emp_id,
      leave._id,
      approved_days,
      leave.from_date,
      leave.to_date,
      leave.applied_days
    );

    // Update leave
    leave.status = 'approved';
    leave.approved_days = approved_days;
    leave.paid_days = balanceResult.paid_days;
    leave.unpaid_days = balanceResult.unpaid_days;
    leave.balance_before = balanceResult.balance_before;
    leave.balance_after = balanceResult.balance_after;
    leave.manager_remark = remark || 'Approved';
    leave.manager_action_date = new Date();
    leave.approved_by = req.employee._id;
    leave.approved_by_role = 'manager';

    await leave.save();

    res.json({
      success: true,
      message: `Leave approved for ${approved_days} day(s)`,
      data: leave,
      balance_info: balanceResult,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── REJECT LEAVE ──
const rejectLeave = async (req, res) => {
  try {
    const { remark } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave nahi mili' });
    }

    if (leave.manager_id?.toString() !== req.employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Yeh leave aapke assigned nahi hai'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave already ${leave.status} hai`
      });
    }

    leave.status = 'rejected';
    leave.manager_remark = remark || 'Rejected';
    leave.manager_action_date = new Date();
    leave.approved_by = req.employee._id;
    leave.approved_by_role = 'manager';

    await leave.save();

    res.json({
      success: true,
      message: 'Leave reject ho gayi',
      data: leave
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DASHBOARD STATS ──
const getManagerStats = async (req, res) => {
  try {
    const teamSize = await Employee.countDocuments({
      leave_approval_manager: req.employee._id,
      status: 'approved'
    });

    const pendingLeaves = await Leave.countDocuments({
      manager_id: req.employee._id,
      status: 'pending'
    });

    const approvedLeaves = await Leave.countDocuments({
      manager_id: req.employee._id,
      status: 'approved'
    });

    const rejectedLeaves = await Leave.countDocuments({
      manager_id: req.employee._id,
      status: 'rejected'
    });

    res.json({
      success: true,
      data: {
        team_size: teamSize,
        pending_leaves: pendingLeaves,
        approved_leaves: approvedLeaves,
        rejected_leaves: rejectedLeaves,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMyTeam,
  getPendingLeaves,
  getAllMyLeaves,
  approveLeave,
  rejectLeave,
  getManagerStats,
};