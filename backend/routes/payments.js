const express = require('express');
const router = express.Router();
const { 
  initiatePayment, 
  verifyPayment, 
  getPaymentInstructions,
  getPaymentHistory
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/initiate', protect, initiatePayment);
router.post('/verify', protect, verifyPayment);
router.get('/instructions', getPaymentInstructions);
router.get('/history', protect, getPaymentHistory);

module.exports = router;