// // routes/attendanceRoutes.js

// const express = require('express');
// const router = express.Router();
// const attendanceController = require('../controllers/attendanceController');
// const { protect, adminOnly } = require('../middleware/authMiddleware');

// // ── Mark attendance ──
// router.post('/mark-self', protect, attendanceController.markAttendance);
// router.post('/mark', protect, attendanceController.markAttendance);

// // ── Employee endpoints ──
// router.get('/my', protect, attendanceController.getMyAttendance);
// router.get('/today-status', protect, attendanceController.getTodayStatus);
// router.get('/monthly-summary', protect, attendanceController.getMonthlySummary);
// router.get('/calendar', protect, attendanceController.getCalendar);
// router.get('/salary-estimate', protect, attendanceController.getSalaryEstimate);  // 🆕

// // ── Admin endpoints ──
// router.get('/today', protect, attendanceController.getTodayAttendance);
// router.get('/all', protect, adminOnly, attendanceController.getAllAttendance);

// module.exports = router;





// routes/attendanceRoutes.js

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ── Mark attendance ──
router.post('/mark-self', protect, attendanceController.markAttendance);
router.post('/mark', protect, attendanceController.markAttendance);

// ── Employee endpoints ──
router.get('/my', protect, attendanceController.getMyAttendance);
router.get('/today-status', protect, attendanceController.getTodayStatus);
router.get('/monthly-summary', protect, attendanceController.getMonthlySummary);
router.get('/calendar', protect, attendanceController.getCalendar);
router.get('/salary-estimate', protect, attendanceController.getSalaryEstimate);

// ── Admin endpoints ──
router.get('/today', protect, attendanceController.getTodayAttendance);
router.get('/all', protect, adminOnly, attendanceController.getAllAttendance);

// 🆕 Auto checkout (admin manually trigger)
router.post('/auto-checkout', protect, adminOnly, async (req, res) => {
  try {
    const autoCheckout = require('../utils/autoCheckout');
    const result = await autoCheckout();
    return res.json({
      success: true,
      message: `Auto checkout: ${result.updated} employees updated`,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;