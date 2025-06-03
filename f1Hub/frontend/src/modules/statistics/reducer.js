import * as actionTypes from "./actionTypes";

const initialState = {
  driverStandings: [],
  constructorStandings: [],
  driverWins: [],
  driverPodiums: [],
  driverPoles: [],
  driverGrandChelems: [],
  driverWinsByTeam: [],
  driverPodiumsByTeam: [],
  driverPolesByTeam: [],
  years: [],
  constructors: [],
  championsByTitleCount: [],
  championsChronologically: [],
  championsByAge: [],
  consecutiveTitles: [],
  longestGapBetweenTitles: [],
  gpCountBeforeTitle: [],
  championsByConstructorVariety: [],
  driverWinsChronologically: [],
  teamWinsChronologically: [],
  youngestWinDrivers: [],
  oldestWinDrivers: [],
  winsOnBirthday: [],
  longestConsecutiveWinStreaks: [],
  seasonStartWinStreaks: [],
  lastCareerWins: [],
  biggestWinGaps: [],
  firstLastWinGaps: [],
  mostWinsSingleYear: [],
  mostYearsWithWins: [],
  mostConsecutiveWinningYears: [],
  gpCountBeforeFirstWin: [],
  driversWithMostWinsSameConstructor: [],
  driversWithMostConstructorsWithWins: [],
  winsByGrandPrix: [],
  consecutiveWinsByGrandPrix: [],
  mostDifferentGPsWon: [],
  mostCircuitWins: [],
  mostDifferentCircuitWins: [],
  winsByGridPosition: [],
  gridPositionsWithWins: [],
  homeGPWins: [],
  winsWithoutLeadingLap: [],
  winsWithoutPole: [],
  winsWithFastestLap: [],
  secondPlacePodiums: [],
  thirdPlacePodiums: [],
  secondThirdPlacePodiums: [],
  podiumChronology: [],
  teamPodiumChronology: [],
  youngestPodiumDrivers: [],
  podiumsOnBirthday: [],
  oldestPodiumDriversByNationality: [],
  longestPodiumStreaks: [],
  seasonStartPodiumStreaks: [],
  lastPodiums: [],
  biggestPodiumGaps: [],
  firstLastPodiumGaps: [],
  mostPodiumsSingleYear: [],
  podiumYearsCount: [],
  consecutivePodiumYears: [],
  gpCountBeforeFirstPodium: [],
  podiumsBeforeFirstWin: [],
  podiumsWithSingleConstructor: [],
  podiumsWithNoWins: [],
  podiumsWithMostConstructors: [],
  podiumsByGrandPrix: [],
  mostDifferentGPsWithPodium: [],
  mostDifferentCircuitsWithPodium: [],
  podiumsAtHomeGP: [],
  repeatedIdenticalPodiums: [],
  mostFrequentPodiumTrios: [],
  mostFrequentPodiumPairs: [],
  mostCommonFirstSecondPairs: [],
  mostPoints: [],
  pointsChronology: [],
  lastPoints: [],
  youngestPoints: [],
  oldestPoints: [],
  youngestPointsByNationality: [],
  oldestPointsByNationality: [],
  pointsStreaks: [],
  pointsStreaksNoSprints: [],
  gapBetweenPoints: [],
  gapFirstLastPoints: [],
  mostPointsSingleYear: [],
  mostPointsAllSessionsSingleYear: [],
  yearsScoringPoints: [],
  consecutiveSeasonsPoints: [],
  avgPointsPerRace: [],
  avgPointsPerSeason: [],
  pointsNoWins: [],
  pointsNoPodiums: [],
  constructorsWithPoints: [],
  gpCountBeforeFirstPoints: [],
  gpCountWhereScoredPoints: [],
  mostGrandsPrix: [],
  gpDebutChronology: [],
  gpDebutByConstructor: [],
  longestGpStreaks: [],
  biggestGpGap: [],
  firstLastGpGap: [],
  totalLapsCompleted: [],
  gpsWithChampions: [],
  gpsWithWinners: [],
  mostGpsSameConstructor: [],
  mostConstructorsInGps: [],
  mostGpsSameEngine: [],
  mostEnginesInGps: [],
  mostGpsSameTeammate: [],
  gpAgeByNationality: [],
  oldestGpDrivers: [],
  avgAgePerGp: [],
  gpsNoWin: [],
  gpsNoPole: [],
  gpsNoFastestLap: [],
  gpsNoPoints: [],
  gpsNoPodium: [],
  gpsNoLeadLap: [],
  gpsNoWinPoleFastest: [],
  mostSeasons: [],
  mostConsecutiveSeasons: [],
  seasons: [],
    seasonStreak: [],
    hatTricks: [],
    grandSlams: [],
    frontRowStarts: [],
    frontRowDuos: [],
    frontRowYoungest: [],
    frontRowStreaks: [],
    gridAverage: [],
    qualifyingFastest: [],
    finishes: [],
    finishStreak: [],
    classified: [],
    noDnfStreak: [],
    dnfs: [],
    dnfStreak: [],
    firstLapDnfs: [],
    onLeaderLap: [],
    finishPositionAvg: [],
    positionGainAvg: [],
    debutGrid: [],
    debutQualifying: [],
    lastQualifying: [],
    neverQualified: [],
    disqualifications: []


};


export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.FETCH_DRIVER_STANDINGS_COMPLETED:
      return { ...state, driverStandings: action.standings };
    case actionTypes.FETCH_CONSTRUCTOR_STANDINGS_COMPLETED:
      return { ...state, constructorStandings: action.standings };
    case actionTypes.FETCH_DRIVER_WINS_COMPLETED:
      return { ...state, driverWins: action.ranking };
    case actionTypes.FETCH_DRIVER_PODIUMS_COMPLETED:
      return { ...state, driverPodiums: action.ranking };
    case actionTypes.FETCH_DRIVER_POLES_COMPLETED:
      return { ...state, driverPoles: action.ranking };
    case actionTypes.FETCH_DRIVER_GRAND_CHELEMS_COMPLETED:
      return { ...state, driverGrandChelems: action.ranking };
    case actionTypes.FETCH_DRIVER_WINS_BY_TEAM_COMPLETED:
      return { ...state, driverWinsByTeam: action.ranking };
    case actionTypes.FETCH_DRIVER_PODIUMS_BY_TEAM_COMPLETED:
      return { ...state, driverPodiumsByTeam: action.ranking };
    case actionTypes.FETCH_DRIVER_POLES_BY_TEAM_COMPLETED:
      return { ...state, driverPolesByTeam: action.ranking };
    case actionTypes.FETCH_CONSTRUCTORS_COMPLETED:
      return { ...state, constructors: action.list };

    case actionTypes.FETCH_CHAMPIONS_BY_TITLE_COUNT_COMPLETED:
      return { ...state, championsByTitleCount: action.data };
    case actionTypes.FETCH_CHAMPIONS_CHRONOLOGICALLY_COMPLETED:
      return { ...state, championsChronologically: action.data };
    case actionTypes.FETCH_CHAMPIONS_BY_AGE_COMPLETED:
      return { ...state, championsByAge: action.data };
    case actionTypes.FETCH_CONSECUTIVE_TITLES_COMPLETED:
      return { ...state, consecutiveTitles: action.data };
    case actionTypes.FETCH_LONGEST_GAP_TITLES_COMPLETED:
      return { ...state, longestGapBetweenTitles: action.data };
    case actionTypes.FETCH_GP_COUNT_BEFORE_TITLE_COMPLETED:
      return { ...state, gpCountBeforeTitle: action.data };
    case actionTypes.FETCH_CHAMPIONS_BY_CONSTRUCTOR_VARIETY_COMPLETED:
      return { ...state, championsByConstructorVariety: action.data };


    case actionTypes.FETCH_DRIVER_WINS_CHRONOLOGICALLY_COMPLETED:
      return { ...state, driverWinsChronologically: action.data };
    case actionTypes.FETCH_TEAM_WINS_CHRONOLOGICALLY_COMPLETED:
      return { ...state, teamWinsChronologically: action.data };
    case actionTypes.FETCH_YOUNGEST_WINNERS_COMPLETED:
      return { ...state, youngestWinDrivers: action.data };
    case actionTypes.FETCH_OLDEST_WINNERS_COMPLETED:
      return { ...state, oldestWinDrivers: action.data };
    case actionTypes.FETCH_WINS_ON_BIRTHDAY_COMPLETED:
      return { ...state, winsOnBirthday: action.data };


    case actionTypes.FETCH_CONSECUTIVE_WIN_STREAKS_COMPLETED:
      return { ...state, longestConsecutiveWinStreaks: action.data };
    case actionTypes.FETCH_SEASON_START_WIN_STREAKS_COMPLETED:
      return { ...state, seasonStartWinStreaks: action.data };
    case actionTypes.FETCH_LAST_CAREER_WIN_COMPLETED:
      return { ...state, lastCareerWins: action.data };
    case actionTypes.FETCH_GAP_BETWEEN_WINS_COMPLETED:
      return { ...state, biggestWinGaps: action.data };
    case actionTypes.FETCH_GAP_FIRST_LAST_WIN_COMPLETED:
      return { ...state, firstLastWinGaps: action.data };
    case actionTypes.FETCH_MOST_WINS_SINGLE_YEAR_COMPLETED:
      return { ...state, mostWinsSingleYear: action.data };
    case actionTypes.FETCH_MOST_YEARS_WITH_WINS_COMPLETED:
      return { ...state, mostYearsWithWins: action.data };
    case actionTypes.FETCH_CONSECUTIVE_WINNING_YEARS_COMPLETED:
      return { ...state, mostConsecutiveWinningYears: action.data };
    case actionTypes.FETCH_GPS_BEFORE_FIRST_WIN_COMPLETED:
      return { ...state, gpCountBeforeFirstWin: action.data };


    case actionTypes.FETCH_MOST_WINS_SAME_CONSTRUCTOR_COMPLETED:
      return { ...state, driversWithMostWinsSameConstructor: action.data };
    case actionTypes.FETCH_MOST_CONSTRUCTORS_WITH_WINS_COMPLETED:
      return { ...state, driversWithMostConstructorsWithWins: action.data };
    case actionTypes.FETCH_WINS_BY_GP_COMPLETED:
      return { ...state, winsByGrandPrix: action.data };
    case actionTypes.FETCH_CONSECUTIVE_WINS_BY_GP_COMPLETED:
      return { ...state, consecutiveWinsByGrandPrix: action.data };
    case actionTypes.FETCH_MOST_DIFFERENT_GPS_WON_COMPLETED:
      return { ...state, mostDifferentGPsWon: action.data };
    case actionTypes.FETCH_MOST_CIRCUIT_WINS_COMPLETED:
      return { ...state, mostCircuitWins: action.data };
    case actionTypes.FETCH_MOST_DIFFERENT_CIRCUIT_WINS_COMPLETED:
      return { ...state, mostDifferentCircuitWins: action.data };
    case actionTypes.FETCH_WINS_BY_GRID_POSITION_COMPLETED:
      return { ...state, winsByGridPosition: action.data };
    case actionTypes.FETCH_MOST_GRID_POSITIONS_WITH_WINS_COMPLETED:
      return { ...state, gridPositionsWithWins: action.data };
    case actionTypes.FETCH_HOME_GP_WINS_COMPLETED:
      return { ...state, homeGPWins: action.data };
    case actionTypes.FETCH_WINS_NO_LAPS_LED_COMPLETED:
      return { ...state, winsWithoutLeadingLap: action.data };
    case actionTypes.FETCH_WINS_WITHOUT_POLE_COMPLETED:
      return { ...state, winsWithoutPole: action.data };
    case actionTypes.FETCH_WINS_WITH_FASTEST_LAP_COMPLETED:
      return { ...state, winsWithFastestLap: action.data };


    case actionTypes.FETCH_PODIUMS_SECOND_PLACE_COMPLETED:
      return { ...state, secondPlacePodiums: action.data };
    case actionTypes.FETCH_PODIUMS_THIRD_PLACE_COMPLETED:
      return { ...state, thirdPlacePodiums: action.data };
    case actionTypes.FETCH_PODIUMS_SECOND_THIRD_PLACE_COMPLETED:
      return { ...state, secondThirdPlacePodiums: action.data };
    case actionTypes.FETCH_PODIUMS_CHRONOLOGY_COMPLETED:
      return { ...state, podiumChronology: action.data };
    case actionTypes.FETCH_PODIUMS_TEAM_CHRONOLOGY_COMPLETED:
      return { ...state, teamPodiumChronology: action.data };
    case actionTypes.FETCH_PODIUMS_YOUNGEST_COMPLETED:
      return { ...state, youngestPodiumDrivers: action.data };
    case actionTypes.FETCH_PODIUMS_ON_BIRTHDAY_COMPLETED:
      return { ...state, podiumsOnBirthday: action.data };
    case actionTypes.FETCH_PODIUMS_OLDEST_BY_NATIONALITY_COMPLETED:
      return { ...state, oldestPodiumDriversByNationality: action.data };


    case actionTypes.FETCH_LONGEST_PODIUM_STREAKS_COMPLETED:
      return { ...state, longestPodiumStreaks: action.data };
    case actionTypes.FETCH_SEASON_START_PODIUM_STREAKS_COMPLETED:
      return { ...state, seasonStartPodiumStreaks: action.data };
    case actionTypes.FETCH_LAST_PODIUM_COMPLETED:
      return { ...state, lastPodiums: action.data };
    case actionTypes.FETCH_BIGGEST_PODIUM_GAP_COMPLETED:
      return { ...state, biggestPodiumGaps: action.data };
    case actionTypes.FETCH_PODIUM_FIRST_LAST_GAP_COMPLETED:
      return { ...state, firstLastPodiumGaps: action.data };
    case actionTypes.FETCH_PODIUMS_SINGLE_YEAR_COMPLETED:
      return { ...state, mostPodiumsSingleYear: action.data };
    case actionTypes.FETCH_PODIUM_YEARS_COUNT_COMPLETED:
      return { ...state, podiumYearsCount: action.data };
    case actionTypes.FETCH_CONSECUTIVE_PODIUM_YEARS_COMPLETED:
      return { ...state, consecutivePodiumYears: action.data };
    case actionTypes.FETCH_GPS_BEFORE_FIRST_PODIUM_COMPLETED:
      return { ...state, gpCountBeforeFirstPodium: action.data };
    case actionTypes.FETCH_PODIUMS_BEFORE_FIRST_WIN_COMPLETED:
      return { ...state, podiumsBeforeFirstWin: action.data };
    case actionTypes.FETCH_PODIUMS_SINGLE_CONSTRUCTOR_COMPLETED:
      return { ...state, podiumsWithSingleConstructor: action.data };
    case actionTypes.FETCH_PODIUMS_NO_WINS_COMPLETED:
      return { ...state, podiumsWithNoWins: action.data };
    case actionTypes.FETCH_PODIUMS_MOST_CONSTRUCTORS_COMPLETED:
      return { ...state, podiumsWithMostConstructors: action.data };
    case actionTypes.FETCH_PODIUMS_BY_GP_COMPLETED:
      return { ...state, podiumsByGrandPrix: action.data };
    case actionTypes.FETCH_PODIUMS_MOST_DIFFERENT_GPS_COMPLETED:
      return { ...state, mostDifferentGPsWithPodium: action.data };
    case actionTypes.FETCH_PODIUMS_MOST_DIFFERENT_CIRCUITS_COMPLETED:
      return { ...state, mostDifferentCircuitsWithPodium: action.data };
    case actionTypes.FETCH_PODIUMS_HOME_GP_COMPLETED:
      return { ...state, podiumsAtHomeGP: action.data };

    case actionTypes.FETCH_REPEATED_IDENTICAL_PODIUMS_COMPLETED:
      return { ...state, repeatedIdenticalPodiums: action.data };
    case actionTypes.FETCH_MOST_FREQUENT_PODIUM_TRIOS_COMPLETED:
      return { ...state, mostFrequentPodiumTrios: action.data };
    case actionTypes.FETCH_MOST_FREQUENT_PODIUM_PAIRS_COMPLETED:
      return { ...state, mostFrequentPodiumPairs: action.data };
    case actionTypes.FETCH_MOST_COMMON_FIRST_SECOND_PAIRS_COMPLETED:
      return { ...state, mostCommonFirstSecondPairs: action.data };



    case actionTypes.FETCH_MOST_POINTS_COMPLETED:
      return { ...state, mostPoints: action.data };
    case actionTypes.FETCH_POINTS_CHRONOLOGY_COMPLETED:
      return { ...state, pointsChronology: action.data };
    case actionTypes.FETCH_LAST_POINTS_COMPLETED:
      return { ...state, lastPoints: action.data };
    case actionTypes.FETCH_YOUNGEST_POINTS_COMPLETED:
      return { ...state, youngestPoints: action.data };
    case actionTypes.FETCH_OLDEST_POINTS_COMPLETED:
      return { ...state, oldestPoints: action.data };
    case actionTypes.FETCH_YOUNGEST_POINTS_BY_NATIONALITY_COMPLETED:
      return { ...state, youngestPointsByNationality: action.data };
    case actionTypes.FETCH_OLDEST_POINTS_BY_NATIONALITY_COMPLETED:
      return { ...state, oldestPointsByNationality: action.data };
    case actionTypes.FETCH_POINTS_STREAKS_COMPLETED:
      return { ...state, pointsStreaks: action.data };
    case actionTypes.FETCH_POINTS_STREAKS_NO_SPRINTS_COMPLETED:
      return { ...state, pointsStreaksNoSprints: action.data };
    case actionTypes.FETCH_GAP_BETWEEN_POINTS_COMPLETED:
      return { ...state, gapBetweenPoints: action.data };
    case actionTypes.FETCH_GAP_FIRST_LAST_POINTS_COMPLETED:
      return { ...state, gapFirstLastPoints: action.data };
    case actionTypes.FETCH_MOST_POINTS_SINGLE_YEAR_COMPLETED:
      return { ...state, mostPointsSingleYear: action.data };
    case actionTypes.FETCH_YEARS_SCORING_POINTS_COMPLETED:
      return { ...state, yearsScoringPoints: action.data };
    case actionTypes.FETCH_CONSECUTIVE_SEASONS_POINTS_COMPLETED:
      return { ...state, consecutiveSeasonsPoints: action.data };
    case actionTypes.FETCH_POINTS_NO_WINS_COMPLETED:
      return { ...state, pointsNoWins: action.data };
    case actionTypes.FETCH_POINTS_NO_PODIUMS_COMPLETED:
      return { ...state, pointsNoPodiums: action.data };
    case actionTypes.FETCH_CONSTRUCTORS_WITH_POINTS_COMPLETED:
      return { ...state, constructorsWithPoints: action.data };
    case actionTypes.FETCH_GPS_BEFORE_FIRST_POINTS_COMPLETED:
      return { ...state, gpCountBeforeFirstPoints: action.data };
    case actionTypes.FETCH_GPS_SCORED_POINTS_COMPLETED:
      return { ...state, gpCountWhereScoredPoints: action.data };



    case actionTypes.FETCH_MOST_GRANDS_PRIX_COMPLETED:
      return { ...state, mostGrandsPrix: action.data };
    case actionTypes.FETCH_GP_DEBUT_CHRONOLOGY_COMPLETED:
      return { ...state, gpDebutChronology: action.data };
    case actionTypes.FETCH_GP_DEBUT_BY_CONSTRUCTOR_COMPLETED:
      return { ...state, gpDebutByConstructor: action.data };
    case actionTypes.FETCH_LONGEST_GP_STREAKS_COMPLETED:
      return { ...state, longestGpStreaks: action.data };
    case actionTypes.FETCH_BIGGEST_GP_GAP_COMPLETED:
      return { ...state, biggestGpGap: action.data };
    case actionTypes.FETCH_FIRST_LAST_GP_GAP_COMPLETED:
      return { ...state, firstLastGpGap: action.data };
    case actionTypes.FETCH_TOTAL_LAPS_COMPLETED:
      return { ...state, totalLapsCompleted: action.data };
    case actionTypes.FETCH_GPS_WITH_CHAMPIONS_COMPLETED:
      return { ...state, gpsWithChampions: action.data };
    case actionTypes.FETCH_GPS_WITH_WINNERS_COMPLETED:
      return { ...state, gpsWithWinners: action.data };
    case actionTypes.FETCH_MOST_GPS_SAME_CONSTRUCTOR_COMPLETED:
      return { ...state, mostGpsSameConstructor: action.data };
    case actionTypes.FETCH_MOST_CONSTRUCTORS_IN_GPS_COMPLETED:
      return { ...state, mostConstructorsInGps: action.data };
    case actionTypes.FETCH_MOST_GPS_SAME_ENGINE_COMPLETED:
      return { ...state, mostGpsSameEngine: action.data };
    case actionTypes.FETCH_MOST_ENGINES_IN_GPS_COMPLETED:
      return { ...state, mostEnginesInGps: action.data };
    case actionTypes.FETCH_MOST_GPS_SAME_TEAMMATE_COMPLETED:
      return { ...state, mostGpsSameTeammate: action.data };
    case actionTypes.FETCH_GP_AGE_BY_NATIONALITY_COMPLETED:
      return { ...state, gpAgeByNationality: action.data };
    case actionTypes.FETCH_OLDEST_GP_DRIVERS_COMPLETED:
      return { ...state, oldestGpDrivers: action.data };
    case actionTypes.FETCH_AVG_AGE_PER_GP_COMPLETED:
      return { ...state, avgAgePerGp: action.data };
    case actionTypes.FETCH_GPS_NO_WIN_COMPLETED:
      return { ...state, gpsNoWin: action.data };
    case actionTypes.FETCH_GPS_NO_POLE_COMPLETED:
      return { ...state, gpsNoPole: action.data };
    case actionTypes.FETCH_GPS_NO_FASTEST_LAP_COMPLETED:
      return { ...state, gpsNoFastestLap: action.data };
    case actionTypes.FETCH_GPS_NO_POINTS_COMPLETED:
      return { ...state, gpsNoPoints: action.data };
    case actionTypes.FETCH_GPS_NO_PODIUM_COMPLETED:
      return { ...state, gpsNoPodium: action.data };
    case actionTypes.FETCH_GPS_NO_LEAD_LAP_COMPLETED:
      return { ...state, gpsNoLeadLap: action.data };
    case actionTypes.FETCH_GPS_NO_WIN_POLE_FASTEST_COMPLETED:
      return { ...state, gpsNoWinPoleFastest: action.data };
    case actionTypes.FETCH_MOST_SEASONS_COMPLETED:
      return { ...state, mostSeasons: action.data };
    case actionTypes.FETCH_MOST_CONSECUTIVE_SEASONS_COMPLETED:
      return { ...state, mostConsecutiveSeasons: action.data };

    case actionTypes.FETCH_VARIOS_SEASONS_COMPLETED:
          return { ...state, seasons: action.data };

    case actionTypes.FETCH_VARIOS_SEASON_STREAK_COMPLETED:
      return { ...state, seasonStreak: action.data };

    case actionTypes.FETCH_VARIOS_HAT_TRICKS_COMPLETED:
      return { ...state, hatTricks: action.data };

    case actionTypes.FETCH_VARIOS_GRAND_SLAMS_COMPLETED:
      return { ...state, grandSlams: action.data };

    case actionTypes.FETCH_VARIOS_FRONT_ROW_STARTS_COMPLETED:
      return { ...state, frontRowStarts: action.data };

    case actionTypes.FETCH_VARIOS_FRONT_ROW_DUOS_COMPLETED:
      return { ...state, frontRowDuos: action.data };

    case actionTypes.FETCH_VARIOS_FRONT_ROW_YOUNGEST_COMPLETED:
      return { ...state, frontRowYoungest: action.data };

    case actionTypes.FETCH_VARIOS_FRONT_ROW_STREAKS_COMPLETED:
      return { ...state, frontRowStreaks: action.data };

    case actionTypes.FETCH_VARIOS_GRID_AVERAGE_COMPLETED:
      return { ...state, gridAverage: action.data };

    case actionTypes.FETCH_VARIOS_QUALI_FASTEST_COMPLETED:
      return { ...state, qualifyingFastest: action.data };

    case actionTypes.FETCH_VARIOS_FINISHES_COMPLETED:
      return { ...state, finishes: action.data };

    case actionTypes.FETCH_VARIOS_FINISH_STREAK_COMPLETED:
      return { ...state, finishStreak: action.data };

    case actionTypes.FETCH_VARIOS_CLASSIFIED_COMPLETED:
      return { ...state, classified: action.data };

    case actionTypes.FETCH_VARIOS_NO_DNF_STREAK_COMPLETED:
      return { ...state, noDnfStreak: action.data };

    case actionTypes.FETCH_VARIOS_DNFS_COMPLETED:
      return { ...state, dnfs: action.data };

    case actionTypes.FETCH_VARIOS_DNF_STREAK_COMPLETED:
      return { ...state, dnfStreak: action.data };

    case actionTypes.FETCH_VARIOS_FIRST_LAP_DNFS_COMPLETED:
      return { ...state, firstLapDnfs: action.data };

    case actionTypes.FETCH_VARIOS_ON_LEADER_LAP_COMPLETED:
      return { ...state, onLeaderLap: action.data };

    case actionTypes.FETCH_VARIOS_FINISH_POSITION_AVG_COMPLETED:
      return { ...state, finishPositionAvg: action.data };

    case actionTypes.FETCH_VARIOS_POSITION_GAIN_AVG_COMPLETED:
      return { ...state, positionGainAvg: action.data };

    case actionTypes.FETCH_VARIOS_DEBUT_GRID_COMPLETED:
      return { ...state, debutGrid: action.data };

    case actionTypes.FETCH_VARIOS_DEBUT_QUALIFYING_COMPLETED:
      return { ...state, debutQualifying: action.data };

    case actionTypes.FETCH_VARIOS_LAST_QUALIFYING_COMPLETED:
      return { ...state, lastQualifying: action.data };

    case actionTypes.FETCH_VARIOS_NEVER_QUALIFIED_COMPLETED:
      return { ...state, neverQualified: action.data };

    case actionTypes.FETCH_VARIOS_DISQUALIFICATIONS_COMPLETED:
      return { ...state, disqualifications: action.data };


    default:
      return state;
  }
}
