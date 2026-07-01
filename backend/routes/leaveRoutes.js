// routes/leaveRoutes.js

const { protect, adminOnly, superAdminOnly } = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getMyLeaveStats,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  deleteLeave,
  getAllLeavesSuperAdmin,
  superAdminApproveLeave,
  superAdminRejectLeave,
  superAdminDeleteLeave,
} = require('../controllers/leaveController');

// ══════════════════════════════════════════
// EMPLOYEE ROUTES
// ══════════════════════════════════════════
router.post('/apply', protect, applyLeave);
router.get('/my', protect, getMyLeaves);
router.get('/my-stats', protect, getMyLeaveStats);
router.delete('/:id', protect, deleteLeave);

// ══════════════════════════════════════════
// ADMIN/MANAGER ROUTES
// ══════════════════════════════════════════
router.get('/all', protect, adminOnly, getAllLeaves);

// 🆕 BOTH URL PATTERNS - Backward Compatible
// Pattern 1: /leaves/:id/approve (new pattern)
router.put('/:id/approve', protect, adminOnly, approveLeave);
router.put('/:id/reject', protect, adminOnly, rejectLeave);

// Pattern 2: /leaves/approve/:id (old pattern - frontend using this)
router.put('/approve/:id', protect, adminOnly, approveLeave);
router.put('/reject/:id', protect, adminOnly, rejectLeave);

// ══════════════════════════════════════════
// SUPER ADMIN ROUTES
// ══════════════════════════════════════════
router.get('/super-admin/all', protect, superAdminOnly, getAllLeavesSuperAdmin);
router.put('/super-admin/approve/:id', protect, superAdminOnly, superAdminApproveLeave);
router.put('/super-admin/reject/:id', protect, superAdminOnly, superAdminRejectLeave);
router.delete('/super-admin/:id', protect, superAdminOnly, superAdminDeleteLeave);

module.exports = router;