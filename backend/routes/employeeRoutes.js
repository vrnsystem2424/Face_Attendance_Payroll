const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getAllEmployees,
  getEmployee,
  updateEmployee,
  approveEmployee,
  rejectEmployee,
  registerFace,
  deleteEmployee,
  getAllFaceEncodings,
  updateSalary,   // 🆕
} = require('../controllers/employeeController');

// Employee routes
router.get('/', protect, adminOnly, getAllEmployees);
router.get('/me', protect, getEmployee);
router.put('/update', protect, updateEmployee);
router.put('/approve/:id', protect, adminOnly, approveEmployee);
router.put('/reject/:id', protect, adminOnly, rejectEmployee);
router.put('/salary/:id', protect, adminOnly, updateSalary);   // 🆕
router.delete('/:id', protect, adminOnly, deleteEmployee);
router.post('/register-face', protect, registerFace);
router.get('/face-encodings', protect, getAllFaceEncodings);

module.exports = router;