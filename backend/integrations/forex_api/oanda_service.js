const axios = require('axios');

class OandaService {
  constructor() {
    this.apiKey = process.env.OANDA_API_KEY;
    this.accountId = process.env.OANDA_ACCOUNT_ID;
    this.environment = process.env.OANDA_ENVIRONMENT || 'practice';
    this.baseURL = this.environment === 'practice' 
      ? 'https://api-fxpractice.oanda.com/v3'
      : 'https://api-fxtrade.oanda.com/v3';
  }

  async getAccountSummary() {
    try {
      const response = await axios.get(`${this.baseURL}/accounts/${this.accountId}/summary`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.account;
    } catch (error) {
      console.error('Oanda Account Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch account summary');
    }
  }

  async getInstruments() {
    try {
      const response = await axios.get(`${this.baseURL}/accounts/${this.accountId}/instruments`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.instruments
        .filter(instrument => instrument.type === 'CURRENCY')
        .map(instrument => ({
          name: instrument.name,
          displayName: instrument.displayName,
          pipLocation: instrument.pipLocation,
          marginRate: instrument.marginRate,
          tradeUnitsPrecision: instrument.tradeUnitsPrecision
        }));
    } catch (error) {
      console.error('Oanda Instruments Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch instruments');
    }
  }

  async getCurrentPrices(instruments = ['EUR_USD', 'GBP_USD', 'USD_JPY']) {
    try {
      const response = await axios.get(`${this.baseURL}/accounts/${this.accountId}/pricing`, {
        params: {
          instruments: instruments.join(',')
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return this.processPrices(response.data.prices);
    } catch (error) {
      console.error('Oanda Pricing Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch current prices');
    }
  }

  processPrices(prices) {
    return prices.map(price => ({
      instrument: price.instrument,
      time: price.time,
      bid: parseFloat(price.bids[0].price),
      ask: parseFloat(price.asks[0].price),
      spread: (parseFloat(price.asks[0].price) - parseFloat(price.bids[0].price)).toFixed(5),
      status: price.status,
      tradeable: price.tradeable
    }));
  }

  async getCandles(instrument, granularity = 'H1', count = 100) {
    try {
      const response = await axios.get(`${this.baseURL}/instruments/${instrument}/candles`, {
        params: {
          granularity,
          count,
          price: 'MBA'
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return this.processCandles(response.data.candles, instrument);
    } catch (error) {
      console.error('Oanda Candles Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch candle data');
    }
  }

  processCandles(candles, instrument) {
    return candles.map(candle => ({
      time: candle.time,
      volume: candle.volume,
      complete: candle.complete,
      open: parseFloat(candle.mid.o),
      high: parseFloat(candle.mid.h),
      low: parseFloat(candle.mid.l),
      close: parseFloat(candle.mid.c),
      instrument: instrument
    }));
  }

  async getOrderBook(instrument) {
    try {
      const response = await axios.get(`${this.baseURL}/instruments/${instrument}/orderBook`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        instrument: instrument,
        time: response.data.orderBook.time,
        price: response.data.orderBook.price,
        bucketWidth: response.data.orderBook.bucketWidth,
        buckets: response.data.orderBook.buckets
      };
    } catch (error) {
      console.error('Oanda Order Book Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch order book');
    }
  }

  async getPositionBook(instrument) {
    try {
      const response = await axios.get(`${this.baseURL}/instruments/${instrument}/positionBook`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        instrument: instrument,
        time: response.data.positionBook.time,
        price: response.data.positionBook.price,
        bucketWidth: response.data.positionBook.bucketWidth,
        buckets: response.data.positionBook.buckets
      };
    } catch (error) {
      console.error('Oanda Position Book Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch position book');
    }
  }
}

module.exports = new OandaService();