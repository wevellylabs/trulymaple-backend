const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kyc.controller');

// POST রিকোয়েস্ট: /v1/kyc/generate-link
router.post('/generate-link', kycController.generateKycLink);

module.exports = router;