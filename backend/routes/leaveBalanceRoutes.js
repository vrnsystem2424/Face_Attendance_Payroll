// // routes/leaveBalanceRoutes.js

// const express = require('express');
// const router = express.Router();
// const { protect, adminOnly, managerOnly } = require('../middleware/authMiddleware');
// const {
//   getMyBalance,
//   getEmployeeBalance,
//   manualCredit,
// } = require('../controllers/leaveBalanceController');

// // Employee — own balance
// router.get('/my', protect, getMyBalance);

// // Manager/Admin — see any employee's balance
// router.get('/employee/:emp_id', protect, managerOnly, getEmployeeBalance);

// // Admin — manually credit bonus leaves
// router.post('/credit', protect, adminOnly, manualCredit);

// module.exports = router;





// routes/leaveBalanceRoutes.js

const express = require('express');
const router = express.Router();
const { protect, adminOnly, managerOnly, superAdminOnly } = require('../middleware/authMiddleware');
const {
  getMyBalance,
  getEmployeeBalance,
  manualCredit,
  adjustLeaveBalance,           // 🆕
  getAllEmployeesWithBalance,   // 🆕
  getAdjustmentHistory,         // 🆕
} = require('../controllers/leaveBalanceController');

// Employee — own balance
router.get('/my', protect, getMyBalance);

// Manager/Admin — see any employee's balance
router.get('/employee/:emp_id', protect, managerOnly, getEmployeeBalance);

// Admin — manually credit bonus leaves
router.post('/credit', protect, adminOnly, manualCredit);

// 🆕 SUPER ADMIN ROUTES
router.get('/all-with-balance', protect, superAdminOnly, getAllEmployeesWithBalance);
router.post('/adjust', protect, superAdminOnly, adjustLeaveBalance);
router.get('/adjustment-history', protect, superAdminOnly, getAdjustmentHistory);

module.exports = router;