const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  mobileNumber: {
    type: String,
    default: '254721810516'
  },
  paymentMethod: {
    type: String,
    enum: ['mobile_money', 'bank_transfer', 'credit_card'],
    default: 'mobile_money'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionId: String,
  purpose: {
    type: String,
    enum: ['prediction_access', 'balance_topup'],
    required: true
  },
  predictionsPurchased: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

module.exports = mongoose.model('Payment', paymentSchema);