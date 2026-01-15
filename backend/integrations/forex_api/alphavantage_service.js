const axios = require('axios');

class AlphaVantageService {
  constructor() {
    this.apiKey = process.env.ALPHAVANTAGE_API_KEY;
    this.baseURL = 'https://www.alphavantage.co/query';
  }

  async getForexRealtime(fromCurrency = 'EUR', toCurrency = 'USD') {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: fromCurrency,
          to_currency: toCurrency,
          apikey: this.apiKey
        }
      });

      const data = response.data['Realtime Currency Exchange Rate'];
      if (!data) {
        throw new Error('No realtime data available');
      }

      return {
        fromCurrency: data['1. From_Currency Code'],
        toCurrency: data['3. To_Currency Code'],
        exchangeRate: parseFloat(data['5. Exchange Rate']),
        bidPrice: parseFloat(data['8. Bid Price']),
        askPrice: parseFloat(data['9. Ask Price']),
        lastRefreshed: data['6. Last Refreshed'],
        timeZone: data['7. Time Zone']
      };
    } catch (error) {
      console.error('AlphaVantage Realtime Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch realtime forex data');
    }
  }

  async getForexIntraday(fromCurrency, toCurrency, interval = '5min', outputSize = 'compact') {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'FX_INTRADAY',
          from_symbol: fromCurrency,
          to_symbol: toCurrency,
          interval,
          outputsize: outputSize,
          apikey: this.apiKey
        }
      });

      const timeSeries = response.data[`Time Series FX (${interval})`];
      if (!timeSeries) {
        throw new Error('No intraday data available');
      }

      return this.processTimeSeries(timeSeries, `${fromCurrency}/${toCurrency}`);
    } catch (error) {
      console.error('AlphaVantage Intraday Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch intraday forex data');
    }
  }

  async getForexDaily(fromCurrency, toCurrency, outputSize = 'compact') {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'FX_DAILY',
          from_symbol: fromCurrency,
          to_symbol: toCurrency,
          outputsize: outputSize,
          apikey: this.apiKey
        }
      });

      const timeSeries = response.data['Time Series FX (Daily)'];
      if (!timeSeries) {
        throw new Error('No daily data available');
      }

      return this.processTimeSeries(timeSeries, `${fromCurrency}/${toCurrency}`);
    } catch (error) {
      console.error('AlphaVantage Daily Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch daily forex data');
    }
  }

  processTimeSeries(timeSeries, pair) {
    const candles = [];
    
    for (const [timestamp, data] of Object.entries(timeSeries)) {
      candles.push({
        timestamp: new Date(timestamp),
        pair: pair,
        open: parseFloat(data['1. open']),
        high: parseFloat(data['2. high']),
        low: parseFloat(data['3. low']),
        close: parseFloat(data['4. close']),
        volume: data['5. volume'] ? parseFloat(data['5. volume']) : 0
      });
    }

    // Sort by timestamp ascending
    candles.sort((a, b) => a.timestamp - b.timestamp);
    
    return candles;
  }

  async getTechnicalIndicator(symbol, indicator, interval = 'daily', timePeriod = 14) {
    const indicatorFunctions = {
      'SMA': 'SMA',
      'EMA': 'EMA',
      'RSI': 'RSI',
      'MACD': 'MACD',
      'BBANDS': 'BBANDS',
      'STOCH': 'STOCH'
    };

    const functionName = indicatorFunctions[indicator];
    if (!functionName) {
      throw new Error(`Unsupported indicator: ${indicator}`);
    }

    try {
      const response = await axios.get(this.baseURL, {
        params: {
          function: functionName,
          symbol: symbol,
          interval: interval,
          time_period: timePeriod,
          series_type: 'close',
          apikey: this.apiKey
        }
      });

      const indicatorData = response.data[`Technical Analysis: ${indicator}`];
      if (!indicatorData) {
        throw new Error(`No ${indicator} data available`);
      }

      return indicatorData;
    } catch (error) {
      console.error(`AlphaVantage ${indicator} Error:`, error.response?.data || error.message);
      throw new Error(`Failed to fetch ${indicator} data`);
    }
  }

  async getMarketSentiment() {
    try {
      // Get multiple currency pairs for sentiment analysis
      const pairs = [
        'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 
        'AUD/USD', 'USD/CAD', 'NZD/USD'
      ];

      const sentiments = await Promise.all(
        pairs.map(async (pair) => {
          const [from, to] = pair.split('/');
          try {
            const data = await this.getForexDaily(from, to, 'compact');
            
            if (data.length < 2) return null;

            const latest = data[data.length - 1];
            const previous = data[data.length - 2];
            
            const change = ((latest.close - previous.close) / previous.close) * 100;
            const volumeChange = latest.volume && previous.volume 
              ? ((latest.volume - previous.volume) / previous.volume) * 100 
              : 0;

            return {
              pair,
              current: latest.close,
              change: change.toFixed(2),
              trend: change > 0 ? 'bullish' : change < 0 ? 'bearish' : 'neutral',
              volumeChange: volumeChange.toFixed(2),
              volatility: ((latest.high - latest.low) / latest.close * 100).toFixed(2)
            };
          } catch (error) {
            console.error(`Error analyzing ${pair}:`, error.message);
            return null;
          }
        })
      );

      const validSentiments = sentiments.filter(s => s !== null);
      
      // Calculate overall market sentiment
      const bullishCount = validSentiments.filter(s => s.trend === 'bullish').length;
      const bearishCount = validSentiments.filter(s => s.trend === 'bearish').length;
      const neutralCount = validSentiments.filter(s => s.trend === 'neutral').length;

      return {
        pairs: validSentiments,
        overallSentiment: bullishCount > bearishCount ? 'bullish' : bullishCount < bearishCount ? 'bearish' : 'neutral',
        bullishPercentage: (bullishCount / validSentiments.length * 100).toFixed(1),
        bearishPercentage: (bearishCount / validSentiments.length * 100).toFixed(1),
        neutralPercentage: (neutralCount / validSentiments.length * 100).toFixed(1),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Market Sentiment Error:', error.message);
      throw new Error('Failed to analyze market sentiment');
    }
  }
}

module.exports = new AlphaVantageService();