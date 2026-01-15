const axios = require('axios');
const crypto = require('crypto');

class BetfairService {
  constructor() {
    this.appKey = process.env.BETFAIR_APP_KEY;
    this.username = process.env.BETFAIR_USERNAME;
    this.password = process.env.BETFAIR_PASSWORD;
    this.certFiles = process.env.BETFAIR_CERT_PATH;
    this.sessionToken = null;
    this.baseURL = 'https://api.betfair.com/exchange/betting/rest/v1.0';
  }

  async authenticate() {
    try {
      const response = await axios.post('https://identitysso.betfair.com/api/certlogin', {
        username: this.username,
        password: this.password
      }, {
        headers: {
          'X-Application': this.appKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        httpsAgent: new (require('https').Agent)({
          cert: fs.readFileSync(`${this.certFiles}/client-2048.crt`),
          key: fs.readFileSync(`${this.certFiles}/client-2048.key`)
        })
      });

      this.sessionToken = response.data.sessionToken;
      return this.sessionToken;
    } catch (error) {
      console.error('Betfair Authentication Error:', error.response?.data || error.message);
      throw new Error('Betfair authentication failed');
    }
  }

  async getSessionToken() {
    if (!this.sessionToken) {
      await this.authenticate();
    }
    return this.sessionToken;
  }

  async listMarketCatalogue(eventTypeIds = ['1'], competitionIds = []) {
    try {
      const token = await this.getSessionToken();
      
      const response = await axios.post(`${this.baseURL}/listMarketCatalogue/`, {
        filter: {
          eventTypeIds,
          competitionIds,
          marketStartTime: {
            from: new Date().toISOString(),
            to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        },
        marketProjection: ['EVENT', 'MARKET_DESCRIPTION', 'RUNNER_DESCRIPTION', 'MARKET_START_TIME'],
        maxResults: 50,
        locale: 'en'
      }, {
        headers: {
          'X-Application': this.appKey,
          'X-Authentication': token,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Betfair Market Catalogue Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch market catalogue');
    }
  }

  async listMarketBook(marketIds, priceProjection = {}) {
    try {
      const token = await this.getSessionToken();
      
      const response = await axios.post(`${this.baseURL}/listMarketBook/`, {
        marketIds,
        priceProjection: {
          priceData: ['EX_BEST_OFFERS', 'EX_TRADED'],
          ...priceProjection
        },
        orderProjection: 'ALL',
        matchProjection: 'ROLLED_UP_BY_AVG_PRICE'
      }, {
        headers: {
          'X-Application': this.appKey,
          'X-Authentication': token,
          'Content-Type': 'application/json'
        }
      });

      return this.processBetfairOdds(response.data);
    } catch (error) {
      console.error('Betfair Market Book Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch market book');
    }
  }

  processBetfairOdds(marketBooks) {
    return marketBooks.map(market => {
      const runners = market.runners.map(runner => ({
        selectionId: runner.selectionId,
        runnerName: runner.runnerName,
        status: runner.status,
        ex: {
          availableToBack: runner.ex.availableToBack,
          availableToLay: runner.ex.availableToLay,
          tradedVolume: runner.ex.tradedVolume
        },
        lastPriceTraded: runner.lastPriceTraded
      }));

      return {
        marketId: market.marketId,
        marketName: market.marketName,
        totalMatched: market.totalMatched,
        runners: runners,
        status: market.status,
        inPlay: market.inPlay,
        numberOfWinners: market.numberOfWinners,
        bettingType: market.bettingType,
        marketTime: market.marketTime
      };
    });
  }

  async getFootballOdds(competitionId) {
    // Get Champions League (competitionId: 31) or Europa League (competitionId: 848)
    const competitions = {
      'champions_league': '31',
      'europa_league': '848'
    };

    const compId = competitions[competitionId] || competitionId;
    
    const marketCatalogue = await this.listMarketCatalogue(['1'], [compId]);
    
    const matchMarkets = marketCatalogue.filter(market => 
      market.marketName === 'Match Odds' || market.marketName.includes('To Win')
    );

    const marketIds = matchMarkets.map(market => market.marketId);
    const marketBooks = await this.listMarketBook(marketIds);

    return this.formatFootballOdds(matchMarkets, marketBooks);
  }

  formatFootballOdds(matchMarkets, marketBooks) {
    const matches = [];

    matchMarkets.forEach((market, index) => {
      const marketBook = marketBooks.find(mb => mb.marketId === market.marketId);
      if (!marketBook || !marketBook.runners) return;

      const event = market.event;
      const runners = marketBook.runners;

      const homeRunner = runners.find(r => r.runnerName === event.homeTeam);
      const awayRunner = runners.find(r => r.runnerName === event.awayTeam);
      const drawRunner = runners.find(r => r.runnerName === 'The Draw');

      if (homeRunner && awayRunner) {
        matches.push({
          match: `${event.homeTeam} vs ${event.awayTeam}`,
          startTime: market.marketStartTime,
          league: this.getLeagueFromCompetition(event.competitionId),
          betfair: {
            marketId: market.marketId,
            totalMatched: marketBook.totalMatched,
            odds: {
              home: this.getBestOdds(homeRunner),
              draw: drawRunner ? this.getBestOdds(drawRunner) : null,
              away: this.getBestOdds(awayRunner)
            },
            liquidity: marketBook.totalMatched
          }
        });
      }
    });

    return matches;
  }

  getBestOdds(runner) {
    if (!runner.ex || !runner.ex.availableToBack || runner.ex.availableToBack.length === 0) {
      return { price: null, size: null };
    }

    const bestBack = runner.ex.availableToBack.reduce((best, current) => 
      current.price > best.price ? current : best
    );

    return {
      price: bestBack.price,
      size: bestBack.size,
      lastPriceTraded: runner.lastPriceTraded
    };
  }
}

module.exports = new BetfairService();