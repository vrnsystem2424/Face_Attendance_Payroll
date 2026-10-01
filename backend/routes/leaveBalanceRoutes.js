

// // routes/leaveBalanceRoutes.js

// const express = require('express');
// const router = express.Router();
// const { protect, adminOnly, managerOnly, superAdminOnly } = require('../middleware/authMiddleware');
// const {
//   getMyBalance,
//   getEmployeeBalance,
//   manualCredit,
//   adjustLeaveBalance,           // 🆕
//   getAllEmployeesWithBalance,   // 🆕
//   getAdjustmentHistory,  
//   deleteAdjustment,       // 🆕
// } = require('../controllers/leaveBalanceController');

// // Employee — own balance
// router.get('/my', protect, getMyBalance);

// // Manager/Admin — see any employee's balance
// router.get('/employee/:emp_id', protect, managerOnly, getEmployeeBalance);

// // Admin — manually credit bonus leaves
// router.post('/credit', protect, adminOnly, manualCredit);

// // 🆕 SUPER ADMIN ROUTES
// router.get('/all-with-balance', protect, superAdminOnly, getAllEmployeesWithBalance);
// router.post('/adjust', protect, superAdminOnly, adjustLeaveBalance);
// router.get('/adjustment-history', protect, superAdminOnly, getAdjustmentHistory);
// router.delete('/adjustment/:id', protect, adminOnly, deleteAdjustment);

// module.exports = router;




const express = require('express');
const router = express.Router();
const {
  fetchMyBalance,
  fetchEmployeeBalance,
  fetchAllEmployeesWithBalance,
  adjustLeaveBalance,
  fetchAdjustmentHistory,
  deleteAdjustment,
} = require('../controllers/leaveBalanceController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Employee routes
router.get('/my', protect, fetchMyBalance);
router.get('/employee/:empId', protect, fetchEmployeeBalance);

// Admin / Super Admin routes
router.get('/all-with-balance', protect, adminOnly, fetchAllEmployeesWithBalance);
router.post('/adjust', protect, adminOnly, adjustLeaveBalance);
router.get('/adjustment-history', protect, adminOnly, fetchAdjustmentHistory);
router.delete('/adjustment/:id', protect, adminOnly, deleteAdjustment);

module.exports = router;