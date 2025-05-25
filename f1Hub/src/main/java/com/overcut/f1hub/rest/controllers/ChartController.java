package com.overcut.f1hub.rest.controllers;

import com.overcut.f1hub.model.service.AdvancedStatsService;
import com.overcut.f1hub.rest.dtos.ChartDataDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/charts")
public class ChartController {

    @Autowired
    private AdvancedStatsService advancedStatsService;

    @GetMapping("/average-points-per-season")
    public ChartDataDTO getAveragePointsPerSeasonByDriver() {
        return advancedStatsService.getAveragePointsPerSeasonByDriver();
    }

    @GetMapping("/victory-percentage-per-season")
    public ChartDataDTO getVictoryPercentageByDriverPerSeason() {
        return advancedStatsService.getVictoryPercentageByDriverPerSeason();
    }

    @GetMapping("/podium-percentage-vs-teammate")
    public ChartDataDTO getPodiumPercentageVsTeammate(@RequestParam String driverId) {
        return advancedStatsService.getPodiumPercentageVsTeammate(driverId);
    }

    @GetMapping("/q3-percentage-vs-teammate")
    public ChartDataDTO getQ3PercentageVsTeammate(@RequestParam String driverId) {
        return advancedStatsService.getQ3PercentageVsTeammate(driverId);
    }

    @GetMapping("/average-gap-to-pole")
    public ChartDataDTO getAvgGapToPolePerSeason() {
        return advancedStatsService.getAvgGapToPolePerSeason();
    }

    @GetMapping("/avg-positions-gained-by-season")
    public ChartDataDTO getAvgPositionsGainedBySeason(@RequestParam String driverId) {
        return advancedStatsService.getAvgPositionsGainedBySeason(driverId);
    }

    @GetMapping("/avg-positions-gained-first-laps")
    public ChartDataDTO getAvgPositionsGainedFirstLaps() {
        return advancedStatsService.getAvgPositionsGainedFirstLaps();
    }

    @GetMapping("/race-vs-teammate-comparison")
    public ChartDataDTO getRaceVsTeammateComparison(@RequestParam String driverId) {
        return advancedStatsService.getRaceVsTeammateComparison(driverId);
    }

    @GetMapping("/quali-vs-teammate-comparison")
    public ChartDataDTO getQualiVsTeammateComparison(@RequestParam String driverId) {
        return advancedStatsService.getQualiVsTeammateComparison(driverId);
    }

    @GetMapping("/most-common-finish-position")
    public ChartDataDTO getMostCommonFinishPosition() {
        return advancedStatsService.getMostCommonFinishPosition();
    }

    @GetMapping("/most-common-quali-position")
    public ChartDataDTO getMostCommonQualiPosition() {
        return advancedStatsService.getMostCommonQualiPosition();
    }

    @GetMapping("/points-delta-vs-teammate")
    public ChartDataDTO getPointsDeltaVsTeammate(@RequestParam String season) {
        return advancedStatsService.getPointsDeltaVsTeammate(season);
    }
    @GetMapping("/team-comebacks-by-season")
    public ChartDataDTO getTeamComebacksBySeason() {
        return advancedStatsService.getTeamComebacksBySeason();
    }

    @GetMapping("/avg-team-points-by-season")
    public ChartDataDTO getAvgPointsPerTeamPerSeason() {
        return advancedStatsService.getAvgPointsPerTeamPerSeason();
    }

    @GetMapping("/wins-no-front-row")
    public ChartDataDTO getWinsWithoutTop2() {
        return advancedStatsService.getWinsWithoutTop2();
    }

    @GetMapping("/most-team-points")
    public ChartDataDTO getMostTeamPoints() {
        return advancedStatsService.getMostTeamPoints();
    }

    @GetMapping("/podiums-from-3rd-or-worse")
    public ChartDataDTO getPodiumsFrom3rdOrWorse() {
        return advancedStatsService.getPodiumsFrom3rdOrWorse();
    }

    @GetMapping("/driver-vs-team-championship-finish")
    public ChartDataDTO getDriverVsTeamChampionshipFinish() {
        return advancedStatsService.getDriverVsTeamChampionshipFinish();
    }

    @GetMapping("/average-accidents-by-season")
    public ChartDataDTO getAverageAccidentsBySeason() {
        return advancedStatsService.getAverageAccidentsBySeason();
    }

    @GetMapping("/pitstops-per-race")
    public ChartDataDTO getPitStopsPerRace(@RequestParam String year) {
        return advancedStatsService.getPitStopsPerRace(year);
    }

    @GetMapping("/avg-pitstops-per-season")
    public ChartDataDTO getAvgPitStopsPerSeason() {
        return advancedStatsService.getAvgPitStopsPerSeason();
    }

    @GetMapping("/overtakes-per-race")
    public ChartDataDTO getOvertakesPerRace(@RequestParam String year) {
        return advancedStatsService.getOvertakesPerRace(year);
    }

    @GetMapping("/avg-overtakes-per-season")
    public ChartDataDTO getAvgOvertakesPerSeason() {
        return advancedStatsService.getAvgOvertakesPerSeason();
    }

    @GetMapping("/wins-from-3rd-or-worse")
    public ChartDataDTO getWinsFrom3rdOrWorse() {
        return advancedStatsService.getWinsFrom3rdOrWorse();
    }


}
