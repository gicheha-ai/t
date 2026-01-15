const Payment = require('../models/Payment');
const User = require('../models/User');
const mpesaService = require('../integrations/mpesa/mpesa_service');

// @desc    Initiate M-Pesa payment
// @route   POST /api/payments/mpesa/initiate
const initiateMpesaPayment = async (req, res) => {
  try {
    const { amount, phoneNumber, purpose, predictionsCount } = req.body;
    const user = req.user;

    // Validate amount
    const minAmount = purpose === 'prediction_access' ? 0.1 : 1.0;
    if (amount < minAmount) {
      return res.status(400).json({ 
        message: `Minimum amount is $${minAmount}` 
      });
    }

    // Convert USD to KES (approximate)
    const amountInKES = Math.ceil(amount * 115); // 1 USD ≈ 115 KES

    // Create payment record
    const payment = await Payment.create({
      user: user._id,
      amount: amount,
      amountInKES: amountInKES,
      currency: 'USD',
      purpose,
      paymentMethod: 'mpesa',
      status: 'pending',
      predictionsPurchased: predictionsCount || Math.floor(amount / 0.1)
    });

    // Initiate M-Pesa STK Push
    const result = await mpesaService.initiateSTKPush(
      user,
      amountInKES,
      phoneNumber || user.phone,
      payment._id
    );

    res.json({
      success: true,
      paymentId: payment._id,
      message: 'Payment initiated successfully',
      checkoutRequestID: result.checkoutRequestID,
      merchantRequestID: result.merchantRequestID,
      customerMessage: result.customerMessage,
      instructions: [
        '1. Check your phone for M-Pesa prompt',
        '2. Enter your M-Pesa PIN',
        '3. Wait for confirmation',
        '4. Payment will be verified automatically'
      ]
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Payment initiation failed' 
    });
  }
};

// @desc    M-Pesa callback handler
// @route   POST /api/payments/mpesa/callback
const mpesaCallback = async (req, res) => {
  try {
    const result = await mpesaService.processCallback(req.body);
    
    if (result.success) {
      res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Success"
      });
    } else {
      res.status(200).json({
        ResultCode: 1,
        ResultDesc: result.error || "Failed"
      });
    }
  } catch (error) {
    console.error('Callback error:', error);
    res.status(200).json({
      ResultCode: 1,
      ResultDesc: "Callback processing failed"
    });
  }
};

// @desc    Query payment status
// @route   POST /api/payments/mpesa/query
const queryPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestID } = req.body;
    
    if (!checkoutRequestID) {
      return res.status(400).json({ message: 'Checkout request ID required' });
    }

    const result = await mpesaService.querySTKPush(checkoutRequestID);
    
    if (result.success && result.resultCode === '0') {
      // Update payment if successful
      const payment = await Payment.findOne({ transactionId: checkoutRequestID });
      if (payment) {
        payment.status = 'completed';
        await payment.save();
        
        // Update user balance
        const user = await User.findById(payment.user);
        if (payment.purpose === 'balance_topup') {
          user.balance += payment.amount;
          await user.save();
        }
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get payment instructions
// @route   GET /api/payments/instructions
const getPaymentInstructions = (req, res) => {
  try {
    const instructions = {
      mobileNumber: '254721810516',
      name: 'Predictions Pro',
      methods: [
        {
          name: 'M-Pesa STK Push (Recommended)',
          description: 'Instant payment via M-Pesa',
          steps: [
            '1. Enter your phone number',
            '2. Click "Pay with M-Pesa"',
            '3. Check your phone for M-Pesa prompt',
            '4. Enter your PIN to complete payment'
          ]
        },
        {
          name: 'Manual M-Pesa Payment',
          description: 'Send money manually',
          steps: [
            '1. Go to M-Pesa on your phone',
            '2. Select "Lipa Na M-Pesa"',
            '3. Choose "Pay Bill"',
            '4. Business Number: [YOUR_SHORTCODE]',
            '5. Account Number: PRED[payment_id]',
            '6. Enter amount in KES',
            '7. Enter your PIN'
          ]
        }
      ],
      exchangeRate: '1 USD ≈ 115 KES',
      minAmount: 0.1
    };

    res.json(instructions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export all functions including existing ones
module.exports = {
  initiateMpesaPayment,
  mpesaCallback,
  queryPaymentStatus,
  getPaymentInstructions,
  // Include existing functions
  initiatePayment: require('./paymentController_old').initiatePayment,
  verifyPayment: require('./paymentController_old').verifyPayment,
  getPaymentHistory: require('./paymentController_old').getPaymentHistory
};