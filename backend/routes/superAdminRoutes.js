// routes/superAdminRoutes.js

const express = require('express');
const router = express.Router();
const { protect, superAdminOnly } = require('../middleware/authMiddleware');
const {
  getGlobalStats,
  createAdmin,
  getAllAdmins,
  deleteAdmin,
  promoteToManager,
  demoteToEmployee,
  getAllEmployees,
  getAllAttendanceGlobal,
  resetUserPassword,    // 🆕
  changeOwnPassword,    // 🆕
} = require('../controllers/superAdminController');

// All routes need super admin
router.use(protect, superAdminOnly);

router.get('/stats', getGlobalStats);
router.get('/admins', getAllAdmins);
router.post('/admins', createAdmin);
router.delete('/admins/:id', deleteAdmin);
router.get('/employees', getAllEmployees);
router.put('/promote/:id', promoteToManager);
router.put('/demote/:id', demoteToEmployee);

// All Attendance (across companies)
router.get('/all-attendance', getAllAttendanceGlobal);

// 🆕 Password Management
router.post('/reset-password', resetUserPassword);      // Reset any user password
router.post('/change-own-password', changeOwnPassword); // Change own password

module.exports = router;