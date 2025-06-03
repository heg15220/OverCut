import backend from "../../backend";
import * as actionTypes from "./actionTypes";

export const fetchDriverStandings = (year) => dispatch =>
  backend.statisticsService.getDriverStandings(
    year,
    standings => dispatch({ type: actionTypes.FETCH_DRIVER_STANDINGS_COMPLETED, standings }),
    () => {}
  );

export const fetchConstructorStandings = (year) => dispatch =>
  backend.statisticsService.getConstructorStandings(
    year,
    standings => dispatch({ type: actionTypes.FETCH_CONSTRUCTOR_STANDINGS_COMPLETED, standings }),
    () => {}
  );

export const fetchDriverWins = () => dispatch =>
  backend.statisticsService.getDriverWinRanking(
    ranking => dispatch({ type: actionTypes.FETCH_DRIVER_WINS_COMPLETED, ranking }),
    () => {}
  );

export const fetchDriverPodiums = () => dispatch =>
  backend.statisticsService.getDriverPodiumRanking(
    ranking => dispatch({ type: actionTypes.FETCH_DRIVER_PODIUMS_COMPLETED, ranking }),
    () => {}
  );


export const fetchDriverPoles = () => dispatch =>
  backend.statisticsService.getDriverPoleRanking(
    ranking => dispatch({ type: actionTypes.FETCH_DRIVER_POLES_COMPLETED, ranking }),
    () => {}
  );

export const fetchDriverGrandChelems = () => dispatch =>
  backend.statisticsService.getDriverGrandChelemRanking(
    ranking => dispatch({ type: actionTypes.FETCH_DRIVER_GRAND_CHELEMS_COMPLETED, ranking }),
    () => {}
  );


export const fetchDriverWinsByTeam = (team) => dispatch =>
  backend.statisticsService.getDriverWinsByTeam(
    team,
    ranking => dispatch({ type: actionTypes.FETCH_DRIVER_WINS_BY_TEAM_COMPLETED, ranking }),
    () => {}
  );

export const fetchDriverPodiumsByTeam = (team) => dispatch =>
  backend.statisticsService.getDriverPodiumsByTeam(
    team,
    ranking => dispatch({ type: actionTypes.FETCH_DRIVER_PODIUMS_BY_TEAM_COMPLETED, ranking }),
    () => {}
  );

export const fetchDriverPolesByTeam = (team) => dispatch =>
  backend.statisticsService.getDriverPolesByTeam(
    team,
    ranking => dispatch({ type: actionTypes.FETCH_DRIVER_POLES_BY_TEAM_COMPLETED, ranking }),
    () => {}
  );


export const fetchConstructors = () => dispatch =>
  backend.statisticsService.getAllConstructorOptions(
    list => dispatch({ type: actionTypes.FETCH_CONSTRUCTORS_COMPLETED, list }),
    () => {}
  );

export const fetchChampionsByTitleCount = () => dispatch =>
  backend.statisticsService.getChampionsByTitleCount(
    data => dispatch({ type: actionTypes.FETCH_CHAMPIONS_BY_TITLE_COUNT_COMPLETED, data }),
    () => {}
  );

export const fetchChampionsChronologically = () => dispatch =>
  backend.statisticsService.getChampionsChronologically(
    data => dispatch({ type: actionTypes.FETCH_CHAMPIONS_CHRONOLOGICALLY_COMPLETED, data }),
    () => {}
  );

export const fetchChampionsByAge = () => dispatch =>
  backend.statisticsService.getChampionsByAge(
    data => dispatch({ type: actionTypes.FETCH_CHAMPIONS_BY_AGE_COMPLETED, data }),
    () => {}
  );

export const fetchConsecutiveChampions = () => dispatch =>
  backend.statisticsService.getConsecutiveChampions(
    data => dispatch({ type: actionTypes.FETCH_CONSECUTIVE_TITLES_COMPLETED, data }),
    () => {}
  );

export const fetchLongestGapBetweenTitles = () => dispatch =>
  backend.statisticsService.getLongestGapBetweenTitles(
    data => dispatch({ type: actionTypes.FETCH_LONGEST_GAP_TITLES_COMPLETED, data }),
    () => {}
  );

export const fetchGpCountBeforeFirstTitle = () => dispatch =>
  backend.statisticsService.getGpCountBeforeFirstTitle(
    data => dispatch({ type: actionTypes.FETCH_GP_COUNT_BEFORE_TITLE_COMPLETED, data }),
    () => {}
  );

export const fetchChampionsByConstructorVariety = () => dispatch =>
  backend.statisticsService.getChampionsByConstructorVariety(
    data => dispatch({ type: actionTypes.FETCH_CHAMPIONS_BY_CONSTRUCTOR_VARIETY_COMPLETED, data }),
    () => {}
  );

export const fetchDriverWinsChronologically = () => dispatch =>
  backend.statisticsService.getDriverWinsChronologically(
    data => dispatch({ type: actionTypes.FETCH_DRIVER_WINS_CHRONOLOGICALLY_COMPLETED, data }),
    () => {}
  );

export const fetchTeamWinsChronologically = () => dispatch =>
  backend.statisticsService.getTeamWinsChronologically(
    data => dispatch({ type: actionTypes.FETCH_TEAM_WINS_CHRONOLOGICALLY_COMPLETED, data }),
    () => {}
  );

export const fetchYoungestDriversAtFirstWin = () => dispatch =>
  backend.statisticsService.getYoungestDriversAtFirstWin(
    data => dispatch({ type: actionTypes.FETCH_YOUNGEST_WINNERS_COMPLETED, data }),
    () => {}
  );

export const fetchOldestDriversToWin = () => dispatch =>
  backend.statisticsService.getOldestDriversToWin(
    data => dispatch({ type: actionTypes.FETCH_OLDEST_WINNERS_COMPLETED, data }),
    () => {}
  );

export const fetchWinsOnBirthday = () => dispatch =>
  backend.statisticsService.getWinsOnBirthday(
    data => dispatch({ type: actionTypes.FETCH_WINS_ON_BIRTHDAY_COMPLETED, data }),
    () => {}
  );

export const fetchLongestConsecutiveWinStreaks = () => dispatch =>
  backend.statisticsService.getLongestConsecutiveWinStreaks(
    data => dispatch({ type: actionTypes.FETCH_CONSECUTIVE_WIN_STREAKS_COMPLETED, data }),
    () => {}
  );

export const fetchLongestSeasonStartWinStreaks = () => dispatch =>
  backend.statisticsService.getLongestSeasonStartWinStreaks(
    data => dispatch({ type: actionTypes.FETCH_SEASON_START_WIN_STREAKS_COMPLETED, data }),
    () => {}
  );

export const fetchLastCareerWinPerDriver = () => dispatch =>
  backend.statisticsService.getLastCareerWinPerDriver(
    data => dispatch({ type: actionTypes.FETCH_LAST_CAREER_WIN_COMPLETED, data }),
    () => {}
  );

export const fetchBiggestGapBetweenWins = () => dispatch =>
  backend.statisticsService.getBiggestGapBetweenWins(
    data => dispatch({ type: actionTypes.FETCH_GAP_BETWEEN_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchGapBetweenFirstAndLastWin = () => dispatch =>
  backend.statisticsService.getGapBetweenFirstAndLastWin(
    data => dispatch({ type: actionTypes.FETCH_GAP_FIRST_LAST_WIN_COMPLETED, data }),
    () => {}
  );

export const fetchMostWinsInSingleYear = () => dispatch =>
  backend.statisticsService.getMostWinsInSingleYear(
    data => dispatch({ type: actionTypes.FETCH_MOST_WINS_SINGLE_YEAR_COMPLETED, data }),
    () => {}
  );

export const fetchMostYearsWithWins = () => dispatch =>
  backend.statisticsService.getMostYearsWithWins(
    data => dispatch({ type: actionTypes.FETCH_MOST_YEARS_WITH_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchMostConsecutiveWinningYears = () => dispatch =>
  backend.statisticsService.getMostConsecutiveWinningYears(
    data => dispatch({ type: actionTypes.FETCH_CONSECUTIVE_WINNING_YEARS_COMPLETED, data }),
    () => {}
  );

export const fetchGpCountBeforeFirstWin = () => dispatch =>
  backend.statisticsService.getGpCountBeforeFirstWin(
    data => dispatch({ type: actionTypes.FETCH_GPS_BEFORE_FIRST_WIN_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostWinsSameConstructor = () => dispatch =>
  backend.statisticsService.getDriversWithMostWinsSameConstructor(
    data => dispatch({ type: actionTypes.FETCH_MOST_WINS_SAME_CONSTRUCTOR_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostConstructorsWithWins = () => dispatch =>
  backend.statisticsService.getDriversWithMostConstructorsWithWins(
    data => dispatch({ type: actionTypes.FETCH_MOST_CONSTRUCTORS_WITH_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchWinsByGrandPrix = () => dispatch =>
  backend.statisticsService.getWinsByGrandPrix(
    data => dispatch({ type: actionTypes.FETCH_WINS_BY_GP_COMPLETED, data }),
    () => {}
  );

export const fetchConsecutiveWinsByGrandPrix = () => dispatch =>
  backend.statisticsService.getConsecutiveWinsByGrandPrix(
    data => dispatch({ type: actionTypes.FETCH_CONSECUTIVE_WINS_BY_GP_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostDifferentGPsWon = () => dispatch =>
  backend.statisticsService.getDriversWithMostDifferentGPsWon(
    data => dispatch({ type: actionTypes.FETCH_MOST_DIFFERENT_GPS_WON_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostCircuitWins = () => dispatch =>
  backend.statisticsService.getDriversWithMostCircuitWins(
    data => dispatch({ type: actionTypes.FETCH_MOST_CIRCUIT_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostDifferentCircuitWins = () => dispatch =>
  backend.statisticsService.getDriversWithMostDifferentCircuitWins(
    data => dispatch({ type: actionTypes.FETCH_MOST_DIFFERENT_CIRCUIT_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchWinsByStartingGridPosition = () => dispatch =>
  backend.statisticsService.getWinsByStartingGridPosition(
    data => dispatch({ type: actionTypes.FETCH_WINS_BY_GRID_POSITION_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostGridPositionsWithWins = () => dispatch =>
  backend.statisticsService.getDriversWithMostGridPositionsWithWins(
    data => dispatch({ type: actionTypes.FETCH_MOST_GRID_POSITIONS_WITH_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithHomeGPWins = () => dispatch =>
  backend.statisticsService.getDriversWithHomeGPWins(
    data => dispatch({ type: actionTypes.FETCH_HOME_GP_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchWinsWithoutLeadingAnyLap = () => dispatch =>
  backend.statisticsService.getWinsWithoutLeadingAnyLap(
    data => dispatch({ type: actionTypes.FETCH_WINS_NO_LAPS_LED_COMPLETED, data }),
    () => {}
  );

export const fetchWinsWithoutPolePosition = () => dispatch =>
  backend.statisticsService.getWinsWithoutPolePosition(
    data => dispatch({ type: actionTypes.FETCH_WINS_WITHOUT_POLE_COMPLETED, data }),
    () => {}
  );

export const fetchWinsWithFastestLap = () => dispatch =>
  backend.statisticsService.getWinsWithFastestLap(
    data => dispatch({ type: actionTypes.FETCH_WINS_WITH_FASTEST_LAP_COMPLETED, data }),
    () => {}
  );

export const fetchSecondPlacePodiums = () => dispatch =>
  backend.statisticsService.getSecondPlacePodiums(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_SECOND_PLACE_COMPLETED, data }),
    () => {}
  );

export const fetchThirdPlacePodiums = () => dispatch =>
  backend.statisticsService.getThirdPlacePodiums(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_THIRD_PLACE_COMPLETED, data }),
    () => {}
  );

export const fetchSecondAndThirdPlacePodiums = () => dispatch =>
  backend.statisticsService.getSecondAndThirdPlacePodiums(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_SECOND_THIRD_PLACE_COMPLETED, data }),
    () => {}
  );

export const fetchPodiumChronology = () => dispatch =>
  backend.statisticsService.getPodiumChronology(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_CHRONOLOGY_COMPLETED, data }),
    () => {}
  );

export const fetchTeamPodiumChronology = () => dispatch =>
  backend.statisticsService.getTeamPodiumChronology(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_TEAM_CHRONOLOGY_COMPLETED, data }),
    () => {}
  );

export const fetchYoungestPodiumDrivers = () => dispatch =>
  backend.statisticsService.getYoungestPodiumDrivers(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_YOUNGEST_COMPLETED, data }),
    () => {}
  );

export const fetchPodiumsOnBirthday = () => dispatch =>
  backend.statisticsService.getPodiumsOnBirthday(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_ON_BIRTHDAY_COMPLETED, data }),
    () => {}
  );

export const fetchOldestPodiumDriversByNationality = () => dispatch =>
  backend.statisticsService.getOldestPodiumDriversByNationality(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_OLDEST_BY_NATIONALITY_COMPLETED, data }),
    () => {}
  );

export const fetchLongestPodiumStreaks = () => dispatch =>
  backend.statisticsService.getLongestPodiumStreaks(
    data => dispatch({ type: actionTypes.FETCH_LONGEST_PODIUM_STREAKS_COMPLETED, data }),
    () => {}
  );

export const fetchSeasonStartPodiumStreaks = () => dispatch =>
  backend.statisticsService.getSeasonStartPodiumStreaks(
    data => dispatch({ type: actionTypes.FETCH_SEASON_START_PODIUM_STREAKS_COMPLETED, data }),
    () => {}
  );

export const fetchLastPodiumPerDriver = () => dispatch =>
  backend.statisticsService.getLastPodiumPerDriver(
    data => dispatch({ type: actionTypes.FETCH_LAST_PODIUM_COMPLETED, data }),
    () => {}
  );

export const fetchBiggestGapBetweenPodiums = () => dispatch =>
  backend.statisticsService.getBiggestGapBetweenPodiums(
    data => dispatch({ type: actionTypes.FETCH_BIGGEST_PODIUM_GAP_COMPLETED, data }),
    () => {}
  );

export const fetchGapBetweenFirstAndLastPodium = () => dispatch =>
  backend.statisticsService.getGapBetweenFirstAndLastPodium(
    data => dispatch({ type: actionTypes.FETCH_PODIUM_FIRST_LAST_GAP_COMPLETED, data }),
    () => {}
  );

export const fetchMostPodiumsInSingleYear = () => dispatch =>
  backend.statisticsService.getMostPodiumsInSingleYear(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_SINGLE_YEAR_COMPLETED, data }),
    () => {}
  );

export const fetchPodiumYearsCount = () => dispatch =>
  backend.statisticsService.getPodiumYearsCount(
    data => dispatch({ type: actionTypes.FETCH_PODIUM_YEARS_COUNT_COMPLETED, data }),
    () => {}
  );

export const fetchConsecutivePodiumYears = () => dispatch =>
  backend.statisticsService.getConsecutivePodiumYears(
    data => dispatch({ type: actionTypes.FETCH_CONSECUTIVE_PODIUM_YEARS_COMPLETED, data }),
    () => {}
  );

export const fetchGpCountBeforeFirstPodium = () => dispatch =>
  backend.statisticsService.getGpCountBeforeFirstPodium(
    data => dispatch({ type: actionTypes.FETCH_GPS_BEFORE_FIRST_PODIUM_COMPLETED, data }),
    () => {}
  );

export const fetchPodiumsBeforeFirstWin = () => dispatch =>
  backend.statisticsService.getPodiumsBeforeFirstWin(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_BEFORE_FIRST_WIN_COMPLETED, data }),
    () => {}
  );

export const fetchPodiumsWithSingleConstructor = () => dispatch =>
  backend.statisticsService.getPodiumsWithSingleConstructor(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_SINGLE_CONSTRUCTOR_COMPLETED, data }),
    () => {}
  );

export const fetchPodiumsWithNoWins = () => dispatch =>
  backend.statisticsService.getPodiumsWithNoWins(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_NO_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchPodiumsWithMostConstructors = () => dispatch =>
  backend.statisticsService.getPodiumsWithMostConstructors(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_MOST_CONSTRUCTORS_COMPLETED, data }),
    () => {}
  );

export const fetchPodiumsByGrandPrix = () => dispatch =>
  backend.statisticsService.getPodiumsByGrandPrix(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_BY_GP_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostDifferentGPsWithPodium = () => dispatch =>
  backend.statisticsService.getDriversWithMostDifferentGPsWithPodium(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_MOST_DIFFERENT_GPS_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostDifferentCircuitsWithPodium = () => dispatch =>
  backend.statisticsService.getDriversWithMostDifferentCircuitsWithPodium(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_MOST_DIFFERENT_CIRCUITS_COMPLETED, data }),
    () => {}
  );

export const fetchPodiumsAtHomeGP = () => dispatch =>
  backend.statisticsService.getPodiumsAtHomeGP(
    data => dispatch({ type: actionTypes.FETCH_PODIUMS_HOME_GP_COMPLETED, data }),
    () => {}
  );

export const fetchRepeatedIdenticalPodiums = () => dispatch =>
  backend.statisticsService.getRepeatedIdenticalPodiums(
    data => dispatch({ type: actionTypes.FETCH_REPEATED_IDENTICAL_PODIUMS_COMPLETED, data }),
    () => {}
  );

export const fetchMostFrequentPodiumTrios = () => dispatch =>
  backend.statisticsService.getMostFrequentPodiumTrios(
    data => dispatch({ type: actionTypes.FETCH_MOST_FREQUENT_PODIUM_TRIOS_COMPLETED, data }),
    () => {}
  );

export const fetchMostFrequentPodiumPairs = () => dispatch =>
  backend.statisticsService.getMostFrequentPodiumPairs(
    data => dispatch({ type: actionTypes.FETCH_MOST_FREQUENT_PODIUM_PAIRS_COMPLETED, data }),
    () => {}
  );



export const fetchMostCommonFirstSecondPairs = () => dispatch =>
  backend.statisticsService.getMostCommonFirstSecondPairs(
    data => dispatch({ type: actionTypes.FETCH_MOST_COMMON_FIRST_SECOND_PAIRS_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostPoints = () => dispatch =>
  backend.statisticsService.getDriversWithMostPoints(
    data => dispatch({ type: actionTypes.FETCH_MOST_POINTS_COMPLETED, data }),
    () => {}
  );

export const fetchDriversToScorePointsChronologically = () => dispatch =>
  backend.statisticsService.getDriversToScorePointsChronologically(
    data => dispatch({ type: actionTypes.FETCH_POINTS_CHRONOLOGY_COMPLETED, data }),
    () => {}
  );

export const fetchLastPointsPerDriver = () => dispatch =>
  backend.statisticsService.getLastPointsPerDriver(
    data => dispatch({ type: actionTypes.FETCH_LAST_POINTS_COMPLETED, data }),
    () => {}
  );

export const fetchYoungestDriversToScorePoints = () => dispatch =>
  backend.statisticsService.getYoungestDriversToScorePoints(
    data => dispatch({ type: actionTypes.FETCH_YOUNGEST_POINTS_COMPLETED, data }),
    () => {}
  );

export const fetchOldestDriversToScorePoints = () => dispatch =>
  backend.statisticsService.getOldestDriversToScorePoints(
    data => dispatch({ type: actionTypes.FETCH_OLDEST_POINTS_COMPLETED, data }),
    () => {}
  );

export const fetchYoungestDriversToScorePointsByNationality = () => dispatch =>
  backend.statisticsService.getYoungestDriversToScorePointsByNationality(
    data => dispatch({ type: actionTypes.FETCH_YOUNGEST_POINTS_BY_NATIONALITY_COMPLETED, data }),
    () => {}
  );

export const fetchOldestDriversToScorePointsByNationality = () => dispatch =>
  backend.statisticsService.getOldestDriversToScorePointsByNationality(
    data => dispatch({ type: actionTypes.FETCH_OLDEST_POINTS_BY_NATIONALITY_COMPLETED, data }),
    () => {}
  );

export const fetchLongestConsecutivePointsStreaks = () => dispatch =>
  backend.statisticsService.getLongestConsecutivePointsStreaks(
    data => dispatch({ type: actionTypes.FETCH_POINTS_STREAKS_COMPLETED, data }),
    () => {}
  );

export const fetchLongestConsecutivePointsStreaksWithoutSprints = () => dispatch =>
  backend.statisticsService.getLongestConsecutivePointsStreaksWithoutSprints(
    data => dispatch({ type: actionTypes.FETCH_POINTS_STREAKS_NO_SPRINTS_COMPLETED, data }),
    () => {}
  );

export const fetchLongestGapBetweenPoints = () => dispatch =>
  backend.statisticsService.getLongestGapBetweenPoints(
    data => dispatch({ type: actionTypes.FETCH_GAP_BETWEEN_POINTS_COMPLETED, data }),
    () => {}
  );

export const fetchGapBetweenFirstAndLastPoints = () => dispatch =>
  backend.statisticsService.getGapBetweenFirstAndLastPoints(
    data => dispatch({ type: actionTypes.FETCH_GAP_FIRST_LAST_POINTS_COMPLETED, data }),
    () => {}
  );

export const fetchMostPointsInSingleYear = () => dispatch =>
  backend.statisticsService.getMostPointsInSingleYear(
    data => dispatch({ type: actionTypes.FETCH_MOST_POINTS_SINGLE_YEAR_COMPLETED, data }),
    () => {}
  );


export const fetchMostYearsScoringPoints = () => dispatch =>
  backend.statisticsService.getMostYearsScoringPoints(
    data => dispatch({ type: actionTypes.FETCH_YEARS_SCORING_POINTS_COMPLETED, data }),
    () => {}
  );

export const fetchMostConsecutiveSeasonsWithPoints = () => dispatch =>
  backend.statisticsService.getMostConsecutiveSeasonsWithPoints(
    data => dispatch({ type: actionTypes.FETCH_CONSECUTIVE_SEASONS_POINTS_COMPLETED, data }),
    () => {}
  );


export const fetchDriversWithPointsButNoWins = () => dispatch =>
  backend.statisticsService.getDriversWithPointsButNoWins(
    data => dispatch({ type: actionTypes.FETCH_POINTS_NO_WINS_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithPointsButNoPodiums = () => dispatch =>
  backend.statisticsService.getDriversWithPointsButNoPodiums(
    data => dispatch({ type: actionTypes.FETCH_POINTS_NO_PODIUMS_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostConstructorsWithPoints = () => dispatch =>
  backend.statisticsService.getDriversWithMostConstructorsWithPoints(
    data => dispatch({ type: actionTypes.FETCH_CONSTRUCTORS_WITH_POINTS_COMPLETED, data }),
    () => {}
  );

export const fetchGpCountBeforeFirstPoints = () => dispatch =>
  backend.statisticsService.getGpCountBeforeFirstPoints(
    data => dispatch({ type: actionTypes.FETCH_GPS_BEFORE_FIRST_POINTS_COMPLETED, data }),
    () => {}
  );

export const fetchGpCountWhereDriverScoredPoints = () => dispatch =>
  backend.statisticsService.getGpCountWhereDriverScoredPoints(
    data => dispatch({ type: actionTypes.FETCH_GPS_SCORED_POINTS_COMPLETED, data }),
    () => {}
  );

export const getDriversWithMostGrandsPrix = () => dispatch =>
    backend.statisticsService.getDriversWithMostGrandsPrix(
        data => dispatch({ type: actionTypes.FETCH_MOST_GRANDS_PRIX_COMPLETED, data }),
        () => {}
    );

export const fetchMostConsecutiveSeasons = () => dispatch =>
    backend.statisticsService.getDriversWithMostConsecutiveSeasons(
      data => dispatch({ type: actionTypes.FETCH_MOST_CONSECUTIVE_SEASONS_COMPLETED, data }),
      () => {}
    );

export const fetchMostSeasons = () => dispatch =>
    backend.statisticsService.getDriversWithMostSeasons(
      data => dispatch({ type: actionTypes.FETCH_MOST_CONSECUTIVE_SEASONS_COMPLETED, data }),
      () => {}
    );

export const fetchDriverGpDebutChronology = () => dispatch =>
  backend.statisticsService.getDriverGpDebutChronology(
    data => dispatch({ type: actionTypes.FETCH_GP_DEBUT_CHRONOLOGY_COMPLETED, data }),
    () => {}
  );

export const fetchGpDebutChronologyByConstructor = () => dispatch =>
  backend.statisticsService.getGpDebutChronologyByConstructor(
    data => dispatch({ type: actionTypes.FETCH_GP_DEBUT_BY_CONSTRUCTOR_COMPLETED, data }),
    () => {}
  );


export const fetchLongestGpStreaks = () => dispatch =>
  backend.statisticsService.getLongestGpStreaks(
    data => dispatch({ type: actionTypes.FETCH_LONGEST_GP_STREAKS_COMPLETED, data }),
    () => {}
  );

export const fetchBiggestGapBetweenGrandsPrix = () => dispatch =>
  backend.statisticsService.getBiggestGapBetweenGrandsPrix(
    data => dispatch({ type: actionTypes.FETCH_BIGGEST_GP_GAP_COMPLETED, data }),
    () => {}
  );

export const fetchGapBetweenFirstAndLastGp = () => dispatch =>
  backend.statisticsService.getGapBetweenFirstAndLastGp(
    data => dispatch({ type: actionTypes.FETCH_FIRST_LAST_GP_GAP_COMPLETED, data }),
    () => {}
  );

export const fetchDriversByTotalLapsCompleted = () => dispatch =>
  backend.statisticsService.getDriversByTotalLapsCompleted(
    data => dispatch({ type: actionTypes.FETCH_TOTAL_LAPS_COMPLETED, data }),
    () => {}
  );



export const fetchDriversWithGpsWithWorldChampions = () => dispatch =>
  backend.statisticsService.getDriversWithGpsWithWorldChampions(
    data => dispatch({ type: actionTypes.FETCH_GPS_WITH_CHAMPIONS_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithGpsWithRaceWinner = () => dispatch =>
  backend.statisticsService.getDriversWithGpsWithRaceWinner(
    data => dispatch({ type: actionTypes.FETCH_GPS_WITH_WINNERS_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostGpsWithSameConstructor = () => dispatch =>
  backend.statisticsService.getDriversWithMostGpsWithSameConstructor(
    data => dispatch({ type: actionTypes.FETCH_MOST_GPS_SAME_CONSTRUCTOR_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostConstructorsInGps = () => dispatch =>
  backend.statisticsService.getDriversWithMostConstructorsInGps(
    data => dispatch({ type: actionTypes.FETCH_MOST_CONSTRUCTORS_IN_GPS_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostGpsWithSameEngine = () => dispatch =>
  backend.statisticsService.getDriversWithMostGpsWithSameEngine(
    data => dispatch({ type: actionTypes.FETCH_MOST_GPS_SAME_ENGINE_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostEnginesInGps = () => dispatch =>
  backend.statisticsService.getDriversWithMostEnginesInGps(
    data => dispatch({ type: actionTypes.FETCH_MOST_ENGINES_IN_GPS_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostGpsWithSameTeammate = () => dispatch =>
  backend.statisticsService.getDriversWithMostGpsWithSameTeammate(
    data => dispatch({ type: actionTypes.FETCH_MOST_GPS_SAME_TEAMMATE_COMPLETED, data }),
    () => {}
  );


export const fetchDriversGpAgeByNationality = () => dispatch =>
  backend.statisticsService.getDriversGpAgeByNationality(
    data => dispatch({ type: actionTypes.FETCH_GP_AGE_BY_NATIONALITY_COMPLETED, data }),
    () => {}
  );

export const fetchOldestDriversAtGp = () => dispatch =>
  backend.statisticsService.getOldestDriversAtGp(
    data => dispatch({ type: actionTypes.FETCH_OLDEST_GP_DRIVERS_COMPLETED, data }),
    () => {}
  );

export const fetchAverageDriverAgePerGp = () => dispatch =>
  backend.statisticsService.getAverageDriverAgePerGp(
    data => dispatch({ type: actionTypes.FETCH_AVG_AGE_PER_GP_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostGpsWithoutWin = () => dispatch =>
  backend.statisticsService.getDriversWithMostGpsWithoutWin(
    data => dispatch({ type: actionTypes.FETCH_GPS_NO_WIN_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostGpsWithoutPole = () => dispatch =>
  backend.statisticsService.getDriversWithMostGpsWithoutPole(
    data => dispatch({ type: actionTypes.FETCH_GPS_NO_POLE_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostGpsWithoutFastestLap = () => dispatch =>
  backend.statisticsService.getDriversWithMostGpsWithoutFastestLap(
    data => dispatch({ type: actionTypes.FETCH_GPS_NO_FASTEST_LAP_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostGpsWithoutPoints = () => dispatch =>
  backend.statisticsService.getDriversWithMostGpsWithoutPoints(
    data => dispatch({ type: actionTypes.FETCH_GPS_NO_POINTS_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostGpsWithoutPodium = () => dispatch =>
  backend.statisticsService.getDriversWithMostGpsWithoutPodium(
    data => dispatch({ type: actionTypes.FETCH_GPS_NO_PODIUM_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithMostGpsWithoutLeadingLap = () => dispatch =>
  backend.statisticsService.getDriversWithMostGpsWithoutLeadingLap(
    data => dispatch({ type: actionTypes.FETCH_GPS_NO_LEAD_LAP_COMPLETED, data }),
    () => {}
  );

export const fetchDriversWithGpsWithoutWinPoleOrFastestLap = () => dispatch =>
  backend.statisticsService.getDriversWithGpsWithoutWinPoleOrFastestLap(
    data => dispatch({ type: actionTypes.FETCH_GPS_NO_WIN_POLE_FASTEST_COMPLETED, data }),
    () => {}
  );


export const fetchDriverSeasonCount = () => dispatch =>
  backend.statisticsService.getDriverSeasonCount(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_SEASONS_COMPLETED, data }), () => {});

export const fetchDriverSeasonParticipationStreaks = () => dispatch =>
  backend.statisticsService.getDriverSeasonParticipationStreaks(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_SEASON_STREAK_COMPLETED, data }), () => {});

export const fetchDriverHatTrickCount = () => dispatch =>
  backend.statisticsService.getDriverHatTrickCount(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_HAT_TRICKS_COMPLETED, data }), () => {});

export const fetchDriverGrandSlamCount = () => dispatch =>
  backend.statisticsService.getDriverGrandSlamCount(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_GRAND_SLAMS_COMPLETED, data }), () => {});

export const fetchDriverFrontRowStarts = () => dispatch =>
  backend.statisticsService.getDriverFrontRowStarts(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_FRONT_ROW_STARTS_COMPLETED, data }), () => {});

export const fetchMostFrequentFrontRowDuos = () => dispatch =>
  backend.statisticsService.getMostFrequentFrontRowDuos(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_FRONT_ROW_DUOS_COMPLETED, data }), () => {});

export const fetchYoungestDriversAtFrontRow = () => dispatch =>
  backend.statisticsService.getYoungestDriversAtFrontRow(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_FRONT_ROW_YOUNGEST_COMPLETED, data }), () => {});

export const fetchLongestFrontRowStreaks = () => dispatch =>
  backend.statisticsService.getLongestFrontRowStreaks(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_FRONT_ROW_STREAKS_COMPLETED, data }), () => {});

export const fetchAverageGridPosition = () => dispatch =>
  backend.statisticsService.getAverageGridPosition(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_GRID_AVERAGE_COMPLETED, data }), () => {});

export const fetchFastestQualifyingLaps = () => dispatch =>
  backend.statisticsService.getFastestQualifyingLaps(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_QUALI_FASTEST_COMPLETED, data }), () => {});

export const fetchRaceFinishesCount = () => dispatch =>
  backend.statisticsService.getRaceFinishesCount(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_FINISHES_COMPLETED, data }), () => {});

export const fetchConsecutiveRaceFinishes = () => dispatch =>
  backend.statisticsService.getConsecutiveRaceFinishes(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_FINISH_STREAK_COMPLETED, data }), () => {});

export const fetchClassifiedFinishesCount = () => dispatch =>
  backend.statisticsService.getClassifiedFinishesCount(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_CLASSIFIED_COMPLETED, data }), () => {});

export const fetchLongestStreakWithoutDNF = () => dispatch =>
  backend.statisticsService.getLongestStreakWithoutDNF(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_NO_DNF_STREAK_COMPLETED, data }), () => {});

export const fetchDNFCount = () => dispatch =>
  backend.statisticsService.getDNFCount(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_DNFS_COMPLETED, data }), () => {});

export const fetchConsecutiveDNFs = () => dispatch =>
  backend.statisticsService.getConsecutiveDNFs(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_DNF_STREAK_COMPLETED, data }), () => {});

export const fetchFirstLapDNFs = () => dispatch =>
  backend.statisticsService.getFirstLapDNFs(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_FIRST_LAP_DNFS_COMPLETED, data }), () => {});

export const fetchDriversOnLeaderLapMostOften = () => dispatch =>
  backend.statisticsService.getDriversOnLeaderLapMostOften(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_ON_LEADER_LAP_COMPLETED, data }), () => {});

export const fetchAverageFinishPosition = () => dispatch =>
  backend.statisticsService.getAverageFinishPosition(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_FINISH_POSITION_AVG_COMPLETED, data }), () => {});

export const fetchBestAveragePositionGains = () => dispatch =>
  backend.statisticsService.getBestAveragePositionGains(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_POSITION_GAIN_AVG_COMPLETED, data }), () => {});

export const fetchStartingGridAtDebut = () => dispatch =>
  backend.statisticsService.getStartingGridAtDebut(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_DEBUT_GRID_COMPLETED, data }), () => {});

export const fetchQualifyingAtDebut = () => dispatch =>
  backend.statisticsService.getQualifyingAtDebut(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_DEBUT_QUALIFYING_COMPLETED, data }), () => {});

export const fetchQualifyingAtLastRace = () => dispatch =>
  backend.statisticsService.getQualifyingAtLastRace(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_LAST_QUALIFYING_COMPLETED, data }), () => {});

export const fetchDriversNeverQualified = () => dispatch =>
  backend.statisticsService.getDriversNeverQualified(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_NEVER_QUALIFIED_COMPLETED, data }), () => {});

export const fetchDisqualificationCount = () => dispatch =>
  backend.statisticsService.getDisqualificationCount(data =>
    dispatch({ type: actionTypes.FETCH_VARIOS_DISQUALIFICATIONS_COMPLETED, data }), () => {});