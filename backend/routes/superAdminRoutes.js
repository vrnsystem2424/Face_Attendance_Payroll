const express = require('express');
const router = express.Router();

const {
  getGlobalStats,
  createAdmin,
  getAllAdmins,
  deleteAdmin,
  promoteToManager,
  demoteToEmployee,
  getAllEmployees,
  getAllAttendanceGlobal,
  resetUserPassword,
  changeOwnPassword,
} = require('../controllers/superAdminController');

const { 
  downloadEmployeeDetailedReportPDF,
  getEmployeeDetailedReportData 
} = require('../controllers/reportController');

const { protect, superAdminOnly } = require('../middleware/authMiddleware');

// 🔒 All routes protected
router.use(protect);
router.use(superAdminOnly);

router.get('/stats', getGlobalStats);
router.get('/admins', getAllAdmins);
router.post('/admins', createAdmin);
router.delete('/admins/:id', deleteAdmin);

router.get('/employees', getAllEmployees);
router.put('/promote/:id', promoteToManager);
router.put('/demote/:id', demoteToEmployee);

router.get('/all-attendance', getAllAttendanceGlobal);

// 🆕 Live JSON Web Preview Data & PDF Report
router.get('/employee-report-data', getEmployeeDetailedReportData);
router.get('/employee-report-pdf', downloadEmployeeDetailedReportPDF);

router.post('/reset-password', resetUserPassword);
router.post('/change-own-password', changeOwnPassword);

module.exports = router;