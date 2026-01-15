class FootballOddsService {
  constructor() {
    // Simple predictor built-in
    this.teamRatings = {
      'Real Madrid': 92, 'Bayern Munich': 90, 'Manchester City': 94,
      'PSG': 89, 'Liverpool': 91, 'Barcelona': 88, 'Juventus': 87,
      'Chelsea': 86, 'Manchester United': 85, 'Arsenal': 84
    };
    
    this.championsLeagueMatches = [
      {
        id: 'CL001',
        match: 'Real Madrid vs Bayern Munich',
        homeTeam: 'Real Madrid',
        awayTeam: 'Bayern Munich',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        league: 'Champions League',
        odds: { homeWin: 2.10, draw: 3.50, awayWin: 3.20 }
      }
    ];
  }

  async predictMatch(match) {
    const homeRating = this.teamRatings[match.homeTeam] || 80;
    const awayRating = this.teamRatings[match.awayTeam] || 80;
    
    const ratingDiff = (homeRating - awayRating) / 100;
    const homeAdvantage = 0.15;
    
    let homeWinProb = 0.33 + ratingDiff + homeAdvantage;
    let drawProb = 0.34;
    let awayWinProb = 0.33 - ratingDiff;
    
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
    
    return {
      predictions: {
        home_win: parseFloat(homeWinProb.toFixed(3)),
        draw: parseFloat(drawProb.toFixed(3)),
        away_win: parseFloat(awayWinProb.toFixed(3))
      },
      predicted_outcome: predictedOutcome,
      confidence_score: parseFloat(maxProb.toFixed(3)),
      confidence_level: confidence,
      recommendation: `${confidence} confidence in ${predictedOutcome}`
    };
  }

  async getChampionsLeagueOdds() {
    const matchesWithPredictions = await Promise.all(
      this.championsLeagueMatches.map(async (match) => {
        const prediction = await this.predictMatch(match);
        return {
          ...match,
          ml_prediction: prediction,
          last_updated: new Date()
        };
      })
    );

    return {
      league: 'UEFA Champions League',
      matches: matchesWithPredictions,
      last_updated: new Date()
    };
  }

  async getEuropaLeagueOdds() {
    return {
      league: 'UEFA Europa League',
      matches: [],
      last_updated: new Date()
    };
  }
}

module.exports = new FootballOddsService();