// const express = require('express');
// const router = express.Router();
// const { 
//   register, 
//   login, 
//   adminLogin ,
//   createAdmin
// } = require('../controllers/authController');

// // Employee Register
// router.post('/register', register);

// // Employee Login
// router.post('/login', login);

// // Admin Login
// router.post('/admin-login', adminLogin);

// router.post('/create-admin', createAdmin); 

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
} = require('../controllers/authController');

// ── Public routes ──
router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/super-admin-login', superAdminLogin);   // 🆕

// ── Protected ──
router.get('/me', protect, getMe);                    // 🆕

// ── Super admin only — create new admin ──
router.post('/create-admin', protect, superAdminOnly, createAdmin);

module.exports = router;