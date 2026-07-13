
// const express = require('express');
// const router = express.Router();
// const { protect, superAdminOnly } = require('../middleware/authMiddleware');
// const {
//   register,
//   login,
//   adminLogin,
//   superAdminLogin,
//   createAdmin,
//   getMe,
// } = require('../controllers/authController');

// // ── Public routes ──
// router.post('/register', register);
// router.post('/login', login);
// router.post('/admin-login', adminLogin);
// router.post('/super-admin-login', superAdminLogin);   // 🆕

// // ── Protected ──
// router.get('/me', protect, getMe);                    // 🆕

// // ── Super admin only — create new admin ──
// router.post('/create-admin', protect, superAdminOnly, createAdmin);

// module.exports = router;




const express = require('express');
const router = express.Router();
const { protect, superAdminOnly } = require('../middleware/authMiddleware');
const {
  register,
  login,
  adminLogin,
  superAdminLogin,
  createAdmin,
  getMe,
  forgotPassword,  // 🆕
  verifyOTP,       // 🆕
  resetPassword,   // 🆕
} = require('../controllers/authController');

// ── Public routes ──
router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/super-admin-login', superAdminLogin);

// ── 🆕 Forgot Password routes ──
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// ── Protected ──
router.get('/me', protect, getMe);

// ── Super admin only ──
router.post('/create-admin', protect, superAdminOnly, createAdmin);

module.exports = router;