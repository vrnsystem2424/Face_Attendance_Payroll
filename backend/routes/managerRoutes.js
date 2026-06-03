// routes/managerRoutes.js

const express = require('express');
const router = express.Router();
const { protect, managerOnly } = require('../middleware/authMiddleware');
const {
  getMyTeam,
  getPendingLeaves,
  getAllMyLeaves,
  approveLeave,
  rejectLeave,
  getManagerStats,
} = require('../controllers/managerController');

// All routes need manager role (or above)
router.use(protect, managerOnly);

router.get('/stats', getManagerStats);
router.get('/team', getMyTeam);
router.get('/leaves', getAllMyLeaves);
router.get('/leaves/pending', getPendingLeaves);
router.put('/leaves/:id/approve', approveLeave);
router.put('/leaves/:id/reject', rejectLeave);

module.exports = router;