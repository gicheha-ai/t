const { FootballPredictor } = require('../ml_service');

class FootballOddsService {
  constructor() {
    this.predictor = new FootballPredictor();
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes cache
    
    // Mock data for Champions League
    this.championsLeagueMatches = [
      {
        id: 'CL001',
        match: 'Real Madrid vs Bayern Munich',
        homeTeam: 'Real Madrid',
        awayTeam: 'Bayern Munich',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        league: 'Champions League',
        stage: 'Semi Final',
        venue: 'Santiago Bernabéu',
        competition_importance: 1.3,
        odds: { homeWin: 2.10, draw: 3.50, awayWin: 3.20 }
      },
      {
        id: 'CL002',
        match: 'Manchester City vs Paris Saint-Germain',
        homeTeam: 'Manchester City',
        awayTeam: 'PSG',
        date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        league: 'Champions League',
        stage: 'Quarter Final',
        venue: 'Etihad Stadium',
        competition_importance: 1.2,
        odds: { homeWin: 1.85, draw: 3.80, awayWin: 4.00 }
      },
      {
        id: 'CL003',
        match: 'Barcelona vs Juventus',
        homeTeam: 'Barcelona',
        awayTeam: 'Juventus',
        date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        league: 'Champions League',
        stage: 'Group Stage',
        venue: 'Camp Nou',
        competition_importance: 1.0,
        odds: { homeWin: 1.95, draw: 3.60, awayWin: 3.80 }
      },
      {
        id: 'CL004',
        match: 'Liverpool vs Inter Milan',
        homeTeam: 'Liverpool',
        awayTeam: 'Inter Milan',
        date: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
        league: 'Champions League',
        stage: 'Round of 16',
        venue: 'Anfield',
        competition_importance: 1.1,
        odds: { homeWin: 1.75, draw: 3.90, awayWin: 4.50 }
      }
    ];

    // Mock data for Europa League
    this.europaLeagueMatches = [
      {
        id: 'EL001',
        match: 'Sevilla vs Roma',
        homeTeam: 'Sevilla',
        awayTeam: 'Roma',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        league: 'Europa League',
        stage: 'Semi Final',
        venue: 'Ramón Sánchez Pizjuán',
        competition_importance: 1.2,
        odds: { homeWin: 2.30, draw: 3.30, awayWin: 3.10 }
      },
      {
        id: 'EL002',
        match: 'Manchester United vs Bayer Leverkusen',
        homeTeam: 'Manchester United',
        awayTeam: 'Bayer Leverkusen',
        date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        league: 'Europa League',
        stage: 'Quarter Final',
        venue: 'Old Trafford',
        competition_importance: 1.1,
        odds: { homeWin: 1.70, draw: 3.90, awayWin: 4.80 }
      },
      {
        id: 'EL003',
        match: 'Arsenal vs Villarreal',
        homeTeam: 'Arsenal',
        awayTeam: 'Villarreal',
        date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        league: 'Europa League',
        stage: 'Group Stage',
        venue: 'Emirates Stadium',
        competition_importance: 1.0,
        odds: { homeWin: 1.65, draw: 4.00, awayWin: 5.00 }
      },
      {
        id: 'EL004',
        match: 'Napoli vs Frankfurt',
        homeTeam: 'Napoli',
        awayTeam: 'Eintracht Frankfurt',
        date: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
        league: 'Europa League',
        stage: 'Round of 16',
        venue: 'Diego Armando Maradona Stadium',
        competition_importance: 1.1,
        odds: { homeWin: 1.80, draw: 3.70, awayWin: 4.20 }
      }
    ];
  }

  async getChampionsLeagueOdds() {
    const cacheKey = 'champions_league_odds';
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const matchesWithPredictions = await Promise.all(
        this.championsLeagueMatches.map(async (match) => {
          const prediction = await this.getEnhancedPrediction(match);
          return {
            ...match,
            ml_prediction: prediction,
            betting_analysis: this.generateBettingAnalysis(match, prediction),
            value_bets: this.identifyValueBets(match.odds, prediction.predictions),
            last_updated: new Date()
          };
        })
      );

      const result = {
        league: 'UEFA Champions League',
        matches: matchesWithPredictions,
        tournament_info: {
          current_stage: 'Knockout Phase',
          defending_champion: 'Manchester City',
          top_scorer: 'Erling Haaland',
          next_round: 'Semi Finals',
          last_updated: new Date()
        },
        market_overview: this.getMarketOverview(matchesWithPredictions)
      };

      this.setToCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching Champions League odds:', error);
      return this.getFallbackChampionsLeagueData();
    }
  }

  async getEuropaLeagueOdds() {
    const cacheKey = 'europa_league_odds';
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const matchesWithPredictions = await Promise.all(
        this.europaLeagueMatches.map(async (match) => {
          const prediction = await this.getEnhancedPrediction(match);
          return {
            ...match,
            ml_prediction: prediction,
            betting_analysis: this.generateBettingAnalysis(match, prediction),
            value_bets: this.identifyValueBets(match.odds, prediction.predictions),
            last_updated: new Date()
          };
        })
      );

      const result = {
        league: 'UEFA Europa League',
        matches: matchesWithPredictions,
        tournament_info: {
          current_stage: 'Knockout Phase',
          defending_champion: 'Sevilla',
          top_scorer: 'Victor Boniface',
          next_round: 'Quarter Finals',
          last_updated: new Date()
        },
        market_overview: this.getMarketOverview(matchesWithPredictions)
      };

      this.setToCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching Europa League odds:', error);
      return this.getFallbackEuropaLeagueData();
    }
  }

  async getEnhancedPrediction(match) {
    try {
      // Get team statistics
      const homeStats = this.getTeamStats(match.homeTeam);
      const awayStats = this.getTeamStats(match.awayTeam);
      
      // Get head-to-head data
      const headToHead = this.getHeadToHead(match.homeTeam, match.awayTeam);
      
      // Get injury news
      const injuries = this.getInjuryNews(match.homeTeam, match.awayTeam);
      
      // Prepare match data for prediction
      const matchData = {
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        league: match.league,
        stage: match.stage,
        homeForm: homeStats.recentForm,
        awayForm: awayStats.recentForm,
        homeAttack: homeStats.attackStrength,
        awayAttack: awayStats.attackStrength,
        homeDefense: homeStats.defenseStrength,
        awayDefense: awayStats.defenseStrength,
        homeMotivation: this.calculateMotivation(match.homeTeam, match.stage),
        awayMotivation: this.calculateMotivation(match.awayTeam, match.stage),
        stadiumFactor: this.getStadiumFactor(match.venue),
        injury_difference: injuries.home - injuries.away,
        rest_difference: this.getRestDaysDifference(match.homeTeam, match.awayTeam),
        head_to_head: headToHead.homeWins - headToHead.awayWins
      };

      // Get ML prediction
      const mlPrediction = await this.predictor.predict(matchData);
      
      // Enhance with additional data
      return {
        ...mlPrediction,
        team_stats: {
          home: homeStats,
          away: awayStats
        },
        head_to_head: headToHead,
        injuries: injuries,
        venue_analysis: this.analyzeVenue(match.venue, match.homeTeam),
        tactical_preview: this.generateTacticalPreview(match.homeTeam, match.awayTeam),
        key_players: this.getKeyPlayers(match.homeTeam, match.awayTeam),
        weather_impact: this.getWeatherImpact(match.venue)
      };
    } catch (error) {
      console.error('Enhanced prediction error:', error);
      return this.predictor.getFallbackPrediction();
    }
  }

  getTeamStats(teamName) {
    const teamStats = {
      'Real Madrid': {
        recentForm: 'WWDLW',
        attackStrength: 2.8,
        defenseStrength: 0.9,
        possession: 62,
        shotsOnTarget: 6.2,
        homeRecord: 'W10-D2-L1',
        awayRecord: 'W8-D3-L2',
        keyStrengths: ['Counter-attack', 'Set pieces', 'Big game experience'],
        weaknesses: ['Aging defense', 'Over-reliance on veterans']
      },
      'Bayern Munich': {
        recentForm: 'WWWWL',
        attackStrength: 3.2,
        defenseStrength: 1.1,
        possession: 65,
        shotsOnTarget: 7.1,
        homeRecord: 'W11-D1-L1',
        awayRecord: 'W9-D2-L2',
        keyStrengths: ['High pressing', 'Wing play', 'Depth in squad'],
        weaknesses: ['Defensive transitions', 'Injury prone']
      },
      'Manchester City': {
        recentForm: 'WDWWW',
        attackStrength: 3.5,
        defenseStrength: 0.8,
        possession: 68,
        shotsOnTarget: 7.5,
        homeRecord: 'W12-D0-L1',
        awayRecord: 'W10-D1-L2',
        keyStrengths: ['Possession football', 'Tactical flexibility', 'Depth'],
        weaknesses: ['Can be predictable', 'Set piece defense']
      },
      'PSG': {
        recentForm: 'WLWWW',
        attackStrength: 3.0,
        defenseStrength: 1.2,
        possession: 60,
        shotsOnTarget: 6.5,
        homeRecord: 'W11-D2-L0',
        awayRecord: 'W8-D3-L2',
        keyStrengths: ['Individual brilliance', 'Counter-attack', 'Star power'],
        weaknesses: ['Defensive organization', 'Team cohesion']
      },
      'Liverpool': {
        recentForm: 'WWLWW',
        attackStrength: 2.9,
        defenseStrength: 1.0,
        possession: 61,
        shotsOnTarget: 6.8,
        homeRecord: 'W10-D3-L0',
        awayRecord: 'W7-D4-L2',
        keyStrengths: ['High intensity', 'Pressing', 'Anfield atmosphere'],
        weaknesses: ['Defensive gaps', 'Inconsistent form']
      },
      'Sevilla': {
        recentForm: 'DWLLW',
        attackStrength: 1.8,
        defenseStrength: 1.4,
        possession: 55,
        shotsOnTarget: 4.5,
        homeRecord: 'W9-D4-L0',
        awayRecord: 'W4-D5-L4',
        keyStrengths: ['Europa League experience', 'Home form', 'Set pieces'],
        weaknesses: ['League form', 'Attack consistency']
      }
    };

    // Default stats for teams not in database
    return teamStats[teamName] || {
      recentForm: 'WDL'[Math.floor(Math.random() * 3)] + 'WDL'[Math.floor(Math.random() * 3)] + 'WDL'[Math.floor(Math.random() * 3)],
      attackStrength: 1.5 + Math.random() * 1.5,
      defenseStrength: 1.0 + Math.random() * 0.8,
      possession: 50 + Math.random() * 20,
      shotsOnTarget: 4 + Math.random() * 3,
      homeRecord: `W${Math.floor(6 + Math.random() * 4)}-D${Math.floor(2 + Math.random() * 3)}-L${Math.floor(1 + Math.random() * 3)}`,
      awayRecord: `W${Math.floor(4 + Math.random() * 4)}-D${Math.floor(3 + Math.random() * 3)}-L${Math.floor(3 + Math.random() * 3)}`,
      keyStrengths: ['Team spirit', 'Defensive organization'],
      weaknesses: ['Lack of depth', 'Inconsistent attack']
    };
  }

  getHeadToHead(homeTeam, awayTeam) {
    // Mock head-to-head data
    const headToHeadData = {
      'Real Madrid-Bayern Munich': {
        totalMatches: 12,
        homeWins: 7,
        draws: 2,
        awayWins: 3,
        lastMeeting: '2023-04-12',
        lastResult: '2-1 (Real Madrid)',
        trends: ['Real Madrid won last 3 home matches', 'High scoring games (3+ goals)']
      },
      'Manchester City-PSG': {
        totalMatches: 4,
        homeWins: 2,
        draws: 1,
        awayWins: 1,
        lastMeeting: '2023-05-04',
        lastResult: '2-0 (Manchester City)',
        trends: ['Manchester City dominant at home', 'PSG struggle in away knockout games']
      },
      'Sevilla-Roma': {
        totalMatches: 6,
        homeWins: 3,
        draws: 2,
        awayWins: 1,
        lastMeeting: '2023-03-16',
        lastResult: '2-2 (Draw)',
        trends: ['Sevilla unbeaten at home', 'Roma strong in Europa League']
      }
    };

    const key = `${homeTeam}-${awayTeam}`;
    const reverseKey = `${awayTeam}-${homeTeam}`;
    
    if (headToHeadData[key]) {
      return headToHeadData[key];
    } else if (headToHeadData[reverseKey]) {
      // Reverse the stats for home/away
      const data = headToHeadData[reverseKey];
      return {
        totalMatches: data.totalMatches,
        homeWins: data.awayWins,
        draws: data.draws,
        awayWins: data.homeWins,
        lastMeeting: data.lastMeeting,
        lastResult: data.lastResult,
        trends: data.trends
      };
    } else {
      // Generate random head-to-head data
      return {
        totalMatches: Math.floor(3 + Math.random() * 8),
        homeWins: Math.floor(1 + Math.random() * 4),
        draws: Math.floor(0 + Math.random() * 3),
        awayWins: Math.floor(1 + Math.random() * 4),
        lastMeeting: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastResult: `${Math.floor(1 + Math.random() * 3)}-${Math.floor(1 + Math.random() * 3)}`,
        trends: ['No significant trends', 'First meeting in this competition']
      };
    }
  }

  getInjuryNews(homeTeam, awayTeam) {
    // Mock injury data
    const injuryDatabase = {
      'Real Madrid': { keyPlayers: ['Courtois', 'Alaba'], total: 3 },
      'Bayern Munich': { keyPlayers: ['Coman', 'Buchmann'], total: 2 },
      'Manchester City': { keyPlayers: [], total: 1 },
      'PSG': { keyPlayers: ['Hakimi'], total: 2 },
      'Liverpool': { keyPlayers: ['Matip', 'Bajcetic'], total: 4 },
      'Sevilla': { keyPlayers: ['Lamela'], total: 1 },
      'Roma': { keyPlayers: ['Abraham'], total: 2 }
    };

    return {
      home: injuryDatabase[homeTeam]?.total || Math.floor(Math.random() * 3),
      away: injuryDatabase[awayTeam]?.total || Math.floor(Math.random() * 3),
      homeKeyPlayers: injuryDatabase[homeTeam]?.keyPlayers || [],
      awayKeyPlayers: injuryDatabase[awayTeam]?.keyPlayers || []
    };
  }

  calculateMotivation(team, stage) {
    const motivationFactors = {
      'Real Madrid': 0.9,
      'Bayern Munich': 0.9,
      'Manchester City': 1.0,
      'PSG': 0.8, // Champions League pressure
      'Liverpool': 0.7, // Europa League
      'Sevilla': 1.0 // Europa League specialists
    };

    const stageImportance = {
      'Group Stage': 0.7,
      'Round of 16': 0.8,
      'Quarter Final': 0.9,
      'Semi Final': 1.0,
      'Final': 1.2
    };

    const baseMotivation = motivationFactors[team] || 0.8;
    const stageFactor = stageImportance[stage] || 0.8;
    
    return baseMotivation * stageFactor;
  }

  getStadiumFactor(venue) {
    const stadiumFactors = {
      'Santiago Bernabéu': 1.15,
      'Allianz Arena': 1.10,
      'Etihad Stadium': 1.05,
      'Parc des Princes': 1.05,
      'Anfield': 1.20,
      'Camp Nou': 1.10,
      'Old Trafford': 1.15,
      'Ramón Sánchez Pizjuán': 1.25, // Sevilla's fortress
      'Emirates Stadium': 1.05,
      'Diego Armando Maradona Stadium': 1.10
    };

    return stadiumFactors[venue] || 1.05;
  }

  getRestDaysDifference(homeTeam, awayTeam) {
    // Mock rest days difference (positive = home team more rested)
    return Math.floor(Math.random() * 5) - 2;
  }

  analyzeVenue(venue, homeTeam) {
    const venueAnalysis = {
      'Santiago Bernabéu': 'Intimidating atmosphere, Real Madrid rarely lose here',
      'Anfield': 'Famous European nights, huge advantage for Liverpool',
      'Allianz Arena': 'Modern stadium with excellent pitch, Bayern very strong',
      'Ramón Sánchez Pizjuán': 'Sevilla fortress, especially in Europa League',
      'Etihad Stadium': 'Modern facility, Manchester City dominant at home'
    };

    return venueAnalysis[venue] || `${homeTeam} has home advantage at ${venue}`;
  }

  generateTacticalPreview(homeTeam, awayTeam) {
    const tacticalMatchups = [
      `${homeTeam}'s high press vs ${awayTeam}'s counter-attack`,
      `${homeTeam}'s possession game vs ${awayTeam}'s defensive block`,
      `${homeTeam}'s wing play vs ${awayTeam}'s narrow defense`,
      `${homeTeam}'s set piece threat vs ${awayTeam}'s aerial strength`
    ];

    return tacticalMatchups[Math.floor(Math.random() * tacticalMatchups.length)];
  }

  getKeyPlayers(homeTeam, awayTeam) {
    const keyPlayers = {
      'Real Madrid': ['Vinicius Jr', 'Bellingham', 'Courtois'],
      'Bayern Munich': ['Kane', 'Musiala', 'Neuer'],
      'Manchester City': ['Haaland', 'De Bruyne', 'Rodri'],
      'PSG': ['Mbappé', 'Dembélé', 'Donnarumma'],
      'Liverpool': ['Salah', 'van Dijk', 'Alisson'],
      'Sevilla': ['Ocampos', 'Rakitic', 'Bounou'],
      'Roma': ['Dybala', 'Pellegrini', 'Patricio']
    };

    return {
      home: keyPlayers[homeTeam] || ['Star Player 1', 'Star Player 2'],
      away: keyPlayers[awayTeam] || ['Star Player A', 'Star Player B']
    };
  }

  getWeatherImpact(venue) {
    // Mock weather impact
    const weatherConditions = ['Clear', 'Rain', 'Wind', 'Cold', 'Hot'];
    const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    
    const impacts = {
      'Rain': 'Wet pitch favors technical teams, affects long balls',
      'Wind': 'Affects crossing and long passes',
      'Cold': 'Benefits physically stronger teams',
      'Hot': 'Fitness and hydration crucial',
      'Clear': 'Ideal conditions for both teams'
    };

    return {
      condition: condition,
      temperature: 15 + Math.floor(Math.random() * 15),
      impact: impacts[condition] || 'Normal playing conditions'
    };
  }

  generateBettingAnalysis(match, prediction) {
    const analysis = [];
    
    // Add confidence-based analysis
    if (prediction.confidence_score > 0.7) {
      analysis.push(`High confidence in ${prediction.predicted_outcome}`);
    } else if (prediction.confidence_score > 0.55) {
      analysis.push(`Moderate confidence in ${prediction.predicted_outcome}`);
    } else {
      analysis.push('Low confidence - consider alternative markets');
    }

    // Add value bet analysis
    const valueBets = this.identifyValueBets(match.odds, prediction.predictions);
    if (valueBets.best_value !== 'None') {
      analysis.push(`Value found in ${valueBets.best_value} market`);
    }

    // Add team-specific analysis
    if (match.homeTeam.includes('Madrid') || match.homeTeam.includes('Bayern')) {
      analysis.push('Big European night atmosphere');
    }

    // Add tactical analysis
    analysis.push(prediction.tactical_preview || 'Tactical battle expected');

    return analysis;
  }

  identifyValueBets(marketOdds, predictions) {
    // Calculate fair odds from predictions
    const fairHomeOdds = 1 / predictions.home_win;
    const fairDrawOdds = 1 / predictions.draw;
    const fairAwayOdds = 1 / predictions.away_win;

    // Calculate value (positive = underpriced by bookmakers)
    const homeValue = ((fairHomeOdds / marketOdds.homeWin) - 1) * 100;
    const drawValue = ((fairDrawOdds / marketOdds.draw) - 1) * 100;
    const awayValue = ((fairAwayOdds / marketOdds.awayWin) - 1) * 100;

    // Determine best value
    let bestValue = 'None';
    let bestValueAmount = 0;

    if (homeValue > 10 && homeValue > bestValueAmount) {
      bestValue = 'Home';
      bestValueAmount = homeValue;
    }
    if (drawValue > 10 && drawValue > bestValueAmount) {
      bestValue = 'Draw';
      bestValueAmount = drawValue;
    }
    if (awayValue > 10 && awayValue > bestValueAmount) {
      bestValue = 'Away';
      bestValueAmount = awayValue;
    }

    return {
      home: { market_odds: marketOdds.homeWin, fair_odds: fairHomeOdds.toFixed(2), value: homeValue.toFixed(1) + '%' },
      draw: { market_odds: marketOdds.draw, fair_odds: fairDrawOdds.toFixed(2), value: drawValue.toFixed(1) + '%' },
      away: { market_odds: marketOdds.awayWin, fair_odds: fairAwayOdds.toFixed(2), value: awayValue.toFixed(1) + '%' },
      best_value: bestValue,
      best_value_percentage: bestValueAmount.toFixed(1) + '%'
    };
  }

  getMarketOverview(matches) {
    const totalMatches = matches.length;
    const homeWins = matches.filter(m => m.ml_prediction.predicted_outcome === 'Home Win').length;
    const draws = matches.filter(m => m.ml_prediction.predicted_outcome === 'Draw').length;
    const awayWins = matches.filter(m => m.ml_prediction.predicted_outcome === 'Away Win').length;

    // Calculate average confidence
    const avgConfidence = matches.reduce((sum, match) => sum + match.ml_prediction.confidence_score, 0) / totalMatches;

    // Identify high-value matches
    const highValueMatches = matches.filter(m => m.value_bets.best_value !== 'None');

    return {
      total_matches: totalMatches,
      predicted_outcomes: {
        home_wins: homeWins,
        draws: draws,
        away_wins: awayWins
      },
      average_confidence: avgConfidence.toFixed(2),
      high_value_matches: highValueMatches.length,
      market_trends: this.identifyMarketTrends(matches),
      betting_insights: this.generateBettingInsights(matches)
    };
  }

  identifyMarketTrends(matches) {
    const trends = [];
    
    // Check for home advantage
    const homeWins = matches.filter(m => m.ml_prediction.predicted_outcome === 'Home Win').length;
    if (homeWins / matches.length > 0.6) {
      trends.push('Strong home advantage trend');
    }

    // Check for high-scoring matches
    const highScoringMatches = matches.filter(m => {
      const score = m.ml_prediction.expected_score.split('-');
      return parseInt(score[0]) + parseInt(score[1]) > 2.5;
    });
    
    if (highScoringMatches.length / matches.length > 0.7) {
      trends.push('High-scoring matches expected');
    }

    // Check for value opportunities
    const valueMatches = matches.filter(m => m.value_bets.best_value !== 'None');
    if (valueMatches.length > 0) {
      trends.push(`${valueMatches.length} matches with betting value identified`);
    }

    return trends.length > 0 ? trends : ['No strong market trends identified'];
  }

  generateBettingInsights(matches) {
    const insights = [];
    
    // Accumulator opportunities
    const highConfidenceMatches = matches.filter(m => m.ml_prediction.confidence_score > 0.7);
    if (highConfidenceMatches.length >= 3) {
      insights.push(`Potential accumulator: ${highConfidenceMatches.slice(0, 3).map(m => m.homeTeam).join(', ')}`);
    }

    // Both teams to score analysis
    const bttsMatches = matches.filter(m => {
      const score = m.ml_prediction.expected_score.split('-');
      return parseInt(score[0]) > 0 && parseInt(score[1]) > 0;
    });
    
    if (bttsMatches.length / matches.length > 0.6) {
      insights.push('Both Teams to Score (BTTS) looks promising');
    }

    // Over/under analysis
    const over25Matches = matches.filter(m => {
      const score = m.ml_prediction.expected_score.split('-');
      return parseInt(score[0]) + parseInt(score[1]) > 2.5;
    });
    
    if (over25Matches.length > matches.length / 2) {
      insights.push('Over 2.5 goals in majority of matches');
    }

    return insights.length > 0 ? insights : ['Standard betting markets recommended'];
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

  getFallbackChampionsLeagueData() {
    return {
      league: 'UEFA Champions League',
      matches: this.championsLeagueMatches.map(match => ({
        ...match,
        ml_prediction: this.predictor.getFallbackPrediction(),
        betting_analysis: ['Data temporarily unavailable'],
        value_bets: { best_value: 'None' },
        last_updated: new Date()
      })),
      tournament_info: {
        current_stage: 'Knockout Phase',
        defending_champion: 'Manchester City',
        message: 'Using cached data - real-time updates temporarily unavailable'
      },
      market_overview: {
        message: 'Market data loading...'
      }
    };
  }

  getFallbackEuropaLeagueData() {
    return {
      league: 'UEFA Europa League',
      matches: this.europaLeagueMatches.map(match => ({
        ...match,
        ml_prediction: this.predictor.getFallbackPrediction(),
        betting_analysis: ['Data temporarily unavailable'],
        value_bets: { best_value: 'None' },
        last_updated: new Date()
      })),
      tournament_info: {
        current_stage: 'Knockout Phase',
        defending_champion: 'Sevilla',
        message: 'Using cached data - real-time updates temporarily unavailable'
      },
      market_overview: {
        message: 'Market data loading...'
      }
    };
  }

  async getMatchPrediction(matchId) {
    // Find match in either league
    let match = this.championsLeagueMatches.find(m => m.id === matchId);
    if (!match) {
      match = this.europaLeagueMatches.find(m => m.id === matchId);
    }

    if (!match) {
      throw new Error('Match not found');
    }

    const enhancedPrediction = await this.getEnhancedPrediction(match);
    
    return {
      match_details: match,
      prediction: enhancedPrediction,
      live_updates: this.getLiveUpdates(matchId),
      historical_data: this.getHistoricalData(match.homeTeam, match.awayTeam),
      betting_markets: this.getBettingMarkets(match),
      expert_opinions: this.getExpertOpinions(match)
    };
  }

  getLiveUpdates(matchId) {
    // Mock live updates
    return {
      status: 'Pre-match',
      last_update: new Date(),
      team_news: 'Starting lineups announced in 1 hour',
      weather_update: 'Clear conditions expected',
      crowd: 'Sold out stadium',
      referee: 'Experienced UEFA referee appointed'
    };
  }

  getHistoricalData(homeTeam, awayTeam) {
    return {
      last_5_meetings: this.generateLastMeetings(homeTeam, awayTeam),
      home_team_history: `Last 5 home: ${this.getTeamStats(homeTeam).homeRecord}`,
      away_team_history: `Last 5 away: ${this.getTeamStats(awayTeam).awayRecord}`,
      competition_history: 'Both teams experienced in European competitions'
    };
  }

  generateLastMeetings(homeTeam, awayTeam) {
    // Generate last 5 meeting results
    const results = [];
    for (let i = 0; i < 5; i++) {
      const homeGoals = Math.floor(Math.random() * 4);
      const awayGoals = Math.floor(Math.random() * 4);
      const date = new Date(Date.now() - (i + 1) * 365 * 24 * 60 * 60 * 1000);
      results.push({
        date: date.toISOString().split('T')[0],
        result: `${homeGoals}-${awayGoals}`,
        winner: homeGoals > awayGoals ? homeTeam : awayGoals > homeGoals ? awayTeam : 'Draw',
        competition: i % 2 === 0 ? 'Champions League' : 'Friendly'
      });
    }
    return results;
  }

  getBettingMarkets(match) {
    return {
      main_market: {
        home_win: match.odds.homeWin,
        draw: match.odds.draw,
        away_win: match.odds.awayWin
      },
      asian_handicap: {
        home: `-0.5 @ ${(match.odds.homeWin * 0.9).toFixed(2)}`,
        away: `+0.5 @ ${(match.odds.awayWin * 1.1).toFixed(2)}`
      },
      over_under: {
        'Over 2.5': 1.85,
        'Under 2.5': 1.95
      },
      both_teams_to_score: {
        yes: 1.70,
        no: 2.10
      },
      correct_score: {
        '1-0': 7.50,
        '2-0': 8.50,
        '2-1': 9.00,
        '1-1': 6.50,
        '0-0': 10.00
      }
    };
  }

  getExpertOpinions(match) {
    const experts = [
      { name: 'Alex Ferguson', opinion: `${match.homeTeam} has the experience for these big games` },
      { name: 'José Mourinho', opinion: `${match.awayTeam} will play defensively and look to counter` },
      { name: 'Pep Guardiola', opinion: 'Possession will be key in this match' },
      { name: 'Jürgen Klopp', opinion: 'High intensity from the start expected' }
    ];

    return experts.slice(0, 2);
  }
}

module.exports = new FootballOddsService();