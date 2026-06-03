const express = require('express');
const router = express.Router();

const siteController = require('../controllers/siteController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', siteController.getAllSites);
router.post('/', protect, adminOnly, siteController.addSite);
router.put('/:id', protect, adminOnly, siteController.updateSite);
router.delete('/:id', protect, adminOnly, siteController.deleteSite);

module.exports = router;