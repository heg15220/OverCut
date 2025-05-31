import { appFetch, fetchConfig } from "./appFetch";

export const getDriverStandings = (year, onSuccess, onError) =>
  appFetch(`/statistics/drivers/year/${year}`, fetchConfig("GET"), onSuccess, onError);

export const getConstructorStandings = (year, onSuccess, onError) =>
  appFetch(`/statistics/constructors/year/${year}`, fetchConfig("GET"), onSuccess, onError);

export const getDriverWinRanking = (onSuccess, onError) =>
  appFetch(`/statistics/drivers/wins`, fetchConfig("GET"), onSuccess, onError);

export const getDriverPodiumRanking = (onSuccess, onError) =>
  appFetch(`/statistics/drivers/podiums`, fetchConfig("GET"), onSuccess, onError);

export const getDriverPoleRanking = (onSuccess, onError) =>
  appFetch(`/statistics/drivers/poles`, fetchConfig("GET"), onSuccess, onError);

export const getDriverGrandChelemRanking = (onSuccess, onError) =>
  appFetch(`/statistics/drivers/grand-chelems`, fetchConfig("GET"), onSuccess, onError);

export const getDriverWinsByTeam = (constructorRef, onSuccess, onError) =>
  appFetch(`/statistics/drivers/wins/team/${constructorRef}`, fetchConfig("GET"), onSuccess, onError);

export const getDriverPodiumsByTeam = (constructorRef, onSuccess, onError) =>
  appFetch(`/statistics/drivers/podiums/team/${constructorRef}`, fetchConfig("GET"), onSuccess, onError);

export const getDriverPolesByTeam = (constructorRef, onSuccess, onError) =>
  appFetch(`/statistics/drivers/poles/team/${constructorRef}`, fetchConfig("GET"), onSuccess, onError);

export const getAllConstructorOptions = (onSuccess, onError) =>
  appFetch(`/statistics/constructor-options`, fetchConfig("GET"), onSuccess, onError);

export const getChampionsByTitleCount = (onSuccess, onError) =>
  appFetch(`/statistics/drivers/championships/by-count`, fetchConfig("GET"), onSuccess, onError);

export const getChampionsChronologically = (onSuccess, onError) =>
  appFetch(`/statistics/drivers/championships/chronological`, fetchConfig("GET"), onSuccess, onError);

export const getChampionsByAge = (onSuccess, onError) =>
  appFetch(`/statistics/drivers/championships/by-age`, fetchConfig("GET"), onSuccess, onError);

export const getConsecutiveChampions = (onSuccess, onError) =>
  appFetch(`/statistics/drivers/championships/consecutive`, fetchConfig("GET"), onSuccess, onError);

export const getLongestGapBetweenTitles = (onSuccess, onError) =>
  appFetch(`/statistics/drivers/championships/longest-gap`, fetchConfig("GET"), onSuccess, onError);

export const getGpCountBeforeFirstTitle = (onSuccess, onError) =>
  appFetch(`/statistics/drivers/championships/gps-before-title`, fetchConfig("GET"), onSuccess, onError);

  export const getChampionsByConstructorVariety = (onSuccess, onError) =>
    appFetch(`/statistics/drivers/championships/by-constructors`, fetchConfig("GET"), onSuccess, onError);

export const getDriverWinsChronologically = (onSuccess, onError) =>
  appFetch(`/statistics/victories/by-driver/chronology`, fetchConfig("GET"), onSuccess, onError);

export const getTeamWinsChronologically = (onSuccess, onError) =>
  appFetch(`/statistics/victories/by-team/chronology`, fetchConfig("GET"), onSuccess, onError);

export const getYoungestDriversAtFirstWin = (onSuccess, onError) =>
  appFetch(`/statistics/victories/youngest`, fetchConfig("GET"), onSuccess, onError);

export const getOldestDriversToWin = (onSuccess, onError) =>
  appFetch(`/statistics/victories/oldest`, fetchConfig("GET"), onSuccess, onError);

export const getWinsOnBirthday = (onSuccess, onError) =>
  appFetch(`/statistics/victories/on-birthday`, fetchConfig("GET"), onSuccess, onError);


export const getLongestConsecutiveWinStreaks = (onSuccess, onError) =>
  appFetch(`/statistics/victories/streaks/consecutive`, fetchConfig("GET"), onSuccess, onError);

export const getLongestSeasonStartWinStreaks = (onSuccess, onError) =>
  appFetch(`/statistics/victories/streaks/start-season`, fetchConfig("GET"), onSuccess, onError);

export const getLastCareerWinPerDriver = (onSuccess, onError) =>
  appFetch(`/statistics/victories/last`, fetchConfig("GET"), onSuccess, onError);

export const getBiggestGapBetweenWins = (onSuccess, onError) =>
  appFetch(`/statistics/victories/gap-between-wins`, fetchConfig("GET"), onSuccess, onError);

export const getGapBetweenFirstAndLastWin = (onSuccess, onError) =>
  appFetch(`/statistics/victories/gap-first-last`, fetchConfig("GET"), onSuccess, onError);

export const getMostWinsInSingleYear = (onSuccess, onError) =>
  appFetch(`/statistics/victories/most-in-single-year`, fetchConfig("GET"), onSuccess, onError);

export const getMostYearsWithWins = (onSuccess, onError) =>
  appFetch(`/statistics/victories/most-winning-years`, fetchConfig("GET"), onSuccess, onError);

export const getMostConsecutiveWinningYears = (onSuccess, onError) =>
  appFetch(`/statistics/victories/most-consecutive-winning-years`, fetchConfig("GET"), onSuccess, onError);

export const getGpCountBeforeFirstWin = (onSuccess, onError) =>
  appFetch(`/statistics/victories/gps-before-first-win`, fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostWinsSameConstructor = (onSuccess, onError) =>
  appFetch(`/statistics/wins/most-by-same-constructor`, fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostConstructorsWithWins = (onSuccess, onError) =>
  appFetch(`/statistics/wins/most-constructors-with-wins`, fetchConfig("GET"), onSuccess, onError);

export const getWinsByGrandPrix = (onSuccess, onError) =>
  appFetch(`/statistics/wins/by-grand-prix`, fetchConfig("GET"), onSuccess, onError);

export const getConsecutiveWinsByGrandPrix = (onSuccess, onError) =>
  appFetch(`/statistics/wins/consecutive-by-grand-prix`, fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostDifferentGPsWon = (onSuccess, onError) =>
  appFetch(`/statistics/wins/most-different-gps`, fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostCircuitWins = (onSuccess, onError) =>
  appFetch(`/statistics/wins/most-circuit-wins`, fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostDifferentCircuitWins = (onSuccess, onError) =>
  appFetch(`/statistics/wins/most-different-circuit-wins`, fetchConfig("GET"), onSuccess, onError);

export const getWinsByStartingGridPosition = (onSuccess, onError) =>
  appFetch(`/statistics/wins/by-grid-position`, fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostGridPositionsWithWins = (onSuccess, onError) =>
  appFetch(`/statistics/wins/by-grid-variation`, fetchConfig("GET"), onSuccess, onError);

export const getDriversWithHomeGPWins = (onSuccess, onError) =>
  appFetch(`/statistics/wins/home-gp`, fetchConfig("GET"), onSuccess, onError);

export const getWinsWithoutLeadingAnyLap = (onSuccess, onError) =>
  appFetch(`/statistics/wins/no-laps-led`, fetchConfig("GET"), onSuccess, onError);

export const getWinsWithoutPolePosition = (onSuccess, onError) =>
  appFetch(`/statistics/wins/without-pole`, fetchConfig("GET"), onSuccess, onError);

export const getWinsWithFastestLap = (onSuccess, onError) =>
  appFetch(`/statistics/wins/with-fastest-lap`, fetchConfig("GET"), onSuccess, onError);
