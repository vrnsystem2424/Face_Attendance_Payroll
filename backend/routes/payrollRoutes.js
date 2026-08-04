const express = require('express');
const router = express.Router();
const { protect, superAdminOnly } = require('../middleware/authMiddleware');

const {
  getCompanyPayroll,
  getCompanyDepartments,
  finalizePayroll,
  getMySalary,
} = require('../controllers/payrollController');

const {
  downloadPayrollPDF,
  downloadPayrollCSV,  // 🆕
} = require('../controllers/reportController');

// Super Admin Routes
router.get('/company', protect, superAdminOnly, getCompanyPayroll);
router.get('/departments', protect, superAdminOnly, getCompanyDepartments);
router.get('/download/pdf', protect, superAdminOnly, downloadPayrollPDF);
router.get('/download/csv', protect, superAdminOnly, downloadPayrollCSV);  // 🆕
router.post('/finalize', protect, superAdminOnly, finalizePayroll);

// Employee Routes
router.get('/my-salary', protect, getMySalary);

module.exports = router;