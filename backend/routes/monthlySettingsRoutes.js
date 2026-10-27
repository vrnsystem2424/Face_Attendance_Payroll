// // routes/monthlySettingsRoutes.js

// const express = require('express');
// const router = express.Router();
// const { protect, adminOnly } = require('../middleware/authMiddleware');
// const {
//   getMonthlySettings,
//   upsertMonthlySettings,
//   addHoliday,
//   removeHoliday,
//   getAllSettings,
// } = require('../controllers/monthlySettingsController');

// // Get settings for specific month
// router.get('/', protect, getMonthlySettings);

// // Get all settings (admin overview)
// router.get('/all', protect, adminOnly, getAllSettings);

// // Create/Update settings
// router.post('/', protect, adminOnly, upsertMonthlySettings);

// // Holiday management
// router.post('/holiday/add', protect, adminOnly, addHoliday);
// router.post('/holiday/remove', protect, adminOnly, removeHoliday);

// module.exports = router;





// routes/monthlySettingsRoutes.js

const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getMonthlySettings,
  upsertMonthlySettings,
  addHoliday,
  removeHoliday,
  getAllSettings,
} = require('../controllers/monthlySettingsController');

// Get settings for specific month (Sabhi employees ke liye)
router.get('/', protect, getMonthlySettings);

// ✅ Get all settings (Sabhi employees ke liye taaki Dashboard par upcoming holidays dikhe)
router.get('/all', protect, getAllSettings);

// Create/Update settings (Sirf Admin ke liye)
router.post('/', protect, adminOnly, upsertMonthlySettings);

// Holiday management (Sirf Admin ke liye)
router.post('/holiday/add', protect, adminOnly, addHoliday);
router.post('/holiday/remove', protect, adminOnly, removeHoliday);

module.exports = router;