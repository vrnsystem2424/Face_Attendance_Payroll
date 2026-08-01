const express = require('express');
const router = express.Router();
const { protect, superAdminOnly } = require('../middleware/authMiddleware');

const {
  getCompanyPayroll,
  getCompanyDepartments,
  finalizePayroll,
  getMySalary,  // 🆕
} = require('../controllers/payrollController');

const {
  downloadPayrollPDF,
} = require('../controllers/reportController');

// ═══════════════════════════════════════════
// SUPER ADMIN ROUTES
// ═══════════════════════════════════════════
router.get('/company', protect, superAdminOnly, getCompanyPayroll);
router.get('/departments', protect, superAdminOnly, getCompanyDepartments);
router.get('/download/pdf', protect, superAdminOnly, downloadPayrollPDF);
router.post('/finalize', protect, superAdminOnly, finalizePayroll);

// ═══════════════════════════════════════════
// 🆕 EMPLOYEE ROUTES - Sirf apni salary dekhega
// ═══════════════════════════════════════════
router.get('/my-salary', protect, getMySalary);

module.exports = router;