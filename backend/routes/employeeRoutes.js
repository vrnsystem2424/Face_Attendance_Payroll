// const express = require('express');
// const router = express.Router();
// const { protect, adminOnly } = require('../middleware/authMiddleware');
// const {
//   getAllEmployees,
//   getEmployee,
//   updateEmployee,
//   approveEmployee,
//   rejectEmployee,
//   registerFace,
//   deleteEmployee,
//   getDeletePreview,  // 🆕
//   getAllFaceEncodings,
//   updateSalary,
// } = require('../controllers/employeeController');

// router.get('/', protect, adminOnly, getAllEmployees);
// router.get('/me', protect, getEmployee);
// router.put('/update', protect, updateEmployee);
// router.put('/approve/:id', protect, adminOnly, approveEmployee);
// router.put('/reject/:id', protect, adminOnly, rejectEmployee);
// router.put('/salary/:id', protect, adminOnly, updateSalary);

// // 🆕 Delete preview (count records before delete)
// router.get('/delete-preview/:id', protect, adminOnly, getDeletePreview);
// router.delete('/:id', protect, adminOnly, deleteEmployee);

// router.post('/register-face', protect, registerFace);
// router.get('/face-encodings', protect, getAllFaceEncodings);

// module.exports = router;





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
  getDeletePreview,
  getAllFaceEncodings,
  updateSalary,
  updateDesignation, // 🆕
  updateManager,     // 🆕
} = require('../controllers/employeeController');

router.get('/', protect, adminOnly, getAllEmployees);
router.get('/me', protect, getEmployee);
router.put('/update', protect, updateEmployee);
router.put('/approve/:id', protect, adminOnly, approveEmployee);
router.put('/reject/:id', protect, adminOnly, rejectEmployee);
router.put('/salary/:id', protect, adminOnly, updateSalary);
router.put('/designation/:id', protect, adminOnly, updateDesignation); // 🆕
router.put('/manager/:id', protect, adminOnly, updateManager);         // 🆕

// Delete preview + delete
router.get('/delete-preview/:id', protect, adminOnly, getDeletePreview);
router.delete('/:id', protect, adminOnly, deleteEmployee);

router.post('/register-face', protect, registerFace);
router.get('/face-encodings', protect, getAllFaceEncodings);

module.exports = router;