// // routes/payrollRoutes.js

// const express = require('express');
// const router = express.Router();
// const { protect, superAdminOnly } = require('../middleware/authMiddleware');

// const {
//   getCompanyPayroll,
//   getCompanyDepartments,
// } = require('../controllers/payrollController');

// const {
//   downloadPayrollPDF,
// } = require('../controllers/reportController');

// // ════════════════════════════════════════════
// // SUPER ADMIN ONLY ROUTES
// // ════════════════════════════════════════════

// // Get payroll data for a company
// router.get('/company', protect, superAdminOnly, getCompanyPayroll);

// // Get departments list for filter dropdown
// router.get('/departments', protect, superAdminOnly, getCompanyDepartments);

// // Download PDF report
// router.get('/download/pdf', protect, superAdminOnly, downloadPayrollPDF);

// module.exports = router;




const express = require('express');
const router = express.Router();
const { protect, superAdminOnly } = require('../middleware/authMiddleware');

const {
  getCompanyPayroll,
  getCompanyDepartments,
  finalizePayroll,  // 🆕
} = require('../controllers/payrollController');

const {
  downloadPayrollPDF,
} = require('../controllers/reportController');

router.get('/company', protect, superAdminOnly, getCompanyPayroll);
router.get('/departments', protect, superAdminOnly, getCompanyDepartments);
router.get('/download/pdf', protect, superAdminOnly, downloadPayrollPDF);

// 🆕 Finalize payroll - actual balance se cut
router.post('/finalize', protect, superAdminOnly, finalizePayroll);

module.exports = router;