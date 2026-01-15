const axios = require('axios');
const { OddsApiKey } = require('../../../config/keys');

class OddsAPI {
  constructor() {
    this.apiKey = process.env.ODDS_API_KEY;
    this.baseURL = 'https://api.the-odds-api.com/v4';
    this.sportKeys = {
      'champions_league': 'soccer_uefa_champs_league',
      'europa_league': 'soccer_uefa_europa_league',
      'premier_league': 'soccer_epl'
    };
  }

  async getUpcomingMatches(sport = 'champions_league', region = 'eu', market = 'h2h') {
    try {
      const sportKey = this.sportKeys[sport] || sport;
      
      const response = await axios.get(`${this.baseURL}/sports/${sportKey}/odds`, {
        params: {
          apiKey: this.apiKey,
          regions: region,
          markets: market,
          oddsFormat: 'decimal',
          dateFormat: 'iso'
        }
      });

      return this.processMatches(response.data);
    } catch (error) {
      console.error('Odds API Error:', error.response?.data || error.message);
      
      // Fallback to backup API if available
      if (process.env.BACKUP_ODDS_API_KEY) {
        return this.getBackupOdds(sport);
      }
      
      throw new Error('Failed to fetch odds data');
    }
  }

  async getMatchOdds(matchId, region = 'eu') {
    try {
      const response = await axios.get(`${this.baseURL}/sports/${this.sportKey}/events/${matchId}/odds`, {
        params: {
          apiKey: this.apiKey,
          regions: region,
          markets: 'h2h,totals,spreads',
          oddsFormat: 'decimal'
        }
      });

      return this.processDetailedOdds(response.data);
    } catch (error) {
      console.error('Match Odds Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch match odds');
    }
  }

  processMatches(matches) {
    return matches.map(match => ({
      id: match.id,
      sport_key: match.sport_key,
      sport_title: match.sport_title,
      commence_time: match.commence_time,
      home_team: match.home_team,
      away_team: match.away_team,
      bookmakers: match.bookmakers ? match.bookmakers.map(bookmaker => ({
        key: bookmaker.key,
        title: bookmaker.title,
        last_update: bookmaker.last_update,
        markets: bookmaker.markets
      })).slice(0, 5) : [],
      best_odds: this.calculateBestOdds(match.bookmakers)
    }));
  }

  calculateBestOdds(bookmakers) {
    if (!bookmakers || bookmakers.length === 0) return null;

    const bestOdds = {
      home: { odds: 0, bookmaker: '' },
      draw: { odds: 0, bookmaker: '' },
      away: { odds: 0, bookmaker: '' }
    };

    bookmakers.forEach(bookmaker => {
      const market = bookmaker.markets?.find(m => m.key === 'h2h');
      if (market) {
        market.outcomes.forEach(outcome => {
          const type = outcome.name.toLowerCase();
          if (type === 'home' && outcome.price > bestOdds.home.odds) {
            bestOdds.home = { odds: outcome.price, bookmaker: bookmaker.title };
          } else if (type === 'draw' && outcome.price > bestOdds.draw.odds) {
            bestOdds.draw = { odds: outcome.price, bookmaker: bookmaker.title };
          } else if (type === 'away' && outcome.price > bestOdds.away.odds) {
            bestOdds.away = { odds: outcome.price, bookmaker: bookmaker.title };
          }
        });
      }
    });

    return bestOdds;
  }

  async getBackupOdds(sport) {
    // Backup API - Bet365 or other provider
    const backupAPIs = [
      {
        name: 'Bet365',
        url: `https://api.b365api.com/v1/bet365/upcoming`,
        params: {
          sport_id: sport === 'champions_league' ? '1' : '2',
          token: process.env.BET365_API_KEY
        }
      },
      {
        name: 'ApiSports',
        url: 'https://v3.football.api-sports.io/fixtures',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'v3.football.api-sports.io'
        }
      }
    ];

    for (const api of backupAPIs) {
      try {
        const response = await axios.get(api.url, {
          params: api.params,
          headers: api.headers
        });
        return this.processBackupData(response.data, api.name);
      } catch (error) {
        console.error(`Backup API ${api.name} failed:`, error.message);
        continue;
      }
    }

    throw new Error('All backup APIs failed');
  }
}

module.exports = new OddsAPI();