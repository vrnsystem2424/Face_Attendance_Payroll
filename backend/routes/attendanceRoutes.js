// const express = require('express');
// const router = express.Router();
// const attendanceController = require('../controllers/attendanceController');
// const { protect, adminOnly, superAdminOnly } = require('../middleware/authMiddleware');

// // ── Mark attendance ──
// router.post('/mark-self', protect, attendanceController.markAttendance);
// router.post('/mark', protect, attendanceController.markAttendance);

// // ── Employee endpoints ──
// router.get('/my', protect, attendanceController.getMyAttendance);
// router.get('/today-status', protect, attendanceController.getTodayStatus);
// router.get('/monthly-summary', protect, attendanceController.getMonthlySummary);
// router.get('/calendar', protect, attendanceController.getCalendar);
// router.get('/salary-estimate', protect, attendanceController.getSalaryEstimate);

// // ── Admin endpoints ──
// router.get('/today', protect, attendanceController.getTodayAttendance);
// router.get('/all', protect, adminOnly, attendanceController.getAllAttendance);
// router.put('/review/:id', protect, adminOnly, attendanceController.reviewAttendance);
// router.get('/absent-today', protect, adminOnly, attendanceController.getAbsentToday);
// router.get('/search-employees', protect, adminOnly, attendanceController.searchEmployees);
// router.get('/employee-history', protect, adminOnly, attendanceController.getEmployeeAttendanceHistory);
// router.get('/on-leave-today', protect, adminOnly, attendanceController.getOnLeaveToday);

// // 🆕 SUPER ADMIN - Fix Missing Checkout
// router.get('/missing-checkouts', protect, superAdminOnly, attendanceController.getMissingCheckouts);
// router.post('/fix-checkout', protect, superAdminOnly, attendanceController.fixMissingCheckout);
// router.post('/edit-attendance', protect, superAdminOnly, attendanceController.editAttendance);
// // 🆕 Get all attendance for fix page
// router.get('/all-for-fix', protect, superAdminOnly, attendanceController.getAllAttendanceForFix);

// module.exports = router;




const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect, adminOnly, superAdminOnly } = require('../middleware/authMiddleware');

// Mark attendance
router.post('/mark-self', protect, attendanceController.markAttendance);
router.post('/mark', protect, attendanceController.markAttendance);

// Employee endpoints
router.get('/my', protect, attendanceController.getMyAttendance);
router.get('/today-status', protect, attendanceController.getTodayStatus);
router.get('/monthly-summary', protect, attendanceController.getMonthlySummary);
router.get('/calendar', protect, attendanceController.getCalendar);
router.get('/salary-estimate', protect, attendanceController.getSalaryEstimate);

// Admin endpoints
router.get('/today', protect, attendanceController.getTodayAttendance);
router.get('/all', protect, adminOnly, attendanceController.getAllAttendance);
router.put('/review/:id', protect, adminOnly, attendanceController.reviewAttendance);
router.get('/absent-today', protect, adminOnly, attendanceController.getAbsentToday);
router.get('/search-employees', protect, adminOnly, attendanceController.searchEmployees);
router.get('/employee-history', protect, adminOnly, attendanceController.getEmployeeAttendanceHistory);
router.get('/on-leave-today', protect, adminOnly, attendanceController.getOnLeaveToday);

// 🆕 SUPER ADMIN - Fix Missing Checkout
router.get('/missing-checkouts', protect, superAdminOnly, attendanceController.getMissingCheckouts);
router.post('/fix-checkout', protect, superAdminOnly, attendanceController.fixMissingCheckout);
router.post('/edit-attendance', protect, superAdminOnly, attendanceController.editAttendance);

// 🆕 SUPER ADMIN - Get All Attendance For Fix
router.get('/all-for-fix', protect, superAdminOnly, attendanceController.getAllAttendanceForFix);

module.exports = router;