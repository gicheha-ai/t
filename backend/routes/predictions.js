const express = require('express');
const router = express.Router();
const { 
  getFootballOdds, 
  getForexPairs, 
  accessPrediction,
  getPredictionHistory,
  getAccessStatus
} = require('../controllers/predictionController');
const { protect } = require('../middleware/auth');

router.get('/football/odds', getFootballOdds);
router.get('/forex/pairs', getForexPairs);
router.post('/access', protect, accessPrediction);
router.get('/history', protect, getPredictionHistory);
router.get('/status', protect, getAccessStatus);

module.exports = router;