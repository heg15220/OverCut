package com.overcut.f1hub.model.service;


import com.overcut.f1hub.rest.dtos.ConstructorStandingDTO;
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



}
