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

    List<DriverRankingDTO> getChampionsByYoungestAge();
    List<DriverRankingDTO> getConsecutiveTitles();
    List<DriverRankingDTO> getLongestIntervalBetweenTitles();
    List<DriverRankingDTO> getGpCountBeforeFirstTitle();
    List<DriverRankingDTO> getTitleCountByDriverAndConstructorVariety();


}
