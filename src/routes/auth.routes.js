const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
// Middleware ইমপোর্ট করা হলো
const { protect } = require('../middlewares/auth.middleware');

// Public Routes (লগইন বা টোকেন লাগে না)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected Route (এখানে protect মিডলওয়্যারটি গার্ড হিসেবে বসানো হলো)
router.get('/profile', protect, authController.getProfile);

module.exports = router;