const axios = require('axios');
const crypto = require('crypto');
const config = require('./mpesa_config');
const Payment = require('../../models/Payment');
const User = require('../../models/User');

class MpesaService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
  }

  // Generate access token
  async generateToken() {
    try {
      const auth = Buffer.from(`${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`).toString('base64');
      
      const response = await axios.get(`${config.mpesa.baseURL}${config.mpesa.endpoints.auth}`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      this.token = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      return this.token;
    } catch (error) {
      console.error('M-Pesa Token Generation Error:', error.response?.data || error.message);
      throw new Error('Failed to generate M-Pesa access token');
    }
  }

  // Check if token is valid
  async getValidToken() {
    if (!this.token || Date.now() >= this.tokenExpiry) {
      await this.generateToken();
    }
    return this.token;
  }

  // Generate timestamp
  getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  // Generate password for STK Push
  generatePassword(timestamp) {
    const data = config.mpesa.shortCode + config.mpesa.passkey + timestamp;
    return Buffer.from(data).toString('base64');
  }

  // Initiate STK Push (Customer to Business)
  async initiateSTKPush(user, amount, phoneNumber, paymentId) {
    try {
      const token = await this.getValidToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword(timestamp);
      
      // Format phone number (remove + and ensure 254 format)
      let formattedPhone = phoneNumber.replace('+', '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }

      const requestData = {
        BusinessShortCode: config.mpesa.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount), // M-Pesa expects whole numbers
        PartyA: formattedPhone,
        PartyB: config.mpesa.shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: config.business.callbackURL,
        AccountReference: `PRED${paymentId}`,
        TransactionDesc: `Predictions purchase - ${paymentId}`
      };

      const response = await axios.post(
        `${config.mpesa.baseURL}${config.mpesa.endpoints.stkPush}`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.ResponseCode === '0') {
        // Update payment with checkout request ID
        await Payment.findByIdAndUpdate(paymentId, {
          transactionId: response.data.CheckoutRequestID,
          mpesaResponse: response.data
        });

        return {
          success: true,
          checkoutRequestID: response.data.CheckoutRequestID,
          merchantRequestID: response.data.MerchantRequestID,
          customerMessage: response.data.CustomerMessage,
          amount: amount,
          phone: formattedPhone
        };
      } else {
        throw new Error(response.data.ResponseDescription || 'STK Push failed');
      }
    } catch (error) {
      console.error('STK Push Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessage || 'Payment initiation failed');
    }
  }

  // Query STK Push status
  async querySTKPush(checkoutRequestID) {
    try {
      const token = await this.getValidToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword(timestamp);

      const requestData = {
        BusinessShortCode: config.mpesa.shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
      };

      const response = await axios.post(
        `${config.mpesa.baseURL}${config.mpesa.endpoints.stkQuery}`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.ResponseCode === '0',
        resultCode: response.data.ResultCode,
        resultDesc: response.data.ResultDesc,
        checkoutRequestID: checkoutRequestID,
        response: response.data
      };
    } catch (error) {
      console.error('STK Query Error:', error.response?.data || error.message);
      throw new Error('Failed to query payment status');
    }
  }

  // Process callback from M-Pesa
  async processCallback(callbackData) {
    try {
      const body = callbackData.Body;
      const stkCallback = body.stkCallback;
      
      if (!stkCallback || !stkCallback.CheckoutRequestID) {
        throw new Error('Invalid callback data');
      }

      const payment = await Payment.findOne({ 
        transactionId: stkCallback.CheckoutRequestID 
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Check result code
      if (stkCallback.ResultCode === 0) {
        // Payment successful
        const callbackMetadata = stkCallback.CallbackMetadata;
        const metadataItems = callbackMetadata.Item || [];
        
        let amount = 0;
        let mpesaReceiptNumber = '';
        let phoneNumber = '';

        metadataItems.forEach(item => {
          if (item.Name === 'Amount') amount = item.Value;
          if (item.Name === 'MpesaReceiptNumber') mpesaReceiptNumber = item.Value;
          if (item.Name === 'PhoneNumber') phoneNumber = item.Value;
        });

        payment.status = 'completed';
        payment.mpesaReceiptNumber = mpesaReceiptNumber;
        payment.completedAt = new Date();
        payment.metadata = {
          amount: amount,
          phoneNumber: phoneNumber,
          transactionDate: new Date()
        };

        await payment.save();

        // Update user balance
        const user = await User.findById(payment.user);
        if (payment.purpose === 'balance_topup') {
          user.balance += payment.amount;
          await user.save();
        }

        return {
          success: true,
          paymentId: payment._id,
          receiptNumber: mpesaReceiptNumber,
          amount: amount,
          message: 'Payment completed successfully'
        };
      } else {
        // Payment failed
        payment.status = 'failed';
        payment.failureReason = stkCallback.ResultDesc;
        await payment.save();

        return {
          success: false,
          paymentId: payment._id,
          error: stkCallback.ResultDesc
        };
      }
    } catch (error) {
      console.error('Callback Processing Error:', error.message);
      throw error;
    }
  }

  // Send B2C payment (Business to Customer - for refunds)
  async sendB2CPayment(phoneNumber, amount, remarks) {
    try {
      const token = await this.getValidToken();
      
      const requestData = {
        InitiatorName: config.mpesa.initiatorName,
        SecurityCredential: config.mpesa.securityCredential,
        CommandID: 'BusinessPayment',
        Amount: Math.round(amount),
        PartyA: config.mpesa.shortCode,
        PartyB: phoneNumber,
        Remarks: remarks,
        QueueTimeOutURL: `${config.business.callbackURL}/b2c-timeout`,
        ResultURL: `${config.business.callbackURL}/b2c-result`,
        Occasion: 'Refund'
      };

      const response = await axios.post(
        `${config.mpesa.baseURL}${config.mpesa.endpoints.b2c}`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.ResponseCode === '0',
        transactionId: response.data.TransactionID,
        conversationId: response.data.ConversationID,
        response: response.data
      };
    } catch (error) {
      console.error('B2C Payment Error:', error.response?.data || error.message);
      throw new Error('B2C payment failed');
    }
  }

  // Check transaction status
  async checkTransactionStatus(transactionID) {
    try {
      const token = await this.getValidToken();
      
      const requestData = {
        Initiator: config.mpesa.initiatorName,
        SecurityCredential: config.mpesa.securityCredential,
        CommandID: 'TransactionStatusQuery',
        TransactionID: transactionID,
        PartyA: config.mpesa.shortCode,
        IdentifierType: '4',
        ResultURL: `${config.business.callbackURL}/transaction-status`,
        QueueTimeOutURL: `${config.business.callbackURL}/transaction-status-timeout`,
        Remarks: 'Transaction status check',
        Occasion: 'StatusCheck'
      };

      const response = await axios.post(
        `${config.mpesa.baseURL}${config.mpesa.endpoints.transactionStatus}`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.ResponseCode === '0',
        response: response.data
      };
    } catch (error) {
      console.error('Transaction Status Error:', error.response?.data || error.message);
      throw new Error('Failed to check transaction status');
    }
  }
}

module.exports = new MpesaService();