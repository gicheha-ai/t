const crypto = require('crypto');

class SimpleFootballPredictor {
  constructor() {
    this.teamRatings = {
      'Real Madrid': 92, 'Bayern Munich': 90, 'Manchester City': 94,
      'PSG': 89, 'Liverpool': 91, 'Barcelona': 88, 'Juventus': 87,
      'Chelsea': 86, 'Manchester United': 85, 'Arsenal': 84
    };
  }

  // Deterministic random based on match data
  deterministicRandom(matchData) {
    const str = JSON.stringify(matchData);
    const hash = crypto.createHash('md5').update(str).digest('hex');
    return parseInt(hash.substring(0, 8), 16) / 4294967295;
  }

  async predict(matchData) {
    const { homeTeam, awayTeam, homeForm = 0.7, awayForm = 0.7 } = matchData;
    
    const homeRating = this.teamRatings[homeTeam] || 80;
    const awayRating = this.teamRatings[awayTeam] || 80;
    
    // Enhanced probability calculation
    const ratingDiff = (homeRating - awayRating) / 100;
    const homeAdvantage = 0.15;
    const formDiff = (homeForm - awayForm) * 0.1;
    
    let homeWinProb = 0.33 + ratingDiff + homeAdvantage + formDiff;
    let drawProb = 0.34 - Math.abs(ratingDiff) * 0.1;
    let awayWinProb = 0.33 - ratingDiff - formDiff;
    
    // Add small deterministic randomness
    const rand = this.deterministicRandom(matchData) * 0.1 - 0.05;
    homeWinProb += rand;
    awayWinProb -= rand;
    
    // Normalize
    const total = homeWinProb + drawProb + awayWinProb;
    homeWinProb /= total;
    drawProb /= total;
    awayWinProb /= total;
    
    const maxProb = Math.max(homeWinProb, drawProb, awayWinProb);
    let predictedOutcome, confidence;
    
    if (maxProb === homeWinProb) {
      predictedOutcome = 'Home Win';
      confidence = maxProb > 0.55 ? 'High' : maxProb > 0.45 ? 'Medium' : 'Low';
    } else if (maxProb === drawProb) {
      predictedOutcome = 'Draw';
      confidence = maxProb > 0.4 ? 'Medium' : 'Low';
    } else {
      predictedOutcome = 'Away Win';
      confidence = maxProb > 0.55 ? 'High' : maxProb > 0.45 ? 'Medium' : 'Low';
    }
    
    // Predict score
    const homeGoals = Math.max(0, Math.round(1.5 + (homeRating - 80) / 20 + (Math.random() - 0.5)));
    const awayGoals = Math.max(0, Math.round(1.0 + (awayRating - 80) / 20 + (Math.random() - 0.5)));
    
    return {
      predictions: {
        home_win: parseFloat(homeWinProb.toFixed(3)),
        draw: parseFloat(drawProb.toFixed(3)),
        away_win: parseFloat(awayWinProb.toFixed(3))
      },
      predicted_outcome: predictedOutcome,
      confidence_score: parseFloat(maxProb.toFixed(3)),
      confidence_level: confidence,
      recommendation: `${confidence} confidence in ${predictedOutcome}`,
      expected_score: `${homeGoals}-${awayGoals}`
    };
  }
}

class SimpleForexPredictor {
  constructor() {
    this.pairData = {};
  }

  async predict(currencyPair, marketData) {
    const { currentPrice = 1.0, rsi = 50 } = marketData;
    
    let recommendation, confidence;
    
    if (rsi < 30) {
      recommendation = 'BUY';
      confidence = 0.7;
    } else if (rsi > 70) {
      recommendation = 'SELL';
      confidence = 0.7;
    } else if (rsi > 50) {
      recommendation = 'BUY';
      confidence = 0.6;
    } else {
      recommendation = 'SELL';
      confidence = 0.6;
    }
    
    return {
      recommendation,
      confidence: parseFloat(confidence.toFixed(3)),
      current_price: parseFloat(currentPrice.toFixed(5)),
      support: parseFloat((currentPrice * 0.99).toFixed(5)),
      resistance: parseFloat((currentPrice * 1.01).toFixed(5)),
      entry_price: parseFloat(currentPrice.toFixed(5)),
      stop_loss: recommendation === 'BUY' ? parseFloat((currentPrice * 0.99).toFixed(5)) : parseFloat((currentPrice * 1.01).toFixed(5)),
      take_profit: recommendation === 'BUY' ? parseFloat((currentPrice * 1.02).toFixed(5)) : parseFloat((currentPrice * 0.98).toFixed(5)),
      timeframe: '4H',
      risk_level: 'MEDIUM'
    };
  }
}

module.exports = { SimpleFootballPredictor, SimpleForexPredictor };