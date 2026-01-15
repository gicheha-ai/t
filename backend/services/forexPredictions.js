// services/forexPredictions.js - Add these lines at the top
console.log('Current directory:', __dirname);
console.log('Attempting to import ml_service...');

try {
  const mlService = require('../ml_service');
  console.log('ml_service imported successfully:', mlService);
  console.log('Keys in ml_service:', Object.keys(mlService));
  console.log('SimpleForexPredictor exists?', 'SimpleForexPredictor' in mlService);
  console.log('Type of SimpleForexPredictor:', typeof mlService.SimpleForexPredictor);
} catch (error) {
  console.error('Error importing ml_service:', error.message);
  console.error('Error stack:', error.stack);
}

const { SimpleForexPredictor } = require('../ml_service');
// ... rest of your code
// const { SimpleForexPredictor: ForexPredictor } = require('../ml_service');

class ForexPredictionsService {
  constructor() {
    this.predictor = new SimpleForexPredictor();
    this.currencyPairs = [
      'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
      'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP'
    ];
    this.cache = new Map();
    this.cacheDuration = 10 * 60 * 1000; // 10 minutes
  }

  async getAllPairs() {
    return this.currencyPairs;
  }

  async getPrediction(currencyPair) {
    const cacheKey = `prediction_${currencyPair}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Generate realistic market data
      const marketData = this.generateMarketData(currencyPair);
      
      // Get prediction from ML predictor
      const prediction = await this.predictor.predict(currencyPair, marketData);
      
      // Enhance with additional analysis
      const enhancedPrediction = {
        ...prediction,
        timestamp: new Date(),
        market_conditions: this.analyzeMarketConditions(marketData),
        trading_hours: this.getTradingHours(),
        economic_events: this.getEconomicEvents(currencyPair),
        pair_info: this.getPairInfo(currencyPair)
      };

      this.setToCache(cacheKey, enhancedPrediction);
      return enhancedPrediction;
      
    } catch (error) {
      console.error(`Error generating prediction for ${currencyPair}:`, error);
      return this.getFallbackPrediction(currencyPair);
    }
  }

  generateMarketData(currencyPair) {
    // Generate realistic market data for the prediction
    const basePrice = this.getBasePrice(currencyPair);
    const volatility = this.getVolatility(currencyPair);
    
    // Current time for market session detection
    const now = new Date();
    const hour = now.getHours();
    
    // Market session impact
    let sessionMultiplier = 1.0;
    if (hour >= 8 && hour <= 16) {
      sessionMultiplier = 1.5; // London/NY overlap - higher volatility
    } else if (hour >= 0 && hour <= 8) {
      sessionMultiplier = 0.7; // Asian session - lower volatility
    }
    
    // Generate technical indicators
    const rsi = 30 + Math.random() * 40; // RSI between 30-70
    const ma20 = basePrice * (0.995 + Math.random() * 0.01);
    const ma50 = basePrice * (0.99 + Math.random() * 0.02);
    const currentPrice = basePrice * (0.995 + Math.random() * 0.01);
    const volume = 1000000 + Math.random() * 4000000;
    
    return {
      currentPrice,
      rsi,
      ma20,
      ma50,
      volatility: volatility * sessionMultiplier,
      volume,
      trend: this.determineTrend(currentPrice, ma20, ma50),
      support: currentPrice * 0.99,
      resistance: currentPrice * 1.01,
      spread: 0.0001 + Math.random() * 0.0003
    };
  }

  getBasePrice(currencyPair) {
    const basePrices = {
      'EUR/USD': 1.0850,
      'GBP/USD': 1.2650,
      'USD/JPY': 151.80,
      'USD/CHF': 0.9050,
      'AUD/USD': 0.6520,
      'USD/CAD': 1.3550,
      'NZD/USD': 0.6020,
      'EUR/GBP': 0.8570
    };
    
    return basePrices[currencyPair] || 1.0000;
  }

  getVolatility(currencyPair) {
    const volatilities = {
      'EUR/USD': 0.008,
      'GBP/USD': 0.009,
      'USD/JPY': 0.007,
      'USD/CHF': 0.006,
      'AUD/USD': 0.010,
      'USD/CAD': 0.008,
      'NZD/USD': 0.011,
      'EUR/GBP': 0.007
    };
    
    return volatilities[currencyPair] || 0.008;
  }

  determineTrend(currentPrice, ma20, ma50) {
    if (currentPrice > ma20 && ma20 > ma50) return 'bullish';
    if (currentPrice < ma20 && ma20 < ma50) return 'bearish';
    return 'neutral';
  }

  analyzeMarketConditions(marketData) {
    const conditions = [];
    
    if (marketData.volatility > 0.01) {
      conditions.push('High volatility market');
    } else if (marketData.volatility < 0.005) {
      conditions.push('Low volatility market');
    }
    
    if (marketData.trend === 'bullish') {
      conditions.push('Bullish trend in place');
    } else if (marketData.trend === 'bearish') {
      conditions.push('Bearish trend in place');
    } else {
      conditions.push('Market in consolidation');
    }
    
    if (marketData.rsi < 30) {
      conditions.push('Oversold conditions');
    } else if (marketData.rsi > 70) {
      conditions.push('Overbought conditions');
    }
    
    return conditions;
  }

  getTradingHours() {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 0 && hour < 8) {
      return {
        session: 'Asian',
        activity: 'Low',
        volatility: 'Low to Medium',
        next_session: 'London opens in ' + (8 - hour) + ' hours'
      };
    } else if (hour >= 8 && hour < 16) {
      return {
        session: 'London/NY Overlap',
        activity: 'High',
        volatility: 'High',
        next_session: 'NY only in ' + (16 - hour) + ' hours'
      };
    } else {
      return {
        session: 'NY Close/Asian Open',
        activity: 'Medium',
        volatility: 'Medium',
        next_session: 'Asian session active'
      };
    }
  }

  getEconomicEvents(currencyPair) {
    const events = [];
    const [base, quote] = currencyPair.split('/');
    
    // Mock economic events
    const economicCalendar = {
      'EUR': ['ECB Interest Rate Decision', 'EU GDP Data', 'German ZEW Economic Sentiment'],
      'USD': ['FOMC Meeting', 'Non-Farm Payrolls', 'CPI Inflation Data'],
      'GBP': ['BOE Monetary Policy', 'UK Inflation Report', 'Retail Sales'],
      'JPY': ['BOJ Policy Decision', 'Tokyo CPI', 'Industrial Production'],
      'AUD': ['RBA Meeting Minutes', 'Employment Change', 'Trade Balance'],
      'CAD': ['BOC Rate Statement', 'CPI Common', 'Retail Sales'],
      'CHF': ['SNB Monetary Assessment', 'CPI YoY', 'Employment Level'],
      'NZD': ['RBNZ Official Cash Rate', 'GDP QoQ', 'Trade Balance']
    };
    
    if (economicCalendar[base]) {
      events.push(`Upcoming: ${economicCalendar[base][0]} (${base})`);
    }
    
    if (economicCalendar[quote] && quote !== 'USD') {
      events.push(`Upcoming: ${economicCalendar[quote][0]} (${quote})`);
    }
    
    // Add some random events
    if (events.length === 0) {
      events.push('No major economic events scheduled');
      events.push('Focus on technical analysis for trading decisions');
    }
    
    return events;
  }

  getPairInfo(currencyPair) {
    const pairInfo = {
      'EUR/USD': {
        nickname: 'Fiber',
        description: 'Most traded currency pair in the world',
        pip_value: 10, // USD per pip per standard lot
        spread_typical: '0.6-1.2 pips',
        trading_hours: '24/5',
        major_influences: 'ECB, Fed, EU/US economic data'
      },
      'GBP/USD': {
        nickname: 'Cable',
        description: 'British Pound vs US Dollar',
        pip_value: 10,
        spread_typical: '0.8-1.5 pips',
        trading_hours: '24/5',
        major_influences: 'BOE, Fed, Brexit developments'
      },
      'USD/JPY': {
        nickname: 'Gopher',
        description: 'US Dollar vs Japanese Yen',
        pip_value: 9.12, // Approximate
        spread_typical: '0.7-1.3 pips',
        trading_hours: '24/5',
        major_influences: 'Fed, BOJ, safe-haven flows'
      },
      'AUD/USD': {
        nickname: 'Aussie',
        description: 'Australian Dollar vs US Dollar',
        pip_value: 10,
        spread_typical: '0.8-1.6 pips',
        trading_hours: '24/5',
        major_influences: 'RBA, commodity prices, China data'
      }
    };
    
    return pairInfo[currencyPair] || {
      nickname: currencyPair.replace('/', ''),
      description: 'Major currency pair',
      pip_value: 10,
      spread_typical: '1.0-2.0 pips',
      trading_hours: '24/5',
      major_influences: 'Central bank policies, economic data'
    };
  }

  async getMarketAnalysis() {
    try {
      // Get predictions for all pairs
      const predictions = await Promise.all(
        this.currencyPairs.map(async (pair) => {
          try {
            const prediction = await this.getPrediction(pair);
            return {
              pair,
              recommendation: prediction.recommendation,
              confidence: prediction.confidence,
              trend: prediction.technical_indicators?.trend || 'neutral'
            };
          } catch (error) {
            return {
              pair,
              recommendation: 'HOLD',
              confidence: 0.5,
              trend: 'neutral'
            };
          }
        })
      );
      
      // Calculate overall market sentiment
      const bullishPairs = predictions.filter(p => 
        p.recommendation === 'BUY' && p.confidence > 0.6
      ).length;
      
      const bearishPairs = predictions.filter(p => 
        p.recommendation === 'SELL' && p.confidence > 0.6
      ).length;
      
      let overallSentiment = 'Neutral';
      if (bullishPairs > bearishPairs + 2) overallSentiment = 'Strongly Bullish';
      else if (bullishPairs > bearishPairs) overallSentiment = 'Bullish';
      else if (bearishPairs > bullishPairs + 2) overallSentiment = 'Strongly Bearish';
      else if (bearishPairs > bullishPairs) overallSentiment = 'Bearish';
      
      // Find top picks
      const buyRecommendations = predictions
        .filter(p => p.recommendation === 'BUY' && p.confidence > 0.65)
        .sort((a, b) => b.confidence - a.confidence);
      
      const sellRecommendations = predictions
        .filter(p => p.recommendation === 'SELL' && p.confidence > 0.65)
        .sort((a, b) => b.confidence - a.confidence);
      
      return {
        overall_sentiment: overallSentiment,
        market_outlook: this.getMarketOutlook(overallSentiment),
        top_buy_picks: buyRecommendations.slice(0, 3),
        top_sell_picks: sellRecommendations.slice(0, 3),
        risk_level: this.calculateMarketRisk(predictions),
        update_time: new Date(),
        predictions_summary: predictions.map(p => ({
          pair: p.pair,
          action: p.recommendation,
          confidence: p.confidence
        }))
      };
      
    } catch (error) {
      console.error('Market analysis error:', error);
      return this.getFallbackMarketAnalysis();
    }
  }

  getMarketOutlook(sentiment) {
    const outlooks = {
      'Strongly Bullish': 'Risk-on environment, good for long positions',
      'Bullish': 'Moderate risk-on, selective buying opportunities',
      'Neutral': 'Mixed signals, range-bound trading expected',
      'Bearish': 'Risk-off environment, consider short positions',
      'Strongly Bearish': 'High risk-off, defensive positioning recommended'
    };
    
    return outlooks[sentiment] || 'Market conditions unclear';
  }

  calculateMarketRisk(predictions) {
    const highConfidenceCount = predictions.filter(p => p.confidence > 0.7).length;
    const totalPairs = predictions.length;
    
    const highConfidenceRatio = highConfidenceCount / totalPairs;
    
    if (highConfidenceRatio > 0.7) return 'Low';
    if (highConfidenceRatio > 0.4) return 'Medium';
    return 'High';
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    return null;
  }

  setToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getFallbackPrediction(currencyPair) {
    return {
      success: false,
      currency_pair: currencyPair,
      recommendation: 'HOLD',
      confidence: 0.5,
      current_price: this.getBasePrice(currencyPair),
      support: null,
      resistance: null,
      entry_price: null,
      stop_loss: null,
      take_profit: null,
      timeframe: '4H',
      expiry: new Date(Date.now() + 12 * 60 * 60 * 1000),
      risk_level: 'MEDIUM',
      analysis: ['Limited data available for analysis'],
      timestamp: new Date(),
      market_conditions: ['Market data temporarily unavailable'],
      trading_hours: { session: 'Unknown', activity: 'Unknown' },
      economic_events: ['No economic data available'],
      pair_info: this.getPairInfo(currencyPair)
    };
  }

  getFallbackMarketAnalysis() {
    return {
      overall_sentiment: 'Neutral',
      market_outlook: 'Market analysis temporarily unavailable',
      top_buy_picks: [],
      top_sell_picks: [],
      risk_level: 'MEDIUM',
      update_time: new Date(),
      predictions_summary: this.currencyPairs.map(pair => ({
        pair,
        action: 'HOLD',
        confidence: 0.5
      }))
    };
  }
}

module.exports = new ForexPredictionsService();