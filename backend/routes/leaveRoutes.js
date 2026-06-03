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
    getAllLeavesSuperAdmin,        // 🆕
  superAdminApproveLeave,        // 🆕
  superAdminRejectLeave,         // 🆕
  superAdminDeleteLeave,  
} = require('../controllers/leaveController');

// ── Employee ──
router.post('/apply', protect, applyLeave);
router.get('/my', protect, getMyLeaves);
router.get('/my-stats', protect, getMyLeaveStats);
router.delete('/:id', protect, deleteLeave);

// ── Admin/Manager (managerRoutes mein bhi hai, yahan admin override ke liye) ──
router.get('/all', protect, adminOnly, getAllLeaves);
router.put('/:id/approve', protect, adminOnly, approveLeave);
router.put('/:id/reject', protect, adminOnly, rejectLeave);


/////// ── Super Admin ──
router.get('/super-admin/all', protect, superAdminOnly, getAllLeavesSuperAdmin);
router.put('/super-admin/approve/:id', protect, superAdminOnly, superAdminApproveLeave);
router.put('/super-admin/reject/:id', protect, superAdminOnly, superAdminRejectLeave);
router.delete('/super-admin/:id', protect, superAdminOnly, superAdminDeleteLeave);

module.exports = router;