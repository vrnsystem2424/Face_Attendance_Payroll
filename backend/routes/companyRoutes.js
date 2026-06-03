// routes/companyRoutes.js

const express = require('express');
const router = express.Router();
const { protect, superAdminOnly } = require('../middleware/authMiddleware');
const {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats,
} = require('../controllers/companyController');

// ── Public ──
router.get('/', getAllCompanies);

// ── Super admin only ──
router.get('/stats', protect, superAdminOnly, getCompanyStats);
router.get('/:id', protect, getCompanyById);
router.post('/', protect, superAdminOnly, createCompany);
router.put('/:id', protect, superAdminOnly, updateCompany);
router.delete('/:id', protect, superAdminOnly, deleteCompany);

module.exports = router;