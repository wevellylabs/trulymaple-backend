const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalog.controller');
const { protect } = require('../middlewares/auth.middleware');

// Protect বসানো আছে, অর্থাৎ শুধু লগইন করা ভেন্ডররাই সিঙ্ক শুরু করতে পারবে
router.post('/sync', protect, catalogController.startSync);

module.exports = router;