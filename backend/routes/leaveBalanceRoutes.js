// routes/leaveBalanceRoutes.js

const express = require('express');
const router = express.Router();
const { protect, adminOnly, managerOnly } = require('../middleware/authMiddleware');
const {
  getMyBalance,
  getEmployeeBalance,
  manualCredit,
} = require('../controllers/leaveBalanceController');

// Employee — own balance
router.get('/my', protect, getMyBalance);

// Manager/Admin — see any employee's balance
router.get('/employee/:emp_id', protect, managerOnly, getEmployeeBalance);

// Admin — manually credit bonus leaves
router.post('/credit', protect, adminOnly, manualCredit);

module.exports = router;