// const express = require('express');
// const router = express.Router();
// const { protect, superAdminOnly } = require('../middleware/authMiddleware');

// const {
//   getCompanyPayroll,
//   getCompanyDepartments,
//   finalizePayroll,
//   getMySalary,
// } = require('../controllers/payrollController');

// const {
//   downloadPayrollPDF,
//   downloadPayrollCSV,  // 🆕
// } = require('../controllers/reportController');

// // Super Admin Routes
// router.get('/company', protect, superAdminOnly, getCompanyPayroll);
// router.get('/departments', protect, superAdminOnly, getCompanyDepartments);
// router.get('/download/pdf', protect, superAdminOnly, downloadPayrollPDF);
// router.get('/download/csv', protect, superAdminOnly, downloadPayrollCSV);  // 🆕
// router.post('/finalize', protect, superAdminOnly, finalizePayroll);

// // Employee Routes
// router.get('/my-salary', protect, getMySalary);

// module.exports = router;





const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

const {
  getCompanyPayroll,
  getCompanyDepartments,
  finalizePayroll,
  getMySalary,
} = require('../controllers/payrollController');

const {
  downloadPayrollPDF,
  downloadPayrollCSV,
} = require('../controllers/reportController');

// 🆕 Super Admin + Account Routes (dono ko access)
router.get('/company', protect, authorize('super_admin', 'account'), getCompanyPayroll);
router.get('/departments', protect, authorize('super_admin', 'account'), getCompanyDepartments);
router.get('/download/pdf', protect, authorize('super_admin', 'account'), downloadPayrollPDF);
router.get('/download/csv', protect, authorize('super_admin', 'account'), downloadPayrollCSV);
router.post('/finalize', protect, authorize('super_admin', 'account'), finalizePayroll);

// Employee Routes
router.get('/my-salary', protect, getMySalary);

module.exports = router;