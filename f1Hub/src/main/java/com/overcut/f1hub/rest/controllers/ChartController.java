package com.overcut.f1hub.rest.controllers;

import com.overcut.f1hub.model.service.AdvancedStatsService;
import com.overcut.f1hub.rest.dtos.ChartDataDTO;
import com.overcut.f1hub.rest.dtos.ChartFilterOptionsDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:8080")
@RestController
@RequestMapping("/api/charts")
public class ChartController {

    @Autowired
    private AdvancedStatsService advancedStatsService;

    @GetMapping("/average-points-per-season")
    public ChartDataDTO getAveragePointsPerSeasonByDriver(@RequestParam(required = false) String decade) {
        return advancedStatsService.getAveragePointsPerSeasonByDriver(decade);
    }

    @GetMapping("/victory-percentage-by-decade")
    public ChartDataDTO getVictoryPercentageByDriverPerDecade(@RequestParam(required = false) String decade) {
        // Filtrar los datos según la década (si se pasa el parámetro)
        return advancedStatsService.getVictoryPercentageByDriverPerSeason(decade);
    }


    @GetMapping("/podium-percentage-vs-teammate")
    public ChartDataDTO getPodiumPercentageVsTeammate(@RequestParam(required = false) String decade) {
        return advancedStatsService.getPodiumPercentageVsTeammate(decade);
    }

    @GetMapping("/total-podium-percentage-vs-all-teammates")
    public ChartDataDTO getPodiumPercentageTotalVsAllTeammates() { return advancedStatsService.getPodiumPercentageTotalVsAllTeammates();}

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
    public ChartDataDTO getTeamComebacksBySeason(@RequestParam(required = false) String decade) {
        return advancedStatsService.getTeamComebacksBySeason(decade);
    }

    @GetMapping("/avg-team-points-by-season")
    public ChartDataDTO getAvgPointsPerTeamPerSeason(@RequestParam(required = false) String decade) {
        return advancedStatsService.getAvgPointsPerTeamPerSeason(decade);
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
    public ChartDataDTO getDriverVsTeamChampionshipFinish(@RequestParam(required = false) String decade) {
        return advancedStatsService.getDriverVsTeamChampionshipFinish(decade);
    }

    @GetMapping("/average-accidents-by-season")
    public ChartDataDTO getAverageAccidentsBySeason() {
        return advancedStatsService.getAverageAccidentsBySeason();
    }


    @GetMapping("/average-retirements-by-season")
    public ChartDataDTO getAverageRetirementsBySeason() {
        return advancedStatsService.getAverageRetirementsBySeason();
    }


    @GetMapping("/pitstops-per-race")
    public ChartDataDTO getPitStopsPerRace(@RequestParam("season") String season) {
        return advancedStatsService.getPitStopsPerRace(season);
    }
    @GetMapping("/avg-pitstops-per-season")
    public ChartDataDTO getAvgPitStopsPerSeason() {
        return advancedStatsService.getAvgPitStopsPerSeason();
    }

    @GetMapping("/overtakes-per-race")
    public ChartDataDTO getOvertakesPerRace(@RequestParam("season") String season) {
        return advancedStatsService.getOvertakesPerRace(season);
    }

    @GetMapping("/avg-overtakes-per-season")
    public ChartDataDTO getAvgOvertakesPerSeason() {
        return advancedStatsService.getAvgOvertakesPerSeason();
    }

    @GetMapping("/wins-from-3rd-or-worse")
    public ChartDataDTO getWinsFrom3rdOrWorse() {
        return advancedStatsService.getWinsFrom3rdOrWorse();
    }



    @GetMapping("/quali-gap-1st-to-2nd-average")
    public ChartDataDTO getAverageQualiGapBetween1stAnd2ndPerSeason(){ return advancedStatsService.getAverageQualiGapBetween1stAnd2ndPerSeason();}

    @GetMapping("/quali-gap-1st-to-10th-average")
    public ChartDataDTO getAverageQualiGapBetween10thAndPolePerSeason(){ return  advancedStatsService.getAverageQualiGapBetween10thAndPolePerSeason();}

    @GetMapping("/race-gap-1st-to-2nd-average")
    public ChartDataDTO getAverageRaceGapBetween1stAnd2ndPerSeason() { return advancedStatsService.getAverageRaceGapBetween1stAnd2ndPerSeason();}

    @GetMapping("/distinct-grid-positions-winning")
    public ChartDataDTO getDistinctGridPositionsFromWhichDriverWon() { return  advancedStatsService.getDistinctGridPositionsFromWhichDriverWon();}

    @GetMapping("/front-row-wins-rate")
    public ChartDataDTO getFrontRowVictoryRatePerSeason() { return advancedStatsService.getFrontRowVictoryRatePerSeason();}

    @GetMapping("/wins-percentage-driver-circuit")
    public ChartDataDTO getWinPercentageByDriverAtCircuit(@RequestParam("circuitOptions") String circuitRef){
        return advancedStatsService.getWinPercentageByDriverAtCircuit(circuitRef);
    }

    @GetMapping("/pole-win-rate-circuit")
    public ChartDataDTO getPoleWinRateAtCircuit(@RequestParam("circuitOptions") String circuitRef){
        return advancedStatsService.getPoleWinRateAtCircuit(circuitRef);
    }


    @GetMapping("/by-category")
    public Map<String, List<String>> getChartEndpointsByCategory() {
        Map<String, List<String>> categories = new HashMap<>();

        categories.put("Pilotos", List.of(
                "podium-percentage-vs-teammate",
                "avg-positions-gained-by-season",
                "avg-positions-gained-first-laps",
                "most-common-finish-position",
                "driver-vs-team-championship-finish",
                "total-podium-percentage-vs-all-teammates",
                "distinct-grid-positions-winning"
        ));

        categories.put("Constructores", List.of(
                "team-comebacks-by-season",
                "avg-team-points-by-season",
                "most-team-points",
                "wins-no-front-row"
        ));

        categories.put("Carreras", List.of(
                "wins-from-3rd-or-worse",
                "podiums-from-3rd-or-worse",
                "average-accidents-by-season",
                "average-retirements-by-season",
                "avg-pitstops-per-season",
                "avg-overtakes-per-season",
                "quali-gap-1st-to-2nd-average",
                "quali-gap-1st-to-10th-average",
                "race-gap-1st-to-2nd-average",
                "front-row-wins-rate"
        ));

        categories.put("Circuitos", List.of(
                "wins-percentage-driver-circuit",
                "pole-win-rate-circuit"
        ));

        return categories;
    }

    @GetMapping("/drivers")
    public List<AdvancedStatsService.DriverOption> getAllDrivers() {
        return advancedStatsService.getAllDrivers();
    }

    @GetMapping("/constructors")
    public List<AdvancedStatsService.ConstructorOption> getAllConstructors() {
        return advancedStatsService.getAllConstructors();
    }

    @GetMapping("/seasons")
    public List<Integer> getAllSeasons() {
        return advancedStatsService.getAllSeasons();
    }

    @GetMapping("/circuits")
    public List<AdvancedStatsService.CircuitOption> getAllCircuits() {
        return advancedStatsService.getAllCircuits();
    }


    @GetMapping("/filters")
    public ChartFilterOptionsDTO getChartFilters() {
        return new ChartFilterOptionsDTO(
                advancedStatsService.getAllDrivers(),
                advancedStatsService.getAllConstructors(),
                advancedStatsService.getAllSeasons(),
                advancedStatsService.getAllCircuits()
        );
    }


}
