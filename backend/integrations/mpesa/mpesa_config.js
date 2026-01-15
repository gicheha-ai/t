const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  // M-Pesa Daraja API Configuration
  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    shortCode: process.env.MPESA_SHORTCODE,
    initiatorName: process.env.MPESA_INITIATOR_NAME,
    securityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
    passkey: process.env.MPESA_PASSKEY,
    environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
    
    // URLs
    baseURL: process.env.MPESA_ENVIRONMENT === 'production' 
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke',
    
    endpoints: {
      auth: '/oauth/v1/generate?grant_type=client_credentials',
      stkPush: '/mpesa/stkpush/v1/processrequest',
      stkQuery: '/mpesa/stkpushquery/v1/query',
      b2c: '/mpesa/b2c/v1/paymentrequest',
      transactionStatus: '/mpesa/transactionstatus/v1/query',
      accountBalance: '/mpesa/accountbalance/v1/query'
    }
  },
  
  // Business Configuration
  business: {
    name: 'Predictions Pro',
    phone: '254721810516',
    callbackURL: process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/payments/mpesa-callback'
  }
};