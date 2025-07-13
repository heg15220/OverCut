import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as statisticsActions from "../actions";
import * as statisticsSelectors from "../selectors";
import translations from "../../../i18n/translations";
import "./StatisticsTable.css";

const RankingsView = () => {
  const dispatch = useDispatch();

  const [section, setSection] = useState("rankings");
  const [mode, setMode] = useState("wins");
  const [team, setTeam] = useState("");
  const [recordMode, setRecordMode] = useState("titles_by_count");
  const [recordCategory, setRecordCategory] = useState("champions");


  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = translations[lang];

  const constructors = useSelector(statisticsSelectors.getConstructors);

  const wins = useSelector(statisticsSelectors.getDriverWins);
  const podiums = useSelector(statisticsSelectors.getDriverPodiums);
  const poles = useSelector(statisticsSelectors.getDriverPoles);
  const grandChelems = useSelector(statisticsSelectors.getDriverGrandChelems);

  const winsByTeam = useSelector(statisticsSelectors.getDriverWinsByTeam);
  const podiumsByTeam = useSelector(statisticsSelectors.getDriverPodiumsByTeam);
  const polesByTeam = useSelector(statisticsSelectors.getDriverPolesByTeam);

  const championsByTitleCount = useSelector(statisticsSelectors.getChampionsByTitleCount);
  const championsChronologically = useSelector(statisticsSelectors.getChampionsChronologically);
  const championsByAge = useSelector(statisticsSelectors.getChampionsByAge);
  const consecutiveTitles = useSelector(statisticsSelectors.getConsecutiveTitles);
  const longestGapBetweenTitles = useSelector(statisticsSelectors.getLongestGapBetweenTitles);
  const gpCountBeforeTitle = useSelector(statisticsSelectors.getGpCountBeforeTitle);
  const championsByConstructorVariety = useSelector(statisticsSelectors.getChampionsByConstructorVariety);

  const driverWinsChronologically = useSelector(statisticsSelectors.getDriverWinsChronologically);
  const teamWinsChronologically = useSelector(statisticsSelectors.getTeamWinsChronologically);
  const youngestWinDrivers = useSelector(statisticsSelectors.getYoungestDriversAtFirstWin);
  const oldestWinDrivers = useSelector(statisticsSelectors.getOldestDriversToWin);
  const winsOnBirthday = useSelector(statisticsSelectors.getWinsOnBirthday);
  const longestConsecutiveWinStreaks = useSelector(statisticsSelectors.getLongestConsecutiveWinStreaks);
  const longestSeasonStartWinStreaks = useSelector(statisticsSelectors.getLongestSeasonStartWinStreaks);
  const lastCareerWinPerDriver = useSelector(statisticsSelectors.getLastCareerWinPerDriver);
  const biggestGapBetweenWins = useSelector(statisticsSelectors.getBiggestGapBetweenWins);
  const gapBetweenFirstAndLastWin = useSelector(statisticsSelectors.getGapBetweenFirstAndLastWin);
  const mostWinsInSingleYear = useSelector(statisticsSelectors.getMostWinsInSingleYear);
  const mostYearsWithWins = useSelector(statisticsSelectors.getMostYearsWithWins);
  const mostConsecutiveWinningYears = useSelector(statisticsSelectors.getMostConsecutiveWinningYears);
  const gpCountBeforeFirstWin = useSelector(statisticsSelectors.getGpCountBeforeFirstWin);

  const driversWithMostWinsSameConstructor = useSelector(statisticsSelectors.getDriversWithMostWinsSameConstructor);
  const driversWithMostConstructorsWithWins = useSelector(statisticsSelectors.getDriversWithMostConstructorsWithWins);
  const winsByGrandPrix = useSelector(statisticsSelectors.getWinsByGrandPrix);
  const consecutiveWinsByGrandPrix = useSelector(statisticsSelectors.getConsecutiveWinsByGrandPrix);
  const driversWithMostDifferentGPsWon = useSelector(statisticsSelectors.getDriversWithMostDifferentGPsWon);
  const driversWithMostCircuitWins = useSelector(statisticsSelectors.getDriversWithMostCircuitWins);
  const driversWithMostDifferentCircuitWins = useSelector(statisticsSelectors.getDriversWithMostDifferentCircuitWins);
  const winsByStartingGridPosition = useSelector(statisticsSelectors.getWinsByStartingGridPosition);
  const driversWithMostGridPositionsWithWins = useSelector(statisticsSelectors.getDriversWithMostGridPositionsWithWins);
  const driversWithHomeGPWins = useSelector(statisticsSelectors.getDriversWithHomeGPWins);
  const winsWithoutLeadingAnyLap = useSelector(statisticsSelectors.getWinsWithoutLeadingAnyLap);
  const winsWithoutPolePosition = useSelector(statisticsSelectors.getWinsWithoutPolePosition);
  const winsWithFastestLap = useSelector(statisticsSelectors.getWinsWithFastestLap);


const secondPlacePodiums = useSelector(statisticsSelectors.getSecondPlacePodiums);
const thirdPlacePodiums = useSelector(statisticsSelectors.getThirdPlacePodiums);
const secondThirdPlacePodiums = useSelector(statisticsSelectors.getSecondThirdPlacePodiums);
const podiumChronology = useSelector(statisticsSelectors.getPodiumChronology);
const teamPodiumChronology = useSelector(statisticsSelectors.getTeamPodiumChronology);
const youngestPodiumDrivers = useSelector(statisticsSelectors.getYoungestPodiumDrivers);
const podiumsOnBirthday = useSelector(statisticsSelectors.getPodiumsOnBirthday);
const oldestPodiumDriversByNationality = useSelector(statisticsSelectors.getOldestPodiumDriversByNationality);


const longestPodiumStreaks = useSelector(statisticsSelectors.getLongestPodiumStreaks);
const seasonStartPodiumStreaks = useSelector(statisticsSelectors.getSeasonStartPodiumStreaks);
const lastPodiumPerDriver = useSelector(statisticsSelectors.getLastPodiumPerDriver);
const biggestGapBetweenPodiums = useSelector(statisticsSelectors.getBiggestGapBetweenPodiums);
const gapBetweenFirstAndLastPodium = useSelector(statisticsSelectors.getGapBetweenFirstAndLastPodium);
const mostPodiumsInSingleYear = useSelector(statisticsSelectors.getMostPodiumsInSingleYear);
const podiumYearsCount = useSelector(statisticsSelectors.getPodiumYearsCount);
const consecutivePodiumYears = useSelector(statisticsSelectors.getConsecutivePodiumYears);
const gpCountBeforeFirstPodium = useSelector(statisticsSelectors.getGpCountBeforeFirstPodium);
const podiumsBeforeFirstWin = useSelector(statisticsSelectors.getPodiumsBeforeFirstWin);
const podiumsWithSingleConstructor = useSelector(statisticsSelectors.getPodiumsWithSingleConstructor);
const podiumsWithNoWins = useSelector(statisticsSelectors.getPodiumsWithNoWins);
const podiumsWithMostConstructors = useSelector(statisticsSelectors.getPodiumsWithMostConstructors);
const podiumsByGrandPrix = useSelector(statisticsSelectors.getPodiumsByGrandPrix);
const mostDifferentGPsWithPodium = useSelector(statisticsSelectors.getDriversWithMostDifferentGPsWithPodium);
const mostDifferentCircuitsWithPodium = useSelector(statisticsSelectors.getDriversWithMostDifferentCircuitsWithPodium);
const podiumsAtHomeGP = useSelector(statisticsSelectors.getPodiumsAtHomeGP);

const repeatedIdenticalPodiums = useSelector(statisticsSelectors.getRepeatedIdenticalPodiums);
const mostFrequentPodiumTrios = useSelector(statisticsSelectors.getMostFrequentPodiumTrios);
const mostFrequentPodiumPairs = useSelector(statisticsSelectors.getMostFrequentPodiumPairs);
const mostCommonFirstSecondPairs = useSelector(statisticsSelectors.getMostCommonFirstSecondPairs);



const driversWithMostPoints = useSelector(statisticsSelectors.getDriversWithMostPoints);
const driversToScorePointsChronologically = useSelector(statisticsSelectors.getDriversToScorePointsChronologically);
const lastPointsPerDriver = useSelector(statisticsSelectors.getLastPointsPerDriver);
const youngestDriversToScorePoints = useSelector(statisticsSelectors.getYoungestDriversToScorePoints);
const oldestDriversToScorePoints = useSelector(statisticsSelectors.getOldestDriversToScorePoints);
const youngestDriversToScorePointsByNationality = useSelector(statisticsSelectors.getYoungestDriversToScorePointsByNationality);
const oldestDriversToScorePointsByNationality = useSelector(statisticsSelectors.getOldestDriversToScorePointsByNationality);
const longestConsecutivePointsStreaks = useSelector(statisticsSelectors.getLongestConsecutivePointsStreaks);
const longestConsecutivePointsStreaksWithoutSprints = useSelector(statisticsSelectors.getLongestConsecutivePointsStreaksWithoutSprints);
const longestGapBetweenPoints = useSelector(statisticsSelectors.getLongestGapBetweenPoints);
const gapBetweenFirstAndLastPoints = useSelector(statisticsSelectors.getGapBetweenFirstAndLastPoints);
const mostPointsInSingleYear = useSelector(statisticsSelectors.getMostPointsInSingleYear);
const mostYearsScoringPoints = useSelector(statisticsSelectors.getMostYearsScoringPoints);
const mostConsecutiveSeasonsWithPoints = useSelector(statisticsSelectors.getMostConsecutiveSeasonsWithPoints);
const driversWithPointsButNoWins = useSelector(statisticsSelectors.getDriversWithPointsButNoWins);
const driversWithPointsButNoPodiums = useSelector(statisticsSelectors.getDriversWithPointsButNoPodiums);
const driversWithMostConstructorsWithPoints = useSelector(statisticsSelectors.getDriversWithMostConstructorsWithPoints);
const gpCountBeforeFirstPoints = useSelector(statisticsSelectors.getGpCountBeforeFirstPoints);
const gpCountWhereDriverScoredPoints = useSelector(statisticsSelectors.getGpCountWhereDriverScoredPoints);




const mostGrandsPrix = useSelector(statisticsSelectors.getMostGrandsPrix);
const gpDebutChronology = useSelector(statisticsSelectors.getGpDebutChronology);
const gpDebutByConstructor = useSelector(statisticsSelectors.getGpDebutByConstructor);
const longestGpStreaks = useSelector(statisticsSelectors.getLongestGpStreaks);
const biggestGpGap = useSelector(statisticsSelectors.getBiggestGpGap);
const firstLastGpGap = useSelector(statisticsSelectors.getFirstLastGpGap);
const totalLapsCompleted = useSelector(statisticsSelectors.getTotalLapsCompleted);
const gpsWithChampions = useSelector(statisticsSelectors.getGpsWithChampions);
const gpsWithWinners = useSelector(statisticsSelectors.getGpsWithWinners);
const mostGpsSameConstructor = useSelector(statisticsSelectors.getMostGpsSameConstructor);
const mostConstructorsInGps = useSelector(statisticsSelectors.getMostConstructorsInGps);
const mostGpsSameEngine = useSelector(statisticsSelectors.getMostGpsSameEngine);
const mostEnginesInGps = useSelector(statisticsSelectors.getMostEnginesInGps);
const mostGpsSameTeammate = useSelector(statisticsSelectors.getMostGpsSameTeammate);
const gpAgeByNationality = useSelector(statisticsSelectors.getGpAgeByNationality);
const oldestGpDrivers = useSelector(statisticsSelectors.getOldestGpDrivers);
const avgAgePerGp = useSelector(statisticsSelectors.getAvgAgePerGp);
const gpsNoWin = useSelector(statisticsSelectors.getGpsNoWin);
const gpsNoPole = useSelector(statisticsSelectors.getGpsNoPole);
const gpsNoFastestLap = useSelector(statisticsSelectors.getGpsNoFastestLap);
const gpsNoPoints = useSelector(statisticsSelectors.getGpsNoPoints);
const gpsNoPodium = useSelector(statisticsSelectors.getGpsNoPodium);
const gpsNoLeadLap = useSelector(statisticsSelectors.getGpsNoLeadLap);
const gpsNoWinPoleFastest = useSelector(statisticsSelectors.getGpsNoWinPoleFastest);
const mostSeasons = useSelector(statisticsSelectors.getMostSeasons);
const mostConsecutiveSeasons = useSelector(statisticsSelectors.getMostConsecutiveSeasons);



const variosSeasons = useSelector(statisticsSelectors.getVariosSeasons);
const variosSeasonStreak = useSelector(statisticsSelectors.getVariosSeasonStreak);
const variosHatTricks = useSelector(statisticsSelectors.getVariosHatTricks);
const variosGrandSlams = useSelector(statisticsSelectors.getVariosGrandSlams);
const variosFrontRowStarts = useSelector(statisticsSelectors.getVariosFrontRowStarts);
const variosFrontRowDuos = useSelector(statisticsSelectors.getVariosFrontRowDuos);
const variosFrontRowYoungest = useSelector(statisticsSelectors.getVariosFrontRowYoungest);
const variosFrontRowStreaks = useSelector(statisticsSelectors.getVariosFrontRowStreaks);
const variosGridAverage = useSelector(statisticsSelectors.getVariosGridAverage);
const variosQualifyingFastest = useSelector(statisticsSelectors.getVariosQualifyingFastest);
const variosFinishes = useSelector(statisticsSelectors.getVariosFinishes);
const variosFinishStreak = useSelector(statisticsSelectors.getVariosFinishStreak);
const variosClassified = useSelector(statisticsSelectors.getVariosClassified);
const variosNoDnfStreak = useSelector(statisticsSelectors.getVariosNoDnfStreak);
const variosDnfs = useSelector(statisticsSelectors.getVariosDnfs);
const variosDnfStreak = useSelector(statisticsSelectors.getVariosDnfStreak);
const variosFirstLapDnfs = useSelector(statisticsSelectors.getVariosFirstLapDnfs);
const variosOnLeaderLap = useSelector(statisticsSelectors.getVariosOnLeaderLap);
const variosFinishPositionAvg = useSelector(statisticsSelectors.getVariosFinishPositionAvg);
const variosPositionGainAvg = useSelector(statisticsSelectors.getVariosPositionGainAvg);
const variosDebutGrid = useSelector(statisticsSelectors.getVariosDebutGrid);
const variosDebutQualifying = useSelector(statisticsSelectors.getVariosDebutQualifying);
const variosLastQualifying = useSelector(statisticsSelectors.getVariosLastQualifying);
const variosNeverQualified = useSelector(statisticsSelectors.getVariosNeverQualified);
const variosDisqualifications = useSelector(statisticsSelectors.getVariosDisqualifications);




  const showTeamSelector = section === "team_rankings";

  useEffect(() => {
    if (section === "team_rankings") {
      dispatch(statisticsActions.fetchConstructors());
    }
  }, [dispatch, section]);

  useEffect(() => {
    if (section === "rankings") {
      switch (mode) {
        case "wins": dispatch(statisticsActions.fetchDriverWins()); break;
        case "podiums": dispatch(statisticsActions.fetchDriverPodiums()); break;
        case "poles": dispatch(statisticsActions.fetchDriverPoles()); break;
        case "grand_chelems": dispatch(statisticsActions.fetchDriverGrandChelems()); break;
        default: break;
      }
    }
  }, [dispatch, section, mode]);

  useEffect(() => {
    if (section !== "team_rankings" || !team) return;

    switch (mode) {
      case "wins_team": dispatch(statisticsActions.fetchDriverWinsByTeam(team)); break;
      case "podiums_team": dispatch(statisticsActions.fetchDriverPodiumsByTeam(team)); break;
      case "poles_team": dispatch(statisticsActions.fetchDriverPolesByTeam(team)); break;
      default: break;
    }
  }, [dispatch, team, section, mode]);

  useEffect(() => {
    if (section === "records") {
      switch (recordMode) {
        case "titles_by_count": dispatch(statisticsActions.fetchChampionsByTitleCount()); break;
        case "titles_chronological": dispatch(statisticsActions.fetchChampionsChronologically()); break;
        case "titles_by_age": dispatch(statisticsActions.fetchChampionsByAge()); break;
        case "titles_consecutive": dispatch(statisticsActions.fetchConsecutiveChampions()); break;
        case "titles_gap": dispatch(statisticsActions.fetchLongestGapBetweenTitles()); break;
        case "titles_gp_before": dispatch(statisticsActions.fetchGpCountBeforeFirstTitle()); break;
        case "titles_by_constructors": dispatch(statisticsActions.fetchChampionsByConstructorVariety()); break;
        case "wins_chronological": dispatch(statisticsActions.fetchDriverWinsChronologically()); break;
        case "wins_team_chronological": dispatch(statisticsActions.fetchTeamWinsChronologically()); break;
        case "wins_youngest": dispatch(statisticsActions.fetchYoungestDriversAtFirstWin()); break;
        case "wins_oldest": dispatch(statisticsActions.fetchOldestDriversToWin()); break;
        case "wins_on_birthday": dispatch(statisticsActions.fetchWinsOnBirthday()); break;
        case "wins_consecutive": dispatch(statisticsActions.fetchLongestConsecutiveWinStreaks()); break;
        case "wins_season_start": dispatch(statisticsActions.fetchLongestSeasonStartWinStreaks()); break;
        case "wins_last": dispatch(statisticsActions.fetchLastCareerWinPerDriver()); break;
        case "wins_biggest_gap": dispatch(statisticsActions.fetchBiggestGapBetweenWins()); break;
        case "wins_first_last_gap": dispatch(statisticsActions.fetchGapBetweenFirstAndLastWin()); break;
        case "wins_in_single_year": dispatch(statisticsActions.fetchMostWinsInSingleYear()); break;
        case "wins_years_with": dispatch(statisticsActions.fetchMostYearsWithWins()); break;
        case "wins_years_consecutive": dispatch(statisticsActions.fetchMostConsecutiveWinningYears()); break;
        case "wins_gp_before": dispatch(statisticsActions.fetchGpCountBeforeFirstWin()); break;
        case "wins_most_same_constructor": dispatch(statisticsActions.fetchDriversWithMostWinsSameConstructor()); break;
        case "wins_most_constructors": dispatch(statisticsActions.fetchDriversWithMostConstructorsWithWins()); break;
        case "wins_by_gp": dispatch(statisticsActions.fetchWinsByGrandPrix()); break;
        case "wins_consecutive_by_gp": dispatch(statisticsActions.fetchConsecutiveWinsByGrandPrix()); break;
        case "wins_most_different_gps": dispatch(statisticsActions.fetchDriversWithMostDifferentGPsWon()); break;
        case "wins_most_circuit": dispatch(statisticsActions.fetchDriversWithMostCircuitWins()); break;
        case "wins_most_different_circuits": dispatch(statisticsActions.fetchDriversWithMostDifferentCircuitWins()); break;
        case "wins_by_grid_position": dispatch(statisticsActions.fetchWinsByStartingGridPosition()); break;
        case "wins_most_grid_positions": dispatch(statisticsActions.fetchDriversWithMostGridPositionsWithWins()); break;
        case "wins_home_gp": dispatch(statisticsActions.fetchDriversWithHomeGPWins()); break;
        case "wins_no_laps_led": dispatch(statisticsActions.fetchWinsWithoutLeadingAnyLap()); break;
        case "wins_without_pole": dispatch(statisticsActions.fetchWinsWithoutPolePosition()); break;
        case "wins_with_fastest_lap": dispatch(statisticsActions.fetchWinsWithFastestLap()); break;
        case "podiums_second_place": dispatch(statisticsActions.fetchSecondPlacePodiums()); break;
        case "podiums_third_place": dispatch(statisticsActions.fetchThirdPlacePodiums()); break;
        case "podiums_second_and_third": dispatch(statisticsActions.fetchSecondAndThirdPlacePodiums()); break;
        case "podiums_chronology": dispatch(statisticsActions.fetchPodiumChronology()); break;
        case "podiums_team_chronology": dispatch(statisticsActions.fetchTeamPodiumChronology()); break;
        case "podiums_youngest": dispatch(statisticsActions.fetchYoungestPodiumDrivers()); break;
        case "podiums_on_birthday": dispatch(statisticsActions.fetchPodiumsOnBirthday()); break;
        case "podiums_oldest_by_nationality": dispatch(statisticsActions.fetchOldestPodiumDriversByNationality()); break;
        case "podiums_streaks": dispatch(statisticsActions.fetchLongestPodiumStreaks()); break;
        case "podiums_streaks_season": dispatch(statisticsActions.fetchSeasonStartPodiumStreaks()); break;
        case "podiums_last": dispatch(statisticsActions.fetchLastPodiumPerDriver()); break;
        case "podiums_gap": dispatch(statisticsActions.fetchBiggestGapBetweenPodiums()); break;
        case "podiums_gap_first_last": dispatch(statisticsActions.fetchGapBetweenFirstAndLastPodium()); break;
        case "podiums_single_year": dispatch(statisticsActions.fetchMostPodiumsInSingleYear()); break;
        case "podiums_years_count": dispatch(statisticsActions.fetchPodiumYearsCount()); break;
        case "podiums_consecutive_years": dispatch(statisticsActions.fetchConsecutivePodiumYears()); break;
        case "podiums_gp_before": dispatch(statisticsActions.fetchGpCountBeforeFirstPodium()); break;
        case "podiums_before_win": dispatch(statisticsActions.fetchPodiumsBeforeFirstWin()); break;
        case "podiums_single_constructor": dispatch(statisticsActions.fetchPodiumsWithSingleConstructor()); break;
        case "podiums_no_wins": dispatch(statisticsActions.fetchPodiumsWithNoWins()); break;
        case "podiums_most_constructors": dispatch(statisticsActions.fetchPodiumsWithMostConstructors()); break;
        case "podiums_by_gp": dispatch(statisticsActions.fetchPodiumsByGrandPrix()); break;
        case "podiums_most_different_gps": dispatch(statisticsActions.fetchDriversWithMostDifferentGPsWithPodium()); break;
        case "podiums_most_different_circuits": dispatch(statisticsActions.fetchDriversWithMostDifferentCircuitsWithPodium()); break;
        case "podiums_home_gp": dispatch(statisticsActions.fetchPodiumsAtHomeGP()); break;
        case "podiums_identical_repeats":
          dispatch(statisticsActions.fetchRepeatedIdenticalPodiums()); break;
        case "podiums_trios":
          dispatch(statisticsActions.fetchMostFrequentPodiumTrios()); break;
        case "podiums_pairs":
          dispatch(statisticsActions.fetchMostFrequentPodiumPairs()); break;
        case "podiums_first_second":
          dispatch(statisticsActions.fetchMostCommonFirstSecondPairs()); break;

        case "points_total": dispatch(statisticsActions.fetchDriversWithMostPoints()); break;
        case "points_chronology": dispatch(statisticsActions.fetchDriversToScorePointsChronologically()); break;
        case "points_last": dispatch(statisticsActions.fetchLastPointsPerDriver()); break;
        case "points_youngest": dispatch(statisticsActions.fetchYoungestDriversToScorePoints()); break;
        case "points_oldest": dispatch(statisticsActions.fetchOldestDriversToScorePoints()); break;
        case "points_youngest_nationality": dispatch(statisticsActions.fetchYoungestDriversToScorePointsByNationality()); break;
        case "points_oldest_nationality": dispatch(statisticsActions.fetchOldestDriversToScorePointsByNationality()); break;
        case "points_streaks": dispatch(statisticsActions.fetchLongestConsecutivePointsStreaks()); break;
        case "points_streaks_no_sprints": dispatch(statisticsActions.fetchLongestConsecutivePointsStreaksWithoutSprints()); break;
        case "points_gap": dispatch(statisticsActions.fetchLongestGapBetweenPoints()); break;
        case "points_gap_first_last": dispatch(statisticsActions.fetchGapBetweenFirstAndLastPoints()); break;
        case "points_most_single_year": dispatch(statisticsActions.fetchMostPointsInSingleYear()); break;
        case "points_years": dispatch(statisticsActions.fetchMostYearsScoringPoints()); break;
        case "points_years_consecutive": dispatch(statisticsActions.fetchMostConsecutiveSeasonsWithPoints()); break;
        case "points_no_wins": dispatch(statisticsActions.fetchDriversWithPointsButNoWins()); break;
        case "points_no_podiums": dispatch(statisticsActions.fetchDriversWithPointsButNoPodiums()); break;
        case "points_most_constructors": dispatch(statisticsActions.fetchDriversWithMostConstructorsWithPoints()); break;
        case "points_gp_before": dispatch(statisticsActions.fetchGpCountBeforeFirstPoints()); break;
        case "points_gp_scored": dispatch(statisticsActions.fetchGpCountWhereDriverScoredPoints()); break;


        case "most_grands_prix":
          dispatch(statisticsActions.getDriversWithMostGrandsPrix());
          break;

        case "gp_debut_chronology":
          dispatch(statisticsActions.fetchDriverGpDebutChronology());
          break;

        case "gp_debut_by_constructor":
          dispatch(statisticsActions.fetchGpDebutChronologyByConstructor());
          break;

        case "gp_streaks":
          dispatch(statisticsActions.fetchLongestGpStreaks());
          break;

        case "gp_gap_days":
          dispatch(statisticsActions.fetchBiggestGapBetweenGrandsPrix());
          break;

        case "gp_gap_years":
          dispatch(statisticsActions.fetchGapBetweenFirstAndLastGp());
          break;

        case "gp_laps":
          dispatch(statisticsActions.fetchDriversByTotalLapsCompleted());
          break;

        case "gp_with_champions":
          dispatch(statisticsActions.fetchDriversWithGpsWithWorldChampions());
          break;

        case "gp_with_winners":
          dispatch(statisticsActions.fetchDriversWithGpsWithRaceWinner());
          break;

        case "gp_same_constructor":
          dispatch(statisticsActions.fetchDriversWithMostGpsWithSameConstructor());
          break;

        case "gp_most_constructors":
          dispatch(statisticsActions.fetchDriversWithMostConstructorsInGps());
          break;

        case "gp_same_engine":
          dispatch(statisticsActions.fetchDriversWithMostGpsWithSameEngine());
          break;

        case "gp_most_engines":
          dispatch(statisticsActions.fetchDriversWithMostEnginesInGps());
          break;

        case "gp_same_teammate":
          dispatch(statisticsActions.fetchDriversWithMostGpsWithSameTeammate());
          break;

        case "gp_age_nationality":
          dispatch(statisticsActions.fetchDriversGpAgeByNationality());
          break;

        case "gp_oldest":
          dispatch(statisticsActions.fetchOldestDriversAtGp());
          break;

        case "gp_avg_age":
          dispatch(statisticsActions.fetchAverageDriverAgePerGp());
          break;

        case "gp_no_win":
          dispatch(statisticsActions.fetchDriversWithMostGpsWithoutWin());
          break;

        case "gp_no_pole":
          dispatch(statisticsActions.fetchDriversWithMostGpsWithoutPole());
          break;

        case "gp_no_fastest_lap":
          dispatch(statisticsActions.fetchDriversWithMostGpsWithoutFastestLap());
          break;

        case "gp_no_points":
          dispatch(statisticsActions.fetchDriversWithMostGpsWithoutPoints());
          break;

        case "gp_no_podium":
          dispatch(statisticsActions.fetchDriversWithMostGpsWithoutPodium());
          break;

        case "gp_no_lead_lap":
          dispatch(statisticsActions.fetchDriversWithMostGpsWithoutLeadingLap());
          break;

        case "gp_no_win_pole_fastest":
          dispatch(statisticsActions.fetchDriversWithGpsWithoutWinPoleOrFastestLap());
          break;

        case "gp_seasons_total":
          dispatch(statisticsActions.fetchMostSeasons());
          break;

        case "gp_seasons_consecutive":
          dispatch(statisticsActions.fetchMostConsecutiveSeasons());
          break;

        case "varios_seasons": dispatch(statisticsActions.fetchDriverSeasonCount()); break;
        case "varios_season_streak": dispatch(statisticsActions.fetchDriverSeasonParticipationStreaks()); break;
        case "varios_hat_tricks": dispatch(statisticsActions.fetchDriverHatTrickCount()); break;
        case "varios_grand_slams": dispatch(statisticsActions.fetchDriverGrandSlamCount()); break;
        case "varios_front_row_starts": dispatch(statisticsActions.fetchDriverFrontRowStarts()); break;
        case "varios_front_row_duos": dispatch(statisticsActions.fetchMostFrequentFrontRowDuos()); break;
        case "varios_front_row_youngest": dispatch(statisticsActions.fetchYoungestDriversAtFrontRow()); break;
        case "varios_front_row_streaks": dispatch(statisticsActions.fetchLongestFrontRowStreaks()); break;
        case "varios_grid_average": dispatch(statisticsActions.fetchAverageGridPosition()); break;
        case "varios_qualifying_fastest": dispatch(statisticsActions.fetchFastestQualifyingLaps()); break;
        case "varios_finishes": dispatch(statisticsActions.fetchRaceFinishesCount()); break;
        case "varios_finish_streak": dispatch(statisticsActions.fetchConsecutiveRaceFinishes()); break;
        case "varios_classified": dispatch(statisticsActions.fetchClassifiedFinishesCount()); break;
        case "varios_no_dnf_streak": dispatch(statisticsActions.fetchLongestStreakWithoutDNF()); break;
        case "varios_dnfs": dispatch(statisticsActions.fetchDNFCount()); break;
        case "varios_dnf_streak": dispatch(statisticsActions.fetchConsecutiveDNFs()); break;
        case "varios_on_leader_lap": dispatch(statisticsActions.fetchDriversOnLeaderLapMostOften()); break;
        case "varios_finish_position_avg": dispatch(statisticsActions.fetchAverageFinishPosition()); break;
        case "varios_position_gain_avg": dispatch(statisticsActions.fetchBestAveragePositionGains()); break;
        case "varios_debut_grid": dispatch(statisticsActions.fetchStartingGridAtDebut()); break;
        case "varios_debut_qualifying": dispatch(statisticsActions.fetchQualifyingAtDebut()); break;
        case "varios_last_qualifying": dispatch(statisticsActions.fetchQualifyingAtLastRace()); break;
        case "varios_never_qualified": dispatch(statisticsActions.fetchDriversNeverQualified()); break;
        case "varios_disqualifications": dispatch(statisticsActions.fetchDisqualificationCount()); break;



        default: break;
      }
    }
  }, [dispatch, section, recordMode]);

  const data = section === "records"
    ? recordMode === "titles_by_count" ? championsByTitleCount
    : recordMode === "titles_chronological" ? championsChronologically
    : recordMode === "titles_by_age" ? championsByAge
    : recordMode === "titles_consecutive" ? consecutiveTitles
    : recordMode === "titles_gap" ? longestGapBetweenTitles
    : recordMode === "titles_gp_before" ? gpCountBeforeTitle
    : recordMode === "titles_by_constructors" ? championsByConstructorVariety
    : recordMode === "wins_chronological" ? driverWinsChronologically
    : recordMode === "wins_team_chronological" ? teamWinsChronologically
    : recordMode === "wins_youngest" ? youngestWinDrivers
    : recordMode === "wins_oldest" ? oldestWinDrivers
    : recordMode === "wins_on_birthday" ? winsOnBirthday
    : recordMode === "wins_consecutive" ? longestConsecutiveWinStreaks
    : recordMode === "wins_season_start" ? longestSeasonStartWinStreaks
    : recordMode === "wins_last" ? lastCareerWinPerDriver
    : recordMode === "wins_biggest_gap" ? biggestGapBetweenWins
    : recordMode === "wins_first_last_gap" ? gapBetweenFirstAndLastWin
    : recordMode === "wins_in_single_year" ? mostWinsInSingleYear
    : recordMode === "wins_years_with" ? mostYearsWithWins
    : recordMode === "wins_years_consecutive" ? mostConsecutiveWinningYears
    : recordMode === "wins_gp_before" ? gpCountBeforeFirstWin
    : recordMode === "wins_most_same_constructor" ? driversWithMostWinsSameConstructor
    : recordMode === "wins_most_constructors" ? driversWithMostConstructorsWithWins
    : recordMode === "wins_by_gp" ? winsByGrandPrix
    : recordMode === "wins_consecutive_by_gp" ? consecutiveWinsByGrandPrix
    : recordMode === "wins_most_different_gps" ? driversWithMostDifferentGPsWon
    : recordMode === "wins_most_circuit" ? driversWithMostCircuitWins
    : recordMode === "wins_most_different_circuits" ? driversWithMostDifferentCircuitWins
    : recordMode === "wins_by_grid_position" ? winsByStartingGridPosition
    : recordMode === "wins_most_grid_positions" ? driversWithMostGridPositionsWithWins
    : recordMode === "wins_home_gp" ? driversWithHomeGPWins
    : recordMode === "wins_no_laps_led" ? winsWithoutLeadingAnyLap
    : recordMode === "wins_without_pole" ? winsWithoutPolePosition
    : recordMode === "wins_with_fastest_lap" ? winsWithFastestLap
    : recordMode === "podiums_second_place" ? secondPlacePodiums
    : recordMode === "podiums_third_place" ? thirdPlacePodiums
    : recordMode === "podiums_second_and_third" ? secondThirdPlacePodiums
    : recordMode === "podiums_chronology" ? podiumChronology
    : recordMode === "podiums_team_chronology" ? teamPodiumChronology
    : recordMode === "podiums_youngest" ? youngestPodiumDrivers
    : recordMode === "podiums_on_birthday" ? podiumsOnBirthday
    : recordMode === "podiums_oldest_by_nationality" ? oldestPodiumDriversByNationality
    : recordMode === "podiums_streaks" ? longestPodiumStreaks
    : recordMode === "podiums_streaks_season" ? seasonStartPodiumStreaks
    : recordMode === "podiums_last" ? lastPodiumPerDriver
    : recordMode === "podiums_gap" ? biggestGapBetweenPodiums
    : recordMode === "podiums_gap_first_last" ? gapBetweenFirstAndLastPodium
    : recordMode === "podiums_single_year" ? mostPodiumsInSingleYear
    : recordMode === "podiums_years_count" ? podiumYearsCount
    : recordMode === "podiums_consecutive_years" ? consecutivePodiumYears
    : recordMode === "podiums_gp_before" ? gpCountBeforeFirstPodium
    : recordMode === "podiums_before_win" ? podiumsBeforeFirstWin
    : recordMode === "podiums_single_constructor" ? podiumsWithSingleConstructor
    : recordMode === "podiums_no_wins" ? podiumsWithNoWins
    : recordMode === "podiums_most_constructors" ? podiumsWithMostConstructors
    : recordMode === "podiums_by_gp" ? podiumsByGrandPrix
    : recordMode === "podiums_most_different_gps" ? mostDifferentGPsWithPodium
    : recordMode === "podiums_most_different_circuits" ? mostDifferentCircuitsWithPodium
    : recordMode === "podiums_home_gp" ? podiumsAtHomeGP
    : recordMode === "podiums_identical_repeats" ? repeatedIdenticalPodiums
    : recordMode === "podiums_trios" ? mostFrequentPodiumTrios
    : recordMode === "podiums_pairs" ? mostFrequentPodiumPairs
    : recordMode === "podiums_first_second" ? mostCommonFirstSecondPairs
    : recordMode === "points_total" ? driversWithMostPoints
    : recordMode === "points_chronology" ? driversToScorePointsChronologically
    : recordMode === "points_last" ? lastPointsPerDriver
    : recordMode === "points_youngest" ? youngestDriversToScorePoints
    : recordMode === "points_oldest" ? oldestDriversToScorePoints
    : recordMode === "points_youngest_nationality" ? youngestDriversToScorePointsByNationality
    : recordMode === "points_oldest_nationality" ? oldestDriversToScorePointsByNationality
    : recordMode === "points_streaks" ? longestConsecutivePointsStreaks
    : recordMode === "points_streaks_no_sprints" ? longestConsecutivePointsStreaksWithoutSprints
    : recordMode === "points_gap" ? longestGapBetweenPoints
    : recordMode === "points_gap_first_last" ? gapBetweenFirstAndLastPoints
    : recordMode === "points_most_single_year" ? mostPointsInSingleYear
    : recordMode === "points_years" ? mostYearsScoringPoints
    : recordMode === "points_years_consecutive" ? mostConsecutiveSeasonsWithPoints
    : recordMode === "points_no_wins" ? driversWithPointsButNoWins
    : recordMode === "points_no_podiums" ? driversWithPointsButNoPodiums
    : recordMode === "points_most_constructors" ? driversWithMostConstructorsWithPoints
    : recordMode === "points_gp_before" ? gpCountBeforeFirstPoints
    : recordMode === "points_gp_scored" ? gpCountWhereDriverScoredPoints
    : recordMode === "most_grands_prix" ? mostGrandsPrix
    : recordMode === "gp_debut_chronology" ? gpDebutChronology
    : recordMode === "gp_debut_by_constructor" ? gpDebutByConstructor
    : recordMode === "gp_streaks" ? longestGpStreaks
    : recordMode === "gp_gap_days" ? biggestGpGap
    : recordMode === "gp_gap_years" ? firstLastGpGap
    : recordMode === "gp_laps" ? totalLapsCompleted
    : recordMode === "gp_kilometers" ? totalKmCompleted
    : recordMode === "gp_with_champions" ? gpsWithChampions
    : recordMode === "gp_with_winners" ? gpsWithWinners
    : recordMode === "gp_same_constructor" ? mostGpsSameConstructor
    : recordMode === "gp_most_constructors" ? mostConstructorsInGps
    : recordMode === "gp_same_engine" ? mostGpsSameEngine
    : recordMode === "gp_most_engines" ? mostEnginesInGps
    : recordMode === "gp_same_teammate" ? mostGpsSameTeammate
    : recordMode === "gp_age_chronology" ? gpAgeChronology
    : recordMode === "gp_age_nationality" ? gpAgeByNationality
    : recordMode === "gp_oldest" ? oldestGpDrivers
    : recordMode === "gp_avg_age" ? avgAgePerGp
    : recordMode === "gp_no_win" ? gpsNoWin
    : recordMode === "gp_no_pole" ? gpsNoPole
    : recordMode === "gp_no_fastest_lap" ? gpsNoFastestLap
    : recordMode === "gp_no_points" ? gpsNoPoints
    : recordMode === "gp_no_podium" ? gpsNoPodium
    : recordMode === "gp_no_lead_lap" ? gpsNoLeadLap
    : recordMode === "gp_no_win_pole_fastest" ? gpsNoWinPoleFastest
    : recordMode === "gp_seasons_total" ? mostSeasons
    : recordMode === "gp_seasons_consecutive" ? mostConsecutiveSeasons
    : recordMode === "varios_seasons" ? variosSeasons
    : recordMode === "varios_season_streak" ? variosSeasonStreak
    : recordMode === "varios_hat_tricks" ? variosHatTricks
    : recordMode === "varios_grand_slams" ? variosGrandSlams
    : recordMode === "varios_front_row_starts" ? variosFrontRowStarts
    : recordMode === "varios_front_row_duos" ? variosFrontRowDuos
    : recordMode === "varios_front_row_youngest" ? variosFrontRowYoungest
    : recordMode === "varios_front_row_streaks" ? variosFrontRowStreaks
    : recordMode === "varios_grid_average" ? variosGridAverage
    : recordMode === "varios_qualifying_fastest" ? variosQualifyingFastest
    : recordMode === "varios_finishes" ? variosFinishes
    : recordMode === "varios_finish_streak" ? variosFinishStreak
    : recordMode === "varios_classified" ? variosClassified
    : recordMode === "varios_no_dnf_streak" ? variosNoDnfStreak
    : recordMode === "varios_dnfs" ? variosDnfs
    : recordMode === "varios_dnf_streak" ? variosDnfStreak
    : recordMode === "varios_on_leader_lap" ? variosOnLeaderLap
    : recordMode === "varios_finish_position_avg" ? variosFinishPositionAvg
    : recordMode === "varios_position_gain_avg" ? variosPositionGainAvg
    : recordMode === "varios_debut_qualifying" ? variosDebutQualifying
    : recordMode === "varios_last_qualifying" ? variosLastQualifying
    : recordMode === "varios_never_qualified" ? variosNeverQualified
    : recordMode === "varios_disqualifications" ? variosDisqualifications




    : []
    : section === "rankings"
    ? mode === "wins" ? wins
    : mode === "podiums" ? podiums
    : mode === "poles" ? poles
    : grandChelems
    : mode === "wins_team" ? winsByTeam
    : mode === "podiums_team" ? podiumsByTeam
    : polesByTeam;

     const getLabel = () => {
       if (section === "records") {
         switch (recordMode) {
           // Campeones
           case "titles_by_count": return t.labelTitles;
           case "titles_chronological": return t.labelYear;
           case "titles_by_age": return t.labelAge;
           case "titles_consecutive": return t.labelConsecutiveTitles;
           case "titles_gap": return t.labelTitleGap;
           case "titles_gp_before": return t.labelGpBeforeTitle;
           case "titles_by_constructors": return t.labelConstructorsVariety;

           // Victorias
           case "wins_chronological":
           case "wins_team_chronological": return t.labelYear;
           case "wins_youngest":
           case "wins_oldest": return t.labelAge;
           case "wins_on_birthday": return t.labelYear;
           case "wins_consecutive": return t.labelConsecutiveWins;
           case "wins_season_start": return t.labelSeasonStartStreak;
           case "wins_last": return t.labelLastWin;
           case "wins_biggest_gap": return t.labelWinGapDays;
           case "wins_first_last_gap": return t.labelWinGapYears;
           case "wins_in_single_year": return t.labelWinsInYear;
           case "wins_years_with": return t.labelWinSeasons;
           case "wins_years_consecutive": return t.labelConsecutiveWinSeasons;
           case "wins_gp_before": return t.labelGpBeforeWin;
           case "wins_most_same_constructor": return t.labelSameConstructorWins;
           case "wins_most_constructors": return t.labelConstructorsWithWins;
           case "wins_by_gp": return t.labelWinsByGp;
           case "wins_consecutive_by_gp": return t.labelConsecutiveGpWins;
           case "wins_most_different_gps": return t.labelGpVarietyWins;
           case "wins_most_circuit": return t.labelCircuitWins;
           case "wins_most_different_circuits": return t.labelCircuitVarietyWins;
           case "wins_by_grid_position": return t.labelGridPositionWins;
           case "wins_most_grid_positions": return t.labelGridVarietyWins;
           case "wins_home_gp": return t.labelHomeGpWins;
           case "wins_no_laps_led": return t.labelNoLeadWins;
           case "wins_without_pole": return t.labelNoPoleWins;
           case "wins_with_fastest_lap": return t.labelWithFastestLapWins;

           // Pódiums
           case "podiums_second_place": return t.labelSecondPlacePodiums;
           case "podiums_third_place": return t.labelThirdPlacePodiums;
           case "podiums_second_and_third": return t.labelSecondThirdPlacePodiums;
           case "podiums_chronology":
           case "podiums_team_chronology": return t.labelYear;
           case "podiums_youngest":
           case "podiums_oldest_by_nationality": return t.labelAge;
           case "podiums_on_birthday": return t.labelYear;
           case "podiums_streaks": return t.labelPodiumSeasons;
           case "podiums_streaks_season": return t.labelPodiumSeasonsStreaks;
           case "podiums_last": return t.labelLastPodium;
           case "podiums_gap": return t.labelPodiumGapDays;
           case "podiums_gap_first_last": return t.labelPodiumGapYears;
           case "podiums_single_year": return t.labelPodiumsInYear;
           case "podiums_years_count": return t.labelPodiumSeasons;
           case "podiums_consecutive_years": return t.labelConsecutivePodiumSeasons;
           case "podiums_gp_before": return t.labelGpBeforePodium;
           case "podiums_before_win": return t.labelPodiumsBeforeWin;
           case "podiums_single_constructor": return t.labelSingleConstructorPodiums;
           case "podiums_no_wins": return t.labelNoWinPodiums;
           case "podiums_most_constructors": return t.labelConstructorsWithWins;
           case "podiums_by_gp": return t.labelPodiumsByGp;
           case "podiums_most_different_gps": return t.labelGpVarietyPodiums;
           case "podiums_most_different_circuits": return t.labelCircuitVarietyPodiums;
           case "podiums_home_gp": return t.labelHomeGpPodiums;
           case "podiums_identical_repeats": return t.labelRepeatedPodiums;
           case "podiums_trios": return t.labelFrequentTrios;
           case "podiums_pairs": return t.labelFrequentPairs;
           case "podiums_first_second": return t.labelFirstSecondPairs;

           // Puntos
           case "points_total": return t.labelPoints;
           case "points_chronology": return t.labelYearPointsChronology;
           case "points_last": return t.labelLastPoints;
           case "points_youngest": return t.labelPointsAgeYoungest;
           case "points_oldest": return t.labelPointsAgeOldest;
           case "points_youngest_nationality":
           case "points_oldest_nationality": return t.labelAge;
           case "points_streaks": return t.labelPointsStreak;
           case "points_streaks_no_sprints": return t.labelNoSprintStreak;
           case "points_gap": return t.labelPointsGapDays;
           case "points_gap_first_last": return t.labelPointsGapYears;
           case "points_most_single_year": return t.labelPointsInYear;
           case "points_years": return t.labelPointsSeasons;
           case "points_years_consecutive": return t.labelConsecutivePointSeasons;
           case "points_no_wins": return t.labelPointsNoWin;
           case "points_no_podiums": return t.labelPointsNoPodium;
           case "points_most_constructors": return t.labelPointsByConstructors;
           case "points_gp_before": return t.labelGpBeforePoints;
           case "points_gp_scored": return t.labelGpWithPoints;

           // GP
           case "most_grands_prix": return t.labelGrandsPrix;
           case "gp_debut_chronology":
           case "gp_debut_by_constructor": return t.labelDebutYear;
           case "gp_streaks": return t.labelGpStreak;
           case "gp_gap_days": return t.labelGpGapDays;
           case "gp_gap_years": return t.labelGpGapYears;
           case "gp_laps": return t.labelLapsCompleted;
           case "gp_with_champions": return t.labelGpsWithChampions;
           case "gp_with_winners": return t.labelGpsWithWinners;
           case "gp_same_constructor": return t.labelSameConstructorGp;
           case "gp_most_constructors": return t.labelMostConstructorsGp;
           case "gp_same_engine": return t.labelSameEngineGp;
           case "gp_most_engines": return t.labelMostEnginesGp;
           case "gp_same_teammate": return t.labelSameTeammateGp;
           case "gp_age_nationality": return t.labelAgeByNationalityGp;
           case "gp_oldest": return t.labelOldestGp;
           case "gp_avg_age": return t.labelAvgAgeGp;
           case "gp_no_win": return t.labelGpNoWin;
           case "gp_no_pole": return t.labelGpNoPole;
           case "gp_no_fastest_lap": return t.labelGpNoFastest;
           case "gp_no_points": return t.labelGpNoPoints;
           case "gp_no_podium": return t.labelGpNoPodium;
           case "gp_no_win_pole_fastest": return t.labelGpNoTriple;
           case "gp_seasons_consecutive": return t.labelConsecutiveSeasons;

           // Varios
           case "varios_seasons": return t.labelSeasons;
           case "varios_season_streak": return t.labelConsecutiveSeasons;
           case "varios_hat_tricks": return t.labelHatTricks;
           case "varios_front_row_starts": return t.labelFrontRow;
           case "varios_front_row_youngest": return t.labelAge;
           case "varios_front_row_streaks": return t.labelFrontRowStreaks;
           case "varios_finishes": return t.labelFinishes;
           case "varios_finish_streak": return t.labelFinishStreak;
           case "varios_no_dnf_streak": return t.labelNoDnfStreak;
           case "varios_dnfs": return t.labelDnfs;
           case "varios_dnf_streak": return t.labelDnfStreak;
           case "varios_on_leader_lap": return t.labelLeaderLap;
           case "varios_finish_position_avg": return t.labelFinishAvg;
           case "varios_position_gain_avg": return t.labelGainAvg;
           case "varios_disqualifications": return t.labelDisqualifications;

           default: return recordMode.replace(/_/g, " ");
         }
       }

       // Rankings
       if (mode === "wins") return t.labelWinsRanking;
       if (mode === "podiums") return t.labelPodiumsRanking;
       if (mode === "poles") return t.labelPolesRanking;
       if (mode === "grand_chelems") return t.labelGrandChelemsRanking;
       if (mode === "wins_team") return t.labelTeamWins;
       if (mode === "podiums_team") return t.labelTeamPodiums;
       if (mode === "poles_team") return t.labelTeamPoles;

       return recordMode;
     };




  return (
    <div className="race-result-table">
      <h2 className="race-result-title">{t.rankings}</h2>

      <div className="tab-selector">
        <button onClick={() => setSection("rankings")} className={section === "rankings" ? "active" : ""}>{t.driverRankings}</button>
        <button onClick={() => setSection("team_rankings")} className={section === "team_rankings" ? "active" : ""}>{t.teamRankings}</button>
        <button onClick={() => setSection("records")} className={section === "records" ? "active" : ""}>{t.records}</button>
      </div>

      {section === "records" && (
              <div className="stat-controls">
                <select value={recordCategory} onChange={e => {
                  const category = e.target.value;
                  setRecordCategory(category);
                  let newMode = "titles_by_count";
                  if (category === "victories") newMode = "wins_chronological";
                  if (category === "grands_prix") newMode = "most_grands_prix";
                  else if (category === "podiums") newMode = "podiums_second_place";
                  setRecordMode(newMode);

                }}>
                   <option value="champions">{t.championsCategory}</option>
                   <option value="victories">{t.victoriesCategory}</option>
                   <option value="podiums">{t.podiumsCategory}</option>
                   <option value="points">{t.pointsCategory}</option>
                   <option value="grands_prix">{t.grandsPrixCategory}</option>
                   <option value="varios">{t.variosCategory}</option>
                </select>

                <select value={recordMode} onChange={e => setRecordMode(e.target.value)}>
                  {recordCategory === "champions" && (
                    <optgroup label={t.championsCategory}>
                      <option value="titles_by_count">{t.labelTitles}</option>
                      <option value="titles_chronological">{t.labelYear}</option>
                      <option value="titles_by_age">{t.labelAge}</option>
                      <option value="titles_consecutive">{t.labelConsecutiveTitles}</option>
                      <option value="titles_gap">{t.labelTitleGap}</option>
                      <option value="titles_gp_before">{t.labelGpBeforeTitle}</option>
                      <option value="titles_by_constructors">{t.labelConstructorsVariety}</option>
                    </optgroup>
                  )}
                  {recordCategory === "victories" && (
                    <optgroup label={t.victoriesCategory}>
                      <option value="wins_chronological">{t.labelYear}</option>
                      <option value="wins_team_chronological">{t.labelDebutYearWin}</option>
                      <option value="wins_youngest">{t.labelAgeWins}</option>
                      <option value="wins_oldest">{t.labelOldestGp}</option>
                      <option value="wins_on_birthday">{t.labelBirthdayWin}</option>
                      <option value="wins_consecutive">{t.labelConsecutiveWins}</option>
                      <option value="wins_season_start">{t.labelSeasonStartStreak}</option>
                      <option value="wins_last">{t.labelLastWin}</option>
                      <option value="wins_biggest_gap">{t.labelWinGapDays}</option>
                      <option value="wins_first_last_gap">{t.labelWinGapYears}</option>
                      <option value="wins_in_single_year">{t.labelWinsInYear}</option>
                      <option value="wins_years_with">{t.labelWinSeasons}</option>
                      <option value="wins_years_consecutive">{t.labelConsecutiveWinSeasons}</option>
                      <option value="wins_gp_before">{t.labelGpBeforeWin}</option>
                      <option value="wins_most_same_constructor">{t.labelSameConstructorWins}</option>
                      <option value="wins_most_constructors">{t.labelConstructorsWithWins}</option>
                      <option value="wins_by_gp">{t.labelWinsByGp}</option>
                      <option value="wins_consecutive_by_gp">{t.labelConsecutiveGpWins}</option>
                      <option value="wins_most_different_gps">{t.labelGpVarietyWins}</option>
                      <option value="wins_most_circuit">{t.labelCircuitWins}</option>
                      <option value="wins_most_different_circuits">{t.labelCircuitVarietyWins}</option>
                      <option value="wins_by_grid_position">{t.labelGridPositionWins}</option>
                      <option value="wins_most_grid_positions">{t.labelGridVarietyWins}</option>
                      <option value="wins_without_pole">{t.labelNoPoleWins}</option>
                    </optgroup>
                  )}
                  {recordCategory === "podiums" && (
                    <optgroup label={t.podiumsCategory}>
                      <option value="podiums_second_place">{t.labelSecondPlacePodiums}</option>
                      <option value="podiums_third_place">{t.labelThirdPlacePodiums}</option>
                      <option value="podiums_second_and_third">{t.labelSecondThirdPlacePodiums}</option>
                      <option value="podiums_chronology">{t.labelYearChronology}</option>
                      <option value="podiums_team_chronology">{t.labelDebutYear}</option>
                      <option value="podiums_on_birthday">{t.labelPodiumsBirthday}</option>
                      <option value="podiums_oldest_by_nationality">{t.labelOldestGp}</option>
                      <option value="podiums_streaks">{t.labelPodiumSeasons}</option>
                      <option value="podiums_streaks_season">{t.labelConsecutivePodiumSeasons}</option>
                      <option value="podiums_last">{t.labelLastPodium}</option>
                      <option value="podiums_single_year">{t.labelPodiumsInYear}</option>
                      <option value="podiums_years_count">{t.labelPodiumSeasons}</option>
                      <option value="podiums_consecutive_years">{t.labelConsecutivePodiumSeasons}</option>
                      <option value="podiums_before_win">{t.labelPodiumsBeforeWin}</option>
                      <option value="podiums_single_constructor">{t.labelSingleConstructorPodiums}</option>
                      <option value="podiums_no_wins">{t.labelNoWinPodiums}</option>
                      <option value="podiums_most_constructors">{t.labelConstructorsWithWins}</option>
                      <option value="podiums_by_gp">{t.labelPodiumsByGp}</option>
                      <option value="podiums_most_different_gps">{t.labelGpVarietyPodiums}</option>
                      <option value="podiums_most_different_circuits">{t.labelCircuitVarietyPodiums}</option>
                      <option value="podiums_identical_repeats">{t.labelRepeatedPodiums}</option>
                      <option value="podiums_trios">{t.labelFrequentTrios}</option>
                      <option value="podiums_pairs">{t.labelFrequentPairs}</option>
                      <option value="podiums_first_second">{t.labelFirstSecondPairs}</option>
                    </optgroup>
                  )}
                  {recordCategory === "points" && (
                    <optgroup label={t.pointsCategory}>
                      <option value="points_total">{t.labelPoints}</option>
                      <option value="points_chronology">{t.labelYearPointsChronology}</option>
                      <option value="points_last">{t.labelLastPoints}</option>
                      <option value="points_youngest">{t.labelPointsAgeYoungest}</option>
                      <option value="points_oldest">{t.labelPointsAgeOldest}</option>
                      <option value="points_youngest_nationality">{t.labelAgeByNationalityGp}</option>
                      <option value="points_oldest_nationality">{t.labelOldestGp}</option>
                      <option value="points_streaks">{t.labelPointsStreak}</option>
                      <option value="points_streaks_no_sprints">{t.labelNoSprintStreak}</option>
                      <option value="points_gap">{t.labelPointsGapDays}</option>
                      <option value="points_gap_first_last">{t.labelPointsGapYears}</option>
                      <option value="points_most_single_year">{t.labelPointsInYear}</option>
                      <option value="points_years">{t.labelPointsSeasons}</option>
                      <option value="points_years_consecutive">{t.labelConsecutivePointSeasons}</option>
                      <option value="points_no_wins">{t.labelPointsNoWin}</option>
                      <option value="points_no_podiums">{t.labelPointsNoPodium}</option>
                      <option value="points_most_constructors">{t.labelPointsByConstructors}</option>
                      <option value="points_gp_before">{t.labelGpBeforePoints}</option>
                      <option value="points_gp_scored">{t.labelGpWithPoints}</option>
                    </optgroup>
                  )}
                  {recordCategory === "grands_prix" && (
                    <optgroup label={t.grandsPrixCategory}>
                      <option value="most_grands_prix">{t.labelGrandsPrix}</option>
                      <option value="gp_debut_chronology">{t.labelYearDebut}</option>
                      <option value="gp_debut_by_constructor">{t.labelDebutYearConstructor}</option>
                      <option value="gp_streaks">{t.labelGpStreak}</option>
                      <option value="gp_gap_days">{t.labelGpGapDays}</option>
                      <option value="gp_gap_years">{t.labelGpGapYears}</option>
                      <option value="gp_laps">{t.labelLapsCompleted}</option>
                      <option value="gp_with_champions">{t.labelGpsWithChampions}</option>
                      <option value="gp_with_winners">{t.labelGpsWithWinners}</option>
                      <option value="gp_same_constructor">{t.labelSameConstructorGp}</option>
                      <option value="gp_most_constructors">{t.labelMostConstructorsGp}</option>
                      <option value="gp_age_nationality">{t.labelAgeByNationalityGp}</option>
                      <option value="gp_oldest">{t.labelOldestGp}</option>
                      <option value="gp_avg_age">{t.labelAvgAgeGp}</option>
                      <option value="gp_no_win">{t.labelGpNoWin}</option>
                      <option value="gp_no_pole">{t.labelGpNoPole}</option>
                      <option value="gp_no_fastest_lap">{t.labelGpNoFastest}</option>
                      <option value="gp_no_points">{t.labelGpNoPoints}</option>
                      <option value="gp_no_podium">{t.labelGpNoPodium}</option>
                      <option value="gp_no_win_pole_fastest">{t.labelGpNoTriple}</option>
                      <option value="gp_seasons_consecutive">{t.labelConsecutiveSeasons}</option>
                    </optgroup>
                  )}
                  {recordCategory === "varios" && (
                    <optgroup label={t.variosCategory}>
                      <option value="varios_seasons">{t.labelSeasons}</option>
                      <option value="varios_season_streak">{t.labelConsecutiveSeasons}</option>
                      <option value="varios_hat_tricks">{t.labelHatTricks}</option>
                      <option value="varios_front_row_starts">{t.labelFrontRow}</option>
                      <option value="varios_front_row_youngest">{t.labelAgeFrontRow}</option>
                      <option value="varios_front_row_streaks">{t.labelFrontRowStreaks}</option>
                      <option value="varios_finishes">{t.labelFinishes}</option>
                      <option value="varios_no_dnf_streak">{t.labelNoDnfStreak}</option>
                      <option value="varios_dnfs">{t.labelDnfs}</option>
                      <option value="varios_on_leader_lap">{t.labelLeaderLap}</option>
                      <option value="varios_finish_position_avg">{t.labelFinishAvg}</option>
                      <option value="varios_disqualifications">{t.labelDisqualifications}</option>
                    </optgroup>
                  )}
                </select>

              </div>
            )}

      {section !== "records" && (
        <div className="stat-controls">
          <select value={mode} onChange={(e) => { setMode(e.target.value); setTeam(""); }}>
            {section === "rankings" && (
                    <>
                      <option value="wins">{t.labelWinsRanking}</option>
                      <option value="podiums">{t.labelPodiumsRanking}</option>
                      <option value="poles">{t.labelPolesRanking}</option>
                      <option value="grand_chelems">{t.labelGrandChelemsRanking}</option>
                    </>
                  )}
                  {section === "team_rankings" && (
                    <>
                      <option value="wins_team">{t.labelTeamWins}</option>
                      <option value="podiums_team">{t.labelTeamPodiums}</option>
                      <option value="poles_team">{t.labelTeamPoles}</option>
                    </>
                  )}
                </select>

          {showTeamSelector && (
            <select value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">{t.selectTeam}</option>
              {constructors.map((c) => (
                <option key={c.constructorId} value={c.name}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="table-container">
        <table className="result-table">
          <thead>
            <tr>
              <th>{t.position}</th>
              <th>{t.driver}</th>
              <th>{getLabel()}</th>
              {recordMode === "titles_by_constructors" && <th>{t.constructors}</th>}
            </tr>
          </thead>

          <tbody>
            {(data || []).map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <div className="pilot-cell">
                    {item.flagUrl && <img src={item.flagUrl} className="flag" alt={item.nationality} />}
                    <span className="pilot-name">{item.driverName}</span>
                  </div>
                </td>
                <td>{item.value}</td>
                {recordMode === "titles_by_constructors" && <td>{item.extra || "-"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RankingsView;
