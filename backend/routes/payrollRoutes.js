// routes/payrollRoutes.js

const express = require('express');
const router = express.Router();
const { protect, superAdminOnly } = require('../middleware/authMiddleware');

const {
  getCompanyPayroll,
  getCompanyDepartments,
} = require('../controllers/payrollController');

const {
  downloadPayrollPDF,
} = require('../controllers/reportController');

// ════════════════════════════════════════════
// SUPER ADMIN ONLY ROUTES
// ════════════════════════════════════════════

// Get payroll data for a company
router.get('/company', protect, superAdminOnly, getCompanyPayroll);

// Get departments list for filter dropdown
router.get('/departments', protect, superAdminOnly, getCompanyDepartments);

// Download PDF report
router.get('/download/pdf', protect, superAdminOnly, downloadPayrollPDF);

module.exports = router;