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

module.exports = router;