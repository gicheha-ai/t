const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

class FootballPredictor {
  constructor() {
    this.teamRatings = {
      // Champions League Teams
      'Real Madrid': 92, 'Bayern Munich': 90, 'Manchester City': 94,
      'PSG': 89, 'Barcelona': 88, 'Juventus': 87, 'Atletico Madrid': 86,
      'Borussia Dortmund': 85, 'Inter Milan': 84, 'AC Milan': 83,
      'Napoli': 82, 'RB Leipzig': 81, 'Porto': 80, 'Benfica': 79,
      
      // Europa League Teams
      'Liverpool': 91, 'Roma': 82, 'Sevilla': 81, 'Leverkusen': 80,
      'West Ham': 79, 'Brighton': 78, 'Rangers': 77, 'Sporting': 76,
      'Villarreal': 75, 'Freiburg': 74, 'Marseille': 73, 'Ajax': 72
    };
    
    this.leagueImportance = {
      'Champions League': 1.0,
      'Europa League': 0.8,
      'Quarter Final': 1.2,
      'Semi Final': 1.3,
      'Final': 1.5
    };
  }

  async predict(matchData) {
    try {
      const { 
        homeTeam, 
        awayTeam, 
        league = 'Champions League',
        stage = 'Group Stage',
        homeForm = this.getRecentForm(homeTeam),
        awayForm = this.getRecentForm(awayTeam),
        injuries = { home: 0, away: 0 }
      } = matchData;
      
      const homeRating = this.teamRatings[homeTeam] || 78;
      const awayRating = this.teamRatings[awayTeam] || 78;
      
      // Calculate probabilities with multiple factors
      const baseProb = this.calculateBaseProbability(homeRating, awayRating);
      const formFactor = this.calculateFormFactor(homeForm, awayForm);
      const homeAdvantage = 0.15; // Home advantage factor
      const injuryFactor = this.calculateInjuryFactor(injuries.home, injuries.away);
      const importanceFactor = this.leagueImportance[league] || 1.0;
      
      // Combine factors
      let homeWinProb = baseProb.home * formFactor.home * (1 + homeAdvantage) * injuryFactor.home * importanceFactor;
      let awayWinProb = baseProb.away * formFactor.away * injuryFactor.away * importanceFactor;
      let drawProb = baseProb.draw * (formFactor.home + formFactor.away) / 2 * injuryFactor.draw;
      
      // Normalize probabilities
      const total = homeWinProb + drawProb + awayWinProb;
      homeWinProb /= total;
      drawProb /= total;
      awayWinProb /= total;
      
      // Add some randomness for realistic predictions
      homeWinProb += (Math.random() - 0.5) * 0.05;
      drawProb += (Math.random() - 0.5) * 0.05;
      awayWinProb += (Math.random() - 0.5) * 0.05;
      
      // Renormalize after adding randomness
      const newTotal = homeWinProb + drawProb + awayWinProb;
      homeWinProb /= newTotal;
      drawProb /= newTotal;
      awayWinProb /= newTotal;
      
      // Determine outcome and confidence
      const maxProb = Math.max(homeWinProb, drawProb, awayWinProb);
      const predictedOutcome = this.getPredictedOutcome(homeWinProb, drawProb, awayWinProb);
      
      // Generate recommendation
      const { recommendation, confidence } = this.generateRecommendation(predictedOutcome, maxProb);
      
      // Predict score
      const expectedScore = this.predictScore(homeRating, awayRating, homeForm, awayForm);
      
      // Calculate value odds
      const valueOdds = this.calculateValueOdds(homeWinProb, drawProb, awayWinProb);
      
      return {
        success: true,
        predictions: {
          home_win: parseFloat(homeWinProb.toFixed(3)),
          draw: parseFloat(drawProb.toFixed(3)),
          away_win: parseFloat(awayWinProb.toFixed(3))
        },
        predicted_outcome: predictedOutcome,
        confidence_score: parseFloat(maxProb.toFixed(3)),
        confidence_level: confidence,
        recommendation: recommendation,
        expected_score: expectedScore,
        analysis: this.generateAnalysis(homeTeam, awayTeam, predictedOutcome, maxProb),
        value_odds: valueOdds,
        risk_level: maxProb > 0.7 ? 'LOW' : maxProb > 0.5 ? 'MEDIUM' : 'HIGH'
      };
      
    } catch (error) {
      console.error('Football prediction error:', error);
      return this.getFallbackPrediction();
    }
  }

  calculateBaseProbability(homeRating, awayRating) {
    const ratingDiff = (homeRating - awayRating) / 100;
    
    // Base probabilities adjusted by rating difference
    return {
      home: 0.35 + ratingDiff * 0.3,
      draw: 0.30 - Math.abs(ratingDiff) * 0.1,
      away: 0.35 - ratingDiff * 0.3
    };
  }

  calculateFormFactor(homeForm, awayForm) {
    // Convert form string (e.g., "WWDLW") to numerical factor
    const homeFormScore = this.formStringToScore(homeForm);
    const awayFormScore = this.formStringToScore(awayForm);
    
    return {
      home: 0.8 + homeFormScore * 0.4,
      away: 0.8 + awayFormScore * 0.4,
      draw: 1.0
    };
  }

  calculateInjuryFactor(homeInjuries, awayInjuries) {
    const injuryImpact = 0.05; // 5% impact per key injury
    
    return {
      home: 1 - (awayInjuries * injuryImpact),
      away: 1 - (homeInjuries * injuryImpact),
      draw: 1 - ((homeInjuries + awayInjuries) * injuryImpact * 0.5)
    };
  }

  getRecentForm(teamName) {
    // Mock recent form data
    const forms = ['W', 'W', 'D', 'L', 'W'];
    return forms[Math.floor(Math.random() * forms.length)] + forms[Math.floor(Math.random() * forms.length)] + 
           forms[Math.floor(Math.random() * forms.length)] + forms[Math.floor(Math.random() * forms.length)] + 
           forms[Math.floor(Math.random() * forms.length)];
  }

  formStringToScore(formString) {
    if (!formString || formString.length !== 5) return 0.5;
    
    let score = 0;
    for (let char of formString) {
      if (char === 'W') score += 0.2;
      else if (char === 'D') score += 0.1;
      else if (char === 'L') score += 0;
    }
    return score;
  }

  getPredictedOutcome(homeProb, drawProb, awayProb) {
    const maxProb = Math.max(homeProb, drawProb, awayProb);
    
    if (maxProb === homeProb) return 'Home Win';
    if (maxProb === drawProb) return 'Draw';
    return 'Away Win';
  }

  generateRecommendation(outcome, confidence) {
    let recommendation, confidenceLevel;
    
    if (confidence > 0.7) {
      confidenceLevel = 'High';
      recommendation = `Strong bet on ${outcome}`;
    } else if (confidence > 0.55) {
      confidenceLevel = 'Medium';
      recommendation = `Moderate bet on ${outcome}`;
    } else if (confidence > 0.45) {
      confidenceLevel = 'Low';
      recommendation = `Small stake on ${outcome} or avoid`;
    } else {
      confidenceLevel = 'Very Low';
      recommendation = 'Avoid betting - no clear outcome';
    }
    
    return { recommendation, confidence: confidenceLevel };
  }

  predictScore(homeRating, awayRating, homeForm, awayForm) {
    const homeFormScore = this.formStringToScore(homeForm);
    const awayFormScore = this.formStringToScore(awayForm);
    
    // Base goals with random variation
    const homeBase = 1.5 + (homeRating - 80) / 20 + homeFormScore * 0.5;
    const awayBase = 1.0 + (awayRating - 80) / 20 + awayFormScore * 0.5;
    
    // Add Poisson randomness
    const homeGoals = Math.max(0, Math.round(homeBase + (Math.random() - 0.5) * 0.8));
    const awayGoals = Math.max(0, Math.round(awayBase + (Math.random() - 0.5) * 0.8));
    
    // Ensure at least one goal in most matches
    if (homeGoals === 0 && awayGoals === 0) {
      return Math.random() > 0.5 ? '1-0' : '0-1';
    }
    
    return `${homeGoals}-${awayGoals}`;
  }

  calculateValueOdds(homeProb, drawProb, awayProb) {
    // Calculate fair odds from probabilities
    const fairHomeOdds = 1 / homeProb;
    const fairDrawOdds = 1 / drawProb;
    const fairAwayOdds = 1 / awayProb;
    
    // Market odds (simulated)
    const marketHomeOdds = fairHomeOdds * (0.95 + Math.random() * 0.1);
    const marketDrawOdds = fairDrawOdds * (0.95 + Math.random() * 0.1);
    const marketAwayOdds = fairAwayOdds * (0.95 + Math.random() * 0.1);
    
    // Calculate value (positive value = good bet)
    const homeValue = (fairHomeOdds / marketHomeOdds - 1) * 100;
    const drawValue = (fairDrawOdds / marketDrawOdds - 1) * 100;
    const awayValue = (fairAwayOdds / marketAwayOdds - 1) * 100;
    
    return {
      home: { odds: parseFloat(marketHomeOdds.toFixed(2)), value: parseFloat(homeValue.toFixed(1)) },
      draw: { odds: parseFloat(marketDrawOdds.toFixed(2)), value: parseFloat(drawValue.toFixed(1)) },
      away: { odds: parseFloat(marketAwayOdds.toFixed(2)), value: parseFloat(awayValue.toFixed(1)) },
      best_value: Math.max(homeValue, drawValue, awayValue) > 5 ? 
        (homeValue > drawValue && homeValue > awayValue ? 'Home' : 
         drawValue > awayValue ? 'Draw' : 'Away') : 'None'
    };
  }

  generateAnalysis(homeTeam, awayTeam, outcome, confidence) {
    const analyses = [
      `${homeTeam} has shown strong attacking form recently`,
      `${awayTeam}'s defense has been solid in away games`,
      'Both teams are likely to score in this encounter',
      'Key player absences could affect team performance',
      'Recent head-to-head matches have been closely contested',
      'Weather conditions may favor one style of play',
      'Motivation levels are high for this important match'
    ];
    
    // Select 2-3 random analyses
    const selected = [];
    while (selected.length < 3) {
      const analysis = analyses[Math.floor(Math.random() * analyses.length)];
      if (!selected.includes(analysis)) {
        selected.push(analysis);
      }
    }
    
    return selected;
  }

  getFallbackPrediction() {
    return {
      success: false,
      predictions: { home_win: 0.33, draw: 0.34, away_win: 0.33 },
      predicted_outcome: 'Draw',
      confidence_score: 0.34,
      confidence_level: 'Low',
      recommendation: 'No clear prediction - avoid betting',
      expected_score: '1-1',
      analysis: ['Insufficient data for accurate prediction'],
      risk_level: 'HIGH'
    };
  }
}

class ForexPredictor {
  constructor() {
    this.pairPatterns = {
      'EUR/USD': { volatility: 0.008, trendBias: 0.1 },
      'GBP/USD': { volatility: 0.009, trendBias: -0.05 },
      'USD/JPY': { volatility: 0.007, trendBias: 0.15 },
      'USD/CHF': { volatility: 0.006, trendBias: -0.1 },
      'AUD/USD': { volatility: 0.010, trendBias: 0.05 },
      'USD/CAD': { volatility: 0.008, trendBias: -0.08 },
      'NZD/USD': { volatility: 0.011, trendBias: 0.12 },
      'EUR/GBP': { volatility: 0.007, trendBias: 0.03 }
    };
  }

  async predict(currencyPair, marketData) {
    try {
      const { 
        currentPrice = this.getCurrentPrice(currencyPair),
        rsi = 50 + (Math.random() - 0.5) * 40,
        ma20 = currentPrice * (0.995 + Math.random() * 0.01),
        ma50 = currentPrice * (0.99 + Math.random() * 0.02),
        volatility = this.pairPatterns[currencyPair]?.volatility || 0.008,
        volume = 1000000 + Math.random() * 4000000
      } = marketData;
      
      const pattern = this.pairPatterns[currencyPair] || { volatility: 0.008, trendBias: 0 };
      
      // Analyze multiple indicators
      const rsiSignal = this.analyzeRSI(rsi);
      const maSignal = this.analyzeMovingAverages(currentPrice, ma20, ma50);
      const trendSignal = this.analyzeTrend(pattern.trendBias);
      const volatilitySignal = this.analyzeVolatility(volatility);
      
      // Combine signals
      const signals = [rsiSignal, maSignal, trendSignal, volatilitySignal];
      const buySignals = signals.filter(s => s === 'BUY').length;
      const sellSignals = signals.filter(s => s === 'SELL').length;
      
      let recommendation, confidence;
      
      if (buySignals >= 3) {
        recommendation = 'BUY';
        confidence = 0.7 + (buySignals - 3) * 0.1;
      } else if (sellSignals >= 3) {
        recommendation = 'SELL';
        confidence = 0.7 + (sellSignals - 3) * 0.1;
      } else if (buySignals > sellSignals) {
        recommendation = 'BUY';
        confidence = 0.5 + (buySignals - sellSignals) * 0.1;
      } else if (sellSignals > buySignals) {
        recommendation = 'SELL';
        confidence = 0.5 + (sellSignals - buySignals) * 0.1;
      } else {
        recommendation = 'HOLD';
        confidence = 0.5;
      }
      
      // Cap confidence
      confidence = Math.min(0.95, Math.max(0.3, confidence));
      
      // Calculate levels
      const atr = currentPrice * volatility;
      const support = currentPrice - atr * 1.5;
      const resistance = currentPrice + atr * 1.5;
      
      // Entry, stop loss, take profit
      let entry, stopLoss, takeProfit, riskReward;
      
      if (recommendation === 'BUY') {
        entry = currentPrice;
        stopLoss = entry - atr;
        takeProfit = entry + atr * 2;
        riskReward = 2.0;
      } else if (recommendation === 'SELL') {
        entry = currentPrice;
        stopLoss = entry + atr;
        takeProfit = entry - atr * 2;
        riskReward = 2.0;
      } else {
        entry = null;
        stopLoss = null;
        takeProfit = null;
        riskReward = null;
      }
      
      // Risk level based on volatility and confidence
      let riskLevel;
      if (volatility > 0.01 || confidence < 0.5) {
        riskLevel = 'HIGH';
      } else if (volatility > 0.006 || confidence < 0.7) {
        riskLevel = 'MEDIUM';
      } else {
        riskLevel = 'LOW';
      }
      
      // Technical analysis
      const analysis = this.generateForexAnalysis(
        currencyPair, 
        recommendation, 
        rsi, 
        currentPrice, 
        ma20, 
        ma50
      );
      
      return {
        success: true,
        currency_pair: currencyPair,
        recommendation,
        confidence: parseFloat(confidence.toFixed(3)),
        current_price: parseFloat(currentPrice.toFixed(5)),
        support: parseFloat(support.toFixed(5)),
        resistance: parseFloat(resistance.toFixed(5)),
        entry_price: entry ? parseFloat(entry.toFixed(5)) : null,
        stop_loss: stopLoss ? parseFloat(stopLoss.toFixed(5)) : null,
        take_profit: takeProfit ? parseFloat(takeProfit.toFixed(5)) : null,
        risk_reward_ratio: riskReward,
        timeframe: '4H',
        expiry: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
        risk_level: riskLevel,
        analysis: analysis,
        technical_indicators: {
          rsi: parseFloat(rsi.toFixed(2)),
          ma_20: parseFloat(ma20.toFixed(5)),
          ma_50: parseFloat(ma50.toFixed(5)),
          volatility: parseFloat(volatility.toFixed(5)),
          volume: Math.round(volume)
        }
      };
      
    } catch (error) {
      console.error('Forex prediction error:', error);
      return this.getFallbackPrediction(currencyPair);
    }
  }

  getCurrentPrice(currencyPair) {
    // Mock current prices
    const prices = {
      'EUR/USD': 1.0850,
      'GBP/USD': 1.2650,
      'USD/JPY': 151.80,
      'USD/CHF': 0.9050,
      'AUD/USD': 0.6520,
      'USD/CAD': 1.3550,
      'NZD/USD': 0.6020,
      'EUR/GBP': 0.8570
    };
    
    return prices[currencyPair] || 1.0000 + (Math.random() - 0.5) * 0.1;
  }

  analyzeRSI(rsi) {
    if (rsi < 30) return 'BUY';
    if (rsi > 70) return 'SELL';
    return 'HOLD';
  }

  analyzeMovingAverages(price, ma20, ma50) {
    if (price > ma20 && ma20 > ma50) return 'BUY';
    if (price < ma20 && ma20 < ma50) return 'SELL';
    return 'HOLD';
  }

  analyzeTrend(trendBias) {
    if (trendBias > 0.1) return 'BUY';
    if (trendBias < -0.1) return 'SELL';
    return 'HOLD';
  }

  analyzeVolatility(volatility) {
    if (volatility > 0.01) return 'HOLD'; // Too volatile
    return Math.random() > 0.5 ? 'BUY' : 'SELL';
  }

  generateForexAnalysis(pair, recommendation, rsi, price, ma20, ma50) {
    const analyses = [];
    
    // RSI analysis
    if (rsi < 30) {
      analyses.push('RSI indicates oversold conditions - potential buying opportunity');
    } else if (rsi > 70) {
      analyses.push('RSI indicates overbought conditions - potential selling opportunity');
    }
    
    // Moving average analysis
    if (price > ma20 && ma20 > ma50) {
      analyses.push('Bullish trend confirmed by moving averages');
    } else if (price < ma20 && ma20 < ma50) {
      analyses.push('Bearish trend confirmed by moving averages');
    } else {
      analyses.push('Market is in a consolidation phase');
    }
    
    // Pair-specific analysis
    if (pair === 'EUR/USD') {
      analyses.push('ECB policy decisions influencing EUR strength');
    } else if (pair === 'USD/JPY') {
      analyses.push('BOJ policy divergence with Fed creating volatility');
    }
    
    // Add timing analysis
    const hour = new Date().getHours();
    if (hour >= 8 && hour <= 16) {
      analyses.push('Trading during London/NY overlap for best liquidity');
    }
    
    return analyses;
  }

  getFallbackPrediction(currencyPair) {
    return {
      success: false,
      currency_pair: currencyPair,
      recommendation: 'HOLD',
      confidence: 0.5,
      current_price: this.getCurrentPrice(currencyPair),
      support: null,
      resistance: null,
      entry_price: null,
      stop_loss: null,
      take_profit: null,
      risk_reward_ratio: null,
      timeframe: '4H',
      expiry: new Date(Date.now() + 12 * 60 * 60 * 1000),
      risk_level: 'MEDIUM',
      analysis: ['Insufficient market data for confident prediction']
    };
  }
}

module.exports = { FootballPredictor, ForexPredictor };