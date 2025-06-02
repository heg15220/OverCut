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

export const getSecondPlacePodiums = (onSuccess, onError) =>
  appFetch(`/statistics/second-place`, fetchConfig("GET"), onSuccess, onError);

export const getThirdPlacePodiums = (onSuccess, onError) =>
  appFetch(`/statistics/third-place`, fetchConfig("GET"), onSuccess, onError);

export const getSecondAndThirdPlacePodiums = (onSuccess, onError) =>
  appFetch(`/statistics/second-and-third-place`, fetchConfig("GET"), onSuccess, onError);

export const getPodiumChronology = (onSuccess, onError) =>
  appFetch(`/statistics/chronology`, fetchConfig("GET"), onSuccess, onError);

export const getTeamPodiumChronology = (onSuccess, onError) =>
  appFetch(`/statistics/team-chronology`, fetchConfig("GET"), onSuccess, onError);

export const getYoungestPodiumDrivers = (onSuccess, onError) =>
  appFetch(`/statistics/youngest`, fetchConfig("GET"), onSuccess, onError);

export const getPodiumsOnBirthday = (onSuccess, onError) =>
  appFetch(`/statistics/on-birthday`, fetchConfig("GET"), onSuccess, onError);

export const getOldestPodiumDriversByNationality = (onSuccess, onError) =>
  appFetch(`/statistics/oldest-by-nationality`, fetchConfig("GET"), onSuccess, onError);

export const getLongestPodiumStreaks = (onSuccess, onError) =>
  appFetch(`/statistics/streaks`, fetchConfig("GET"), onSuccess, onError);

export const getSeasonStartPodiumStreaks = (onSuccess, onError) =>
  appFetch(`/statistics/streaks/season-start`, fetchConfig("GET"), onSuccess, onError);

export const getLastPodiumPerDriver = (onSuccess, onError) =>
  appFetch(`/statistics/last`, fetchConfig("GET"), onSuccess, onError);

export const getBiggestGapBetweenPodiums = (onSuccess, onError) =>
  appFetch(`/statistics/gap-between`, fetchConfig("GET"), onSuccess, onError);

export const getGapBetweenFirstAndLastPodium = (onSuccess, onError) =>
  appFetch(`/statistics/gap-first-last`, fetchConfig("GET"), onSuccess, onError);

export const getMostPodiumsInSingleYear = (onSuccess, onError) =>
  appFetch(`/statistics/most-in-single-year`, fetchConfig("GET"), onSuccess, onError);

export const getPodiumYearsCount = (onSuccess, onError) =>
  appFetch(`/statistics/years-count`, fetchConfig("GET"), onSuccess, onError);

export const getConsecutivePodiumYears = (onSuccess, onError) =>
  appFetch(`/statistics/consecutive-years`, fetchConfig("GET"), onSuccess, onError);

export const getGpCountBeforeFirstPodium = (onSuccess, onError) =>
  appFetch(`/statistics/gps-before-first`, fetchConfig("GET"), onSuccess, onError);

export const getPodiumsBeforeFirstWin = (onSuccess, onError) =>
  appFetch(`/statistics/before-win`, fetchConfig("GET"), onSuccess, onError);

export const getPodiumsWithSingleConstructor = (onSuccess, onError) =>
  appFetch(`/statistics/single-constructor`, fetchConfig("GET"), onSuccess, onError);

export const getPodiumsWithNoWins = (onSuccess, onError) =>
  appFetch(`/statistics/no-wins`, fetchConfig("GET"), onSuccess, onError);

export const getPodiumsWithMostConstructors = (onSuccess, onError) =>
  appFetch(`/statistics/most-constructors`, fetchConfig("GET"), onSuccess, onError);

export const getPodiumsByGrandPrix = (onSuccess, onError) =>
  appFetch(`/statistics/by-grand-prix`, fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostDifferentGPsWithPodium = (onSuccess, onError) =>
  appFetch(`/statistics/different-grand-prix`, fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostDifferentCircuitsWithPodium = (onSuccess, onError) =>
  appFetch(`/statistics/different-circuits`, fetchConfig("GET"), onSuccess, onError);

export const getPodiumsAtHomeGP = (onSuccess, onError) =>
  appFetch(`/statistics/home-gp`, fetchConfig("GET"), onSuccess, onError);

export const getRepeatedIdenticalPodiums = (onSuccess, onError) =>
  appFetch(`/statistics/repeated-identical`, fetchConfig("GET"), onSuccess, onError);

export const getMostFrequentPodiumTrios = (onSuccess, onError) =>
  appFetch(`/statistics/most-frequent-trios`, fetchConfig("GET"), onSuccess, onError);

export const getMostFrequentPodiumPairs = (onSuccess, onError) =>
  appFetch(`/statistics/most-frequent-pairs`, fetchConfig("GET"), onSuccess, onError);

export const getMostCommonFirstSecondPairs = (onSuccess, onError) =>
  appFetch(`/statistics/most-common-first-second`, fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostPoints = (onSuccess, onError) =>
  appFetch(`/statistics/points/total`, fetchConfig("GET"), onSuccess, onError);

export const getDriversToScorePointsChronologically = (onSuccess, onError) =>
  appFetch(`/statistics/points/chronology`, fetchConfig("GET"), onSuccess, onError);

export const getLastPointsPerDriver = (onSuccess, onError) =>
  appFetch(`/statistics/points/last`, fetchConfig("GET"), onSuccess, onError);

export const getYoungestDriversToScorePoints = (onSuccess, onError) =>
  appFetch(`/statistics/points/youngest`, fetchConfig("GET"), onSuccess, onError);

export const getOldestDriversToScorePoints = (onSuccess, onError) =>
  appFetch(`/statistics/points/oldest`, fetchConfig("GET"), onSuccess, onError);

export const getYoungestDriversToScorePointsByNationality = (onSuccess, onError) =>
  appFetch(`/statistics/points/youngest-by-nationality`, fetchConfig("GET"), onSuccess, onError);

export const getOldestDriversToScorePointsByNationality = (onSuccess, onError) =>
  appFetch(`/statistics/points/oldest-by-nationality`, fetchConfig("GET"), onSuccess, onError);

export const getLongestConsecutivePointsStreaks = (onSuccess, onError) =>
  appFetch(`/statistics/points/streaks`, fetchConfig("GET"), onSuccess, onError);

export const getLongestConsecutivePointsStreaksWithoutSprints = (onSuccess, onError) =>
  appFetch(`/statistics/points/streaks/no-sprints`, fetchConfig("GET"), onSuccess, onError);

export const getLongestGapBetweenPoints = (onSuccess, onError) =>
  appFetch(`/statistics/points/gap-between`, fetchConfig("GET"), onSuccess, onError);

export const getGapBetweenFirstAndLastPoints = (onSuccess, onError) =>
  appFetch(`/statistics/points/gap-first-last`, fetchConfig("GET"), onSuccess, onError);

export const getMostPointsInSingleYear = (onSuccess, onError) =>
  appFetch(`/statistics/points/most-in-single-year`, fetchConfig("GET"), onSuccess, onError);


export const getMostYearsScoringPoints = (onSuccess, onError) =>
  appFetch(`/statistics/points/years-scoring`, fetchConfig("GET"), onSuccess, onError);

export const getMostConsecutiveSeasonsWithPoints = (onSuccess, onError) =>
  appFetch(`/statistics/points/consecutive-seasons`, fetchConfig("GET"), onSuccess, onError);


export const getDriversWithPointsButNoWins = (onSuccess, onError) =>
  appFetch(`/statistics/points/no-wins`, fetchConfig("GET"), onSuccess, onError);

export const getDriversWithPointsButNoPodiums = (onSuccess, onError) =>
  appFetch(`/statistics/points/no-podiums`, fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostConstructorsWithPoints = (onSuccess, onError) =>
  appFetch(`/statistics/points/most-constructors`, fetchConfig("GET"), onSuccess, onError);

export const getGpCountBeforeFirstPoints = (onSuccess, onError) =>
  appFetch(`/statistics/points/gps-before-first`, fetchConfig("GET"), onSuccess, onError);

export const getGpCountWhereDriverScoredPoints = (onSuccess, onError) =>
  appFetch(`/statistics/points/gps-scored`, fetchConfig("GET"), onSuccess, onError);




// Número y cronología
export const getDriversWithMostGrandsPrix = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/most", fetchConfig("GET"), onSuccess, onError);

export const getDriverGpDebutChronology = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/debut-chronology", fetchConfig("GET"), onSuccess, onError);

export const getGpDebutChronologyByConstructor = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/debut-chronology/by-constructor", fetchConfig("GET"), onSuccess, onError);


// Rachas y diferencias
export const getLongestGpStreaks = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/streaks", fetchConfig("GET"), onSuccess, onError);

export const getBiggestGapBetweenGrandsPrix = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/gap-days", fetchConfig("GET"), onSuccess, onError);

export const getGapBetweenFirstAndLastGp = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/gap-years", fetchConfig("GET"), onSuccess, onError);

// Acumulados físicos
export const getDriversByTotalLapsCompleted = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/laps", fetchConfig("GET"), onSuccess, onError);

// Relaciones con otros
export const getDriversWithGpsWithWorldChampions = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/with-world-champions", fetchConfig("GET"), onSuccess, onError);

export const getDriversWithGpsWithRaceWinner = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/with-race-winners", fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostGpsWithSameConstructor = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/most-with-same-constructor", fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostConstructorsInGps = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/most-constructors", fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostGpsWithSameEngine = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/most-with-same-engine", fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostEnginesInGps = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/most-engines", fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostGpsWithSameTeammate = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/most-with-same-teammate", fetchConfig("GET"), onSuccess, onError);

// Edad

export const getDriversGpAgeByNationality = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/age/by-nationality", fetchConfig("GET"), onSuccess, onError);

export const getOldestDriversAtGp = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/age/oldest", fetchConfig("GET"), onSuccess, onError);

export const getAverageDriverAgePerGp = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/age/average", fetchConfig("GET"), onSuccess, onError);

// Sin eventos clave
export const getDriversWithMostGpsWithoutWin = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/no-win", fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostGpsWithoutPole = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/no-pole", fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostGpsWithoutFastestLap = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/no-fastest-lap", fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostGpsWithoutPoints = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/no-points", fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostGpsWithoutPodium = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/no-podium", fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostGpsWithoutLeadingLap = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/no-lead-lap", fetchConfig("GET"), onSuccess, onError);

export const getDriversWithGpsWithoutWinPoleOrFastestLap = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/no-win-pole-fastest", fetchConfig("GET"), onSuccess, onError);

// Temporadas
export const getDriversWithMostSeasons = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/seasons/total", fetchConfig("GET"), onSuccess, onError);

export const getDriversWithMostConsecutiveSeasons = (onSuccess, onError) =>
  appFetch("/statistics/grands-prix/seasons/consecutive", fetchConfig("GET"), onSuccess, onError);
