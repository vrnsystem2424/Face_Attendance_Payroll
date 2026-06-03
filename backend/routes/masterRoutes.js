const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public - Register form ke liye
router.get('/', masterController.getAllMasterData);
router.get('/:type', masterController.getByType);

// Admin only
router.post('/', protect, adminOnly, masterController.addMasterData);
router.put('/:id', protect, adminOnly, masterController.updateMasterData);
router.delete('/:id', protect, adminOnly, masterController.deleteMasterData);

module.exports = router;