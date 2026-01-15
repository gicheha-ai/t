const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['football', 'forex'],
    required: true
  },
  details: {
    // For football predictions
    match: String,
    league: {
      type: String,
      enum: ['Champions League', 'Europa League']
    },
    homeTeam: String,
    awayTeam: String,
    odds: {
      homeWin: Number,
      draw: Number,
      awayWin: Number
    },
    prediction: {
      outcome: String,
      confidence: Number,
      recommendedBet: String
    },
    
    // For forex predictions
    currencyPair: String,
    timeframe: String,
    analysis: {
      trend: String,
      support: Number,
      resistance: Number,
      recommendation: {
        type: String,
        enum: ['BUY', 'SELL', 'HOLD']
      },
      entryPrice: Number,
      takeProfit: Number,
      stopLoss: Number,
      confidence: Number
    }
  },
  isFree: {
    type: Boolean,
    default: false
  },
  cost: {
    type: Number,
    default: 0.1
  },
  accessedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 24*60*60*1000) // 24 hours
  }
});

module.exports = mongoose.model('Prediction', predictionSchema);