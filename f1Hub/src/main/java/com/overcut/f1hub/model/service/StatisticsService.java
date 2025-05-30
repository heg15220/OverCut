package com.overcut.f1hub.model.service;


import com.overcut.f1hub.rest.dtos.ConstructorStandingDTO;
import com.overcut.f1hub.rest.dtos.DriverRankingDTO;
import com.overcut.f1hub.rest.dtos.DriverStandingDTO;

import java.util.List;

public interface StatisticsService {
    List<DriverStandingDTO> getDriverStandings(int year);
    List<ConstructorStandingDTO> getConstructorStandings(int year);
    List<DriverRankingDTO> getDriverWinRanking();
    List<DriverRankingDTO> getDriverPodiumRanking();
    List<DriverRankingDTO> getDriverPoleRanking();
    List<DriverRankingDTO> getDriverGrandChelemRanking();

}
