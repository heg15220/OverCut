package com.overcut.f1hub.model.service;


import com.overcut.f1hub.rest.dtos.ConstructorStandingDTO;
import com.overcut.f1hub.rest.dtos.CustomRankingDTO;
import com.overcut.f1hub.rest.dtos.DriverRankingDTO;
import com.overcut.f1hub.rest.dtos.DriverStandingDTO;

import java.util.List;

public interface StatisticsService {
    record ConstructorOption(Long constructorId, String name) {}

    List<ConstructorOption> getAllConstructors();
    List<DriverStandingDTO> getDriverStandings(int year);
    List<ConstructorStandingDTO> getConstructorStandings(int year);
    List<DriverRankingDTO> getDriverWinRanking();
    List<DriverRankingDTO> getDriverPodiumRanking();
    List<DriverRankingDTO> getDriverPoleRanking();
    List<DriverRankingDTO> getDriverGrandChelemRanking();
    List<DriverRankingDTO> getWorldChampionsByTitleCount();
    List<DriverRankingDTO> getWorldChampionsChronologically();

    List<DriverRankingDTO> getDriverWinsByTeam(String constructorRef);
    List<DriverRankingDTO> getDriverPodiumsByTeam(String constructorRef);
    List<DriverRankingDTO> getDriverPolesByTeamSince2003(String constructorRef);

    //Champions methods
    List<DriverRankingDTO> getChampionsByYoungestAge();
    List<DriverRankingDTO> getConsecutiveTitles();
    List<DriverRankingDTO> getLongestIntervalBetweenTitles();
    List<DriverRankingDTO> getGpCountBeforeFirstTitle();
    List<DriverRankingDTO> getTitleCountByDriverAndConstructorVariety();

    //Victories methods
    List<DriverRankingDTO> getDriverWinsChronologically();
    List<DriverRankingDTO> getTeamWinsChronologically();
    List<DriverRankingDTO> getYoungestDriversAtFirstWin();
    List<DriverRankingDTO> getOldestDriversToWin();
    List<DriverRankingDTO> getWinsOnBirthday();

    List<DriverRankingDTO> getLongestConsecutiveWinStreaks();
    List<DriverRankingDTO> getLongestSeasonStartWinStreaks();
    List<DriverRankingDTO> getLastCareerWinPerDriver();
    List<DriverRankingDTO> getBiggestGapBetweenWins();
    List<DriverRankingDTO> getGapBetweenFirstAndLastWin();
    List<DriverRankingDTO> getMostWinsInSingleYear();
    List<DriverRankingDTO> getMostYearsWithWins();
    List<DriverRankingDTO> getMostConsecutiveWinningYears();
    List<DriverRankingDTO> getGpCountBeforeFirstWin();


    List<DriverRankingDTO> getDriversWithMostWinsSameConstructor();
    List<DriverRankingDTO> getDriversWithMostConstructorsWithWins();
    List<DriverRankingDTO> getWinsByGrandPrix();
    List<DriverRankingDTO> getConsecutiveWinsByGrandPrix();
    List<DriverRankingDTO> getDriversWithMostDifferentGPsWon();
    List<DriverRankingDTO> getDriversWithMostCircuitWins();
    List<DriverRankingDTO> getDriversWithMostDifferentCircuitWins();
    List<DriverRankingDTO> getWinsByStartingGridPosition();
    List<DriverRankingDTO> getDriversWithMostGridPositionsWithWins();
    List<DriverRankingDTO> getDriversWithHomeGPWins();
    List<DriverRankingDTO> getWinsWithoutLeadingAnyLap();
    List<DriverRankingDTO> getWinsWithoutPolePosition();
    List<DriverRankingDTO> getWinsWithFastestLap();



    List<DriverRankingDTO> getSecondPlacePodiums();
    List<DriverRankingDTO> getThirdPlacePodiums();
    List<DriverRankingDTO> getSecondAndThirdPlacePodiums();
    List<DriverRankingDTO> getPodiumChronology();
    List<DriverRankingDTO> getTeamPodiumChronology();
    List<DriverRankingDTO> getYoungestPodiumDrivers();
    List<DriverRankingDTO> getPodiumsOnBirthday();
    List<DriverRankingDTO> getOldestPodiumDriversByNationality();


    List<DriverRankingDTO> getLongestPodiumStreaks();
    List<DriverRankingDTO> getSeasonStartPodiumStreaks();
    List<DriverRankingDTO> getLastPodiumPerDriver();
    List<DriverRankingDTO> getBiggestGapBetweenPodiums();
    List<DriverRankingDTO> getGapBetweenFirstAndLastPodium();
    List<DriverRankingDTO> getMostPodiumsInSingleYear();
    List<DriverRankingDTO> getPodiumYearsCount();
    List<DriverRankingDTO> getConsecutivePodiumYears();
    List<DriverRankingDTO> getGpCountBeforeFirstPodium();
    List<DriverRankingDTO> getPodiumsBeforeFirstWin();
    List<DriverRankingDTO> getPodiumsWithSingleConstructor();
    List<DriverRankingDTO> getPodiumsWithNoWins();
    List<DriverRankingDTO> getPodiumsWithMostConstructors();
    List<DriverRankingDTO> getPodiumsByGrandPrix();
    List<DriverRankingDTO> getDriversWithMostDifferentGPsWithPodium();
    List<DriverRankingDTO> getDriversWithMostDifferentCircuitsWithPodium();
    List<DriverRankingDTO> getPodiumsAtHomeGP();
    List<DriverRankingDTO> getRepeatedIdenticalPodiums();
    List<DriverRankingDTO> getMostFrequentPodiumTrios();
    List<DriverRankingDTO> getMostFrequentPodiumPairs();
    List<DriverRankingDTO> getMostCommonFirstSecondPairs();




    List<DriverRankingDTO> getDriversWithMostPoints();
    List<DriverRankingDTO> getDriversToScorePointsChronologically();
    List<DriverRankingDTO> getLastPointsPerDriver();
    List<DriverRankingDTO> getYoungestDriversToScorePoints();
    List<DriverRankingDTO> getOldestDriversToScorePoints();
    List<DriverRankingDTO> getYoungestDriversToScorePointsByNationality();
    List<DriverRankingDTO> getOldestDriversToScorePointsByNationality();
    List<DriverRankingDTO> getLongestConsecutivePointsStreaks();
    List<DriverRankingDTO> getLongestConsecutivePointsStreaksWithoutSprints();
    List<DriverRankingDTO> getLongestGapBetweenPoints();
    List<DriverRankingDTO> getGapBetweenFirstAndLastPoints();
    List<DriverRankingDTO> getMostPointsInSingleYear();
    List<DriverRankingDTO> getMostYearsScoringPoints();
    List<DriverRankingDTO> getMostConsecutiveSeasonsWithPoints();
    List<DriverRankingDTO> getGpCountBeforeFirstPoints();
    List<DriverRankingDTO> getGpCountWhereDriverScoredPoints();
    List<DriverRankingDTO> getDriversWithPointsButNoWins();
    List<DriverRankingDTO> getDriversWithPointsButNoPodiums();
    List<DriverRankingDTO> getDriversWithMostConstructorsWithPoints();



    // Grandes Premios - Generales
    List<DriverRankingDTO> getDriversWithMostGrandsPrix();
    List<DriverRankingDTO> getDriverGpDebutChronology();
    List<DriverRankingDTO> getGpDebutChronologyByConstructor();
    List<DriverRankingDTO> getLongestGpStreaks();
    List<DriverRankingDTO> getBiggestGapBetweenGrandsPrix();
    List<DriverRankingDTO> getGapBetweenFirstAndLastGp();

    // Acumulados físicos
    List<DriverRankingDTO> getDriversByTotalLapsCompleted();

    // Relaciones con campeonatos y compañeros
    List<DriverRankingDTO> getDriversWithGpsWithWorldChampions();
    List<DriverRankingDTO> getDriversWithGpsWithRaceWinner();
    List<DriverRankingDTO> getDriversWithMostGpsWithSameConstructor();
    List<DriverRankingDTO> getDriversWithMostConstructorsInGps();
    List<DriverRankingDTO> getDriversWithMostGpsWithSameEngine();
    List<DriverRankingDTO> getDriversWithMostEnginesInGps();
    List<DriverRankingDTO> getDriversWithMostGpsWithSameTeammate();

    // Edad
    List<DriverRankingDTO> getDriversGpAgeByNationality();
    List<DriverRankingDTO> getOldestDriversAtGp();
    List<DriverRankingDTO> getAverageDriverAgePerGp();

    // Sin eventos clave
    List<DriverRankingDTO> getDriversWithMostGpsWithoutWin();
    List<DriverRankingDTO> getDriversWithMostGpsWithoutPole();
    List<DriverRankingDTO> getDriversWithMostGpsWithoutFastestLap();
    List<DriverRankingDTO> getDriversWithMostGpsWithoutPoints();
    List<DriverRankingDTO> getDriversWithMostGpsWithoutPodium();
    List<DriverRankingDTO> getDriversWithMostGpsWithoutLeadingLap();
    List<DriverRankingDTO> getDriversWithGpsWithoutWinPoleOrFastestLap();

    // Temporadas
    List<DriverRankingDTO> getDriversWithMostSeasons();
    List<DriverRankingDTO> getDriversWithMostConsecutiveSeasons();
}
