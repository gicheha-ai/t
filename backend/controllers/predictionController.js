const Prediction = require('../models/Prediction');
const User = require('../models/User');
const footballOddsService = require('../services/footballOdds');
const forexPredictionsService = require('../services/forexPredictions');

// @desc    Get football odds
// @route   GET /api/predictions/football/odds
const getFootballOdds = async (req, res) => {
  try {
    const championsLeague = await footballOddsService.getChampionsLeagueOdds();
    const europaLeague = await footballOddsService.getEuropaLeagueOdds();
    
    res.json({
      championsLeague,
      europaLeague,
      lastUpdated: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get forex predictions list
// @route   GET /api/predictions/forex/pairs
const getForexPairs = async (req, res) => {
  try {
    const pairs = await forexPredictionsService.getAllPairs();
    const marketAnalysis = await forexPredictionsService.getMarketAnalysis();
    
    res.json({
      pairs,
      marketAnalysis,
      lastUpdated: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get specific prediction
// @route   POST /api/predictions/access
const accessPrediction = async (req, res) => {
  try {
    const { type, identifier } = req.body;
    const user = req.user;
    
    // Check if user has free predictions remaining
    let isFree = user.freePredictionsUsed < 4;
    
    if (!isFree) {
      // Check user balance
      if (user.balance < 0.1) {
        return res.status(402).json({ 
          message: 'Insufficient balance. Please top up to access predictions.',
          requiredAmount: 0.1,
          currentBalance: user.balance
        });
      }
    }
    
    let predictionData;
    
    if (type === 'football') {
      predictionData = await footballOddsService.getMatchPrediction(identifier);
    } else if (type === 'forex') {
      predictionData = await forexPredictionsService.getPrediction(identifier);
    } else {
      return res.status(400).json({ message: 'Invalid prediction type' });
    }
    
    // Record prediction access
    const prediction = await Prediction.create({
      user: user._id,
      type,
      details: type === 'football' ? 
        { 
          match: predictionData.match,
          league: predictionData.league,
          homeTeam: predictionData.homeTeam,
          awayTeam: predictionData.awayTeam,
          odds: predictionData.odds,
          prediction: predictionData.prediction
        } :
        {
          currencyPair: predictionData.currencyPair,
          timeframe: predictionData.timeframe,
          analysis: predictionData.analysis
        },
      isFree,
      cost: isFree ? 0 : 0.1
    });
    
    // Update user stats
    if (isFree) {
      user.freePredictionsUsed += 1;
    } else {
      user.balance -= 0.1;
    }
    
    user.totalPredictionsAccessed += 1;
    await user.save();
    
    res.json({
      prediction: predictionData,
      accessDetails: {
        isFree,
        cost: isFree ? 0 : 0.1,
        freePredictionsRemaining: Math.max(0, 4 - user.freePredictionsUsed),
        balance: user.balance,
        accessedAt: new Date()
      }
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's prediction history
// @route   GET /api/predictions/history
const getPredictionHistory = async (req, res) => {
  try {
    const predictions = await Prediction.find({ user: req.user._id })
      .sort('-accessedAt')
      .limit(50);
    
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check prediction access status
// @route   GET /api/predictions/status
const getAccessStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      freePredictionsUsed: user.freePredictionsUsed,
      freePredictionsRemaining: Math.max(0, 4 - user.freePredictionsUsed),
      totalPredictionsAccessed: user.totalPredictionsAccessed,
      balance: user.balance,
      nextPredictionCost: user.freePredictionsUsed < 4 ? 0 : 0.1
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFootballOdds,
  getForexPairs,
  accessPrediction,
  getPredictionHistory,
  getAccessStatus
};