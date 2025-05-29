package com.overcut.f1hub.model.service;

import com.overcut.f1hub.rest.dtos.ChartDataDTO;

import java.util.List;

public interface AdvancedStatsService {

    record DriverOption(Long driverId, String name) {}
    record ConstructorOption(Long constructorId, String name) {}

    List<DriverOption> getAllDrivers();

    List<ConstructorOption> getAllConstructors();

    List<Integer> getAllSeasons();

    ChartDataDTO getAveragePointsPerSeasonByDriver(String decade);

    ChartDataDTO getVictoryPercentageByDriverPerSeason(String decade);

    ChartDataDTO getPodiumPercentageVsTeammate(String decade);

    ChartDataDTO getPodiumPercentageTotalVsAllTeammates();

    ChartDataDTO getQ3PercentageVsTeammate(String driverId);

    ChartDataDTO getAverageRetirementsBySeason();

    ChartDataDTO getAverageAccidentsBySeason();

    ChartDataDTO getAvgPositionsGainedFirstLaps();

    ChartDataDTO getAvgPositionsGainedBySeason(String driverId);

    ChartDataDTO getQualiVsTeammateComparison(String driverId);

    ChartDataDTO getRaceVsTeammateComparison(String driverId);

    ChartDataDTO getWinsFrom3rdOrWorse();

    ChartDataDTO getPodiumsFrom3rdOrWorse();

    ChartDataDTO getMostCommonFinishPosition();

    ChartDataDTO getMostCommonQualiPosition();

    ChartDataDTO getAvgGapToPolePerSeason();

    ChartDataDTO getDriverVsTeamChampionshipFinish(String decade);

    ChartDataDTO getWinsWithoutTop2();

    ChartDataDTO getTeamComebacksBySeason(String decade);


    ChartDataDTO getMostTeamPoints();

    ChartDataDTO getAvgPointsPerTeamPerSeason(String decade);


    ChartDataDTO getPitStopsPerRace(String year);

    ChartDataDTO getAvgPitStopsPerSeason();

    ChartDataDTO getOvertakesPerRace(String year);

    ChartDataDTO getAvgOvertakesPerSeason();

    ChartDataDTO getPointsDeltaVsTeammate(String season);

    ChartDataDTO getAverageQualiGapBetween1stAnd2ndPerSeason();

    ChartDataDTO getAverageQualiGapBetween10thAndPolePerSeason();

    ChartDataDTO getAverageRaceGapBetween1stAnd2ndPerSeason();

    ChartDataDTO getDistinctGridPositionsFromWhichDriverWon();


}
