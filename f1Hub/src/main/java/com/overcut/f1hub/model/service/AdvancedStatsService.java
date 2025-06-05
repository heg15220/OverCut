package com.overcut.f1hub.model.service;

import com.overcut.f1hub.rest.dtos.ChartDataDTO;

import java.util.List;

public interface AdvancedStatsService {

    record DriverOption(Long driverId, String name) {}
    record ConstructorOption(Long constructorId, String name) {}
    record CircuitOption(String circuitRef, String name) {}


    List<DriverOption> getAllDrivers();

    List<ConstructorOption> getAllConstructors();

    List<Integer> getAllSeasons();

    List<CircuitOption> getAllCircuits();


    ChartDataDTO getAveragePointsPerSeasonByDriver(String decade, String lang);

    ChartDataDTO getVictoryPercentageByDriverPerSeason(String decade, String lang);

    ChartDataDTO getPodiumPercentageVsTeammate(String decade, String lang);

    ChartDataDTO getPodiumPercentageTotalVsAllTeammates(String lang);

    ChartDataDTO getQ3PercentageVsTeammate(String driverId, String lang);

    ChartDataDTO getAverageRetirementsBySeason(String lang);

    ChartDataDTO getAverageAccidentsBySeason(String lang);

    ChartDataDTO getAvgPositionsGainedFirstLaps(String lang);

    ChartDataDTO getAvgPositionsGainedBySeason(String driverId, String lang);

    ChartDataDTO getQualiVsTeammateComparison(String driverId, String lang);

    ChartDataDTO getRaceVsTeammateComparison(String driverId, String lang);

    ChartDataDTO getWinsFrom3rdOrWorse(String lang);

    ChartDataDTO getPodiumsFrom3rdOrWorse(String lang);

    ChartDataDTO getMostCommonFinishPosition(String lang);

    ChartDataDTO getMostCommonQualiPosition(String lang);

    ChartDataDTO getAvgGapToPolePerSeason(String lang);

    ChartDataDTO getDriverVsTeamChampionshipFinish(String decade, String lang);

    ChartDataDTO getWinsWithoutTop2(String lang);

    ChartDataDTO getTeamComebacksBySeason(String decade, String lang);


    ChartDataDTO getMostTeamPoints(String lang);

    ChartDataDTO getAvgPointsPerTeamPerSeason(String decade, String lang);


    ChartDataDTO getPitStopsPerRace(String year, String lang);

    ChartDataDTO getAvgPitStopsPerSeason(String lang);

    ChartDataDTO getOvertakesPerRace(String year, String lang);

    ChartDataDTO getAvgOvertakesPerSeason(String lang);

    ChartDataDTO getPointsDeltaVsTeammate(String season, String lang);

    ChartDataDTO getAverageQualiGapBetween1stAnd2ndPerSeason(String lang);

    ChartDataDTO getAverageQualiGapBetween10thAndPolePerSeason(String lang);

    ChartDataDTO getAverageRaceGapBetween1stAnd2ndPerSeason(String lang);

    ChartDataDTO getDistinctGridPositionsFromWhichDriverWon(String lang);

    ChartDataDTO getFrontRowVictoryRatePerSeason(String lang);

    ChartDataDTO getWinPercentageByDriverAtCircuit(String circuitRef, String lang);

    ChartDataDTO getPoleWinRateAtCircuit(String circuitRef,String lang);

    ChartDataDTO getChampionshipProgressTop2Drivers(String seasonStr, String lang);

    ChartDataDTO getFinishPositionDistribution(String lang);
    ChartDataDTO getFinishVsDNFRatio(String lang);
    ChartDataDTO getSprintVsRacePointsEvolution(String driverIdStr, String lang);
    ChartDataDTO getGridVsResultDeltaByConstructor(String lang);
    ChartDataDTO getReliabilityBySeason(String lang);
    ChartDataDTO getAverageRaceDurationPerSeason(String lang);
    ChartDataDTO getAvgFastestPitStopPerRace(String lang);
    ChartDataDTO getRaceLeadersPerGrandPrix(String lang);
    ChartDataDTO getAvgQ1Q3DeltaBySeason(String lang);
    ChartDataDTO getAvgQualiImprovement(String lang);
    ChartDataDTO getPointsStreaksPerDriver(String lang);
    ChartDataDTO getPerformanceInCrazyRaces(String lang);
    ChartDataDTO getAvgFastestLapSpeedPerSeason(String lang);
    ChartDataDTO getTopOvertakingRaces(String lang);

}
