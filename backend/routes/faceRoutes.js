// routes/faceRoutes.js
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { 
  registerFace, 
  getAllFaceEncodings 
} = require('../controllers/faceController');

router.post('/register', protect, registerFace);
router.get('/all-encodings', protect, adminOnly, getAllFaceEncodings);

module.exports = router;