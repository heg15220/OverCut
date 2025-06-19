package com.overcut.f1hub.rest.controllers;

import com.overcut.f1hub.model.service.AdvancedStatsService;
import com.overcut.f1hub.rest.dtos.ChartDataDTO;
import com.overcut.f1hub.rest.dtos.ChartFilterOptionsDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:8083")
@RestController
@RequestMapping("/api/charts")
public class ChartController {

    @Autowired
    private AdvancedStatsService advancedStatsService;

    @GetMapping("/average-points-per-season")
    public ChartDataDTO getAveragePointsPerSeasonByDriver(@RequestParam(required = false) String decade,
                                                          @RequestParam String lang) {
        return advancedStatsService.getAveragePointsPerSeasonByDriver(decade, lang);
    }

    @GetMapping("/victory-percentage-by-decade")
    public ChartDataDTO getVictoryPercentageByDriverPerDecade(@RequestParam(required = false) String decade,
                                                              @RequestParam String lang) {
        // Filtrar los datos según la década (si se pasa el parámetro)
        return advancedStatsService.getVictoryPercentageByDriverPerSeason(decade, lang);
    }


    @GetMapping("/podium-percentage-vs-teammate")
    public ChartDataDTO getPodiumPercentageVsTeammate(@RequestParam(required = false) String decade,
                                                      @RequestParam String lang) {
        return advancedStatsService.getPodiumPercentageVsTeammate(decade, lang);
    }

    @GetMapping("/total-podium-percentage-vs-all-teammates")
    public ChartDataDTO getPodiumPercentageTotalVsAllTeammates(@RequestParam String lang) {
        return advancedStatsService.getPodiumPercentageTotalVsAllTeammates(lang);
    }

    @GetMapping("/q3-percentage-vs-teammate")
    public ChartDataDTO getQ3PercentageVsTeammate(@RequestParam String driverId, @RequestParam String lang) {
        return advancedStatsService.getQ3PercentageVsTeammate(driverId,lang);
    }

    @GetMapping("/average-gap-to-pole")
    public ChartDataDTO getAvgGapToPolePerSeason(@RequestParam String lang) {
        return advancedStatsService.getAvgGapToPolePerSeason(lang);
    }

    @GetMapping("/avg-positions-gained-by-season")
    public ChartDataDTO getAvgPositionsGainedBySeason(@RequestParam String driverId, @RequestParam String lang) {
        return advancedStatsService.getAvgPositionsGainedBySeason(driverId, lang);
    }

    @GetMapping("/avg-positions-gained-first-laps")
    public ChartDataDTO getAvgPositionsGainedFirstLaps(@RequestParam String lang) {
        return advancedStatsService.getAvgPositionsGainedFirstLaps(lang);
    }

    @GetMapping("/race-vs-teammate-comparison")
    public ChartDataDTO getRaceVsTeammateComparison(@RequestParam String driverId, @RequestParam String lang) {
        return advancedStatsService.getRaceVsTeammateComparison(driverId, lang);
    }

    @GetMapping("/quali-vs-teammate-comparison")
    public ChartDataDTO getQualiVsTeammateComparison(@RequestParam String driverId, @RequestParam String lang) {
        return advancedStatsService.getQualiVsTeammateComparison(driverId, lang);
    }

    @GetMapping("/most-common-finish-position")
    public ChartDataDTO getMostCommonFinishPosition(@RequestParam String lang) {
        return advancedStatsService.getMostCommonFinishPosition(lang);
    }

    @GetMapping("/most-common-quali-position")
    public ChartDataDTO getMostCommonQualiPosition(@RequestParam String lang) {
        return advancedStatsService.getMostCommonQualiPosition(lang);
    }

    @GetMapping("/points-delta-vs-teammate")
    public ChartDataDTO getPointsDeltaVsTeammate(@RequestParam String season,@RequestParam String lang) {
        return advancedStatsService.getPointsDeltaVsTeammate(season, lang);
    }
    @GetMapping("/team-comebacks-by-season")
    public ChartDataDTO getTeamComebacksBySeason(@RequestParam(required = false) String decade,
                                                 @RequestParam String lang) {
        return advancedStatsService.getTeamComebacksBySeason(decade, lang);
    }

    @GetMapping("/avg-team-points-by-season")
    public ChartDataDTO getAvgPointsPerTeamPerSeason(@RequestParam(required = false) String decade,
                                                     @RequestParam String lang) {
        return advancedStatsService.getAvgPointsPerTeamPerSeason(decade, lang);
    }

    @GetMapping("/wins-no-front-row")
    public ChartDataDTO getWinsWithoutTop2(@RequestParam String lang) {
        return advancedStatsService.getWinsWithoutTop2(lang);
    }

    @GetMapping("/most-team-points")
    public ChartDataDTO getMostTeamPoints(@RequestParam String lang) {
        return advancedStatsService.getMostTeamPoints(lang);
    }

    @GetMapping("/podiums-from-3rd-or-worse")
    public ChartDataDTO getPodiumsFrom3rdOrWorse(@RequestParam String lang) {
        return advancedStatsService.getPodiumsFrom3rdOrWorse(lang);
    }

    @GetMapping("/driver-vs-team-championship-finish")
    public ChartDataDTO getDriverVsTeamChampionshipFinish(@RequestParam(required = false) String decade,
                                                          @RequestParam String lang) {
        return advancedStatsService.getDriverVsTeamChampionshipFinish(decade, lang);
    }

    @GetMapping("/average-accidents-by-season")
    public ChartDataDTO getAverageAccidentsBySeason(@RequestParam String lang) {
        return advancedStatsService.getAverageAccidentsBySeason(lang);
    }


    @GetMapping("/average-retirements-by-season")
    public ChartDataDTO getAverageRetirementsBySeason(@RequestParam String lang) {
        return advancedStatsService.getAverageRetirementsBySeason(lang);
    }


    @GetMapping("/pitstops-per-race")
    public ChartDataDTO getPitStopsPerRace(@RequestParam("season") String season, @RequestParam String lang) {
        return advancedStatsService.getPitStopsPerRace(season, lang);
    }
    @GetMapping("/avg-pitstops-per-season")
    public ChartDataDTO getAvgPitStopsPerSeason(@RequestParam String lang) {
        return advancedStatsService.getAvgPitStopsPerSeason(lang);
    }

    @GetMapping("/overtakes-per-race")
    public ChartDataDTO getOvertakesPerRace(@RequestParam("season") String season, @RequestParam String lang) {
        return advancedStatsService.getOvertakesPerRace(season, lang);
    }

    @GetMapping("/avg-overtakes-per-season")
    public ChartDataDTO getAvgOvertakesPerSeason(@RequestParam String lang) {
        return advancedStatsService.getAvgOvertakesPerSeason(lang);
    }

    @GetMapping("/wins-from-3rd-or-worse")
    public ChartDataDTO getWinsFrom3rdOrWorse(@RequestParam String lang) {
        return advancedStatsService.getWinsFrom3rdOrWorse(lang);
    }



    @GetMapping("/quali-gap-1st-to-2nd-average")
    public ChartDataDTO getAverageQualiGapBetween1stAnd2ndPerSeason(@RequestParam String lang){
        return advancedStatsService.getAverageQualiGapBetween1stAnd2ndPerSeason(lang);
    }

    @GetMapping("/quali-gap-1st-to-10th-average")
    public ChartDataDTO getAverageQualiGapBetween10thAndPolePerSeason(@RequestParam String lang){
        return  advancedStatsService.getAverageQualiGapBetween10thAndPolePerSeason(lang);
    }

    @GetMapping("/race-gap-1st-to-2nd-average")
    public ChartDataDTO getAverageRaceGapBetween1stAnd2ndPerSeason(@RequestParam String lang) {
        return advancedStatsService.getAverageRaceGapBetween1stAnd2ndPerSeason(lang);
    }

    @GetMapping("/distinct-grid-positions-winning")
    public ChartDataDTO getDistinctGridPositionsFromWhichDriverWon(@RequestParam String lang) {
        return  advancedStatsService.getDistinctGridPositionsFromWhichDriverWon(lang);
    }

    @GetMapping("/front-row-wins-rate")
    public ChartDataDTO getFrontRowVictoryRatePerSeason(@RequestParam String lang) {
        return advancedStatsService.getFrontRowVictoryRatePerSeason(lang);
    }

    @GetMapping("/wins-percentage-driver-circuit")
    public ChartDataDTO getWinPercentageByDriverAtCircuit(@RequestParam("circuitOptions") String circuitRef,
                                                          @RequestParam String lang){
        return advancedStatsService.getWinPercentageByDriverAtCircuit(circuitRef, lang);
    }

    @GetMapping("/pole-win-rate-circuit")
    public ChartDataDTO getPoleWinRateAtCircuit(@RequestParam("circuitOptions") String circuitRef,
                                                @RequestParam String lang){
        return advancedStatsService.getPoleWinRateAtCircuit(circuitRef, lang);
    }

    @GetMapping("/championship-progress-top2")
    public ChartDataDTO getChampionshipProgressTop2Drivers(@RequestParam("season") String season,
                                                           @RequestParam String lang){
        return advancedStatsService.getChampionshipProgressTop2Drivers(season,lang);
    }

    @GetMapping("/finish-position-distribution")
    public ChartDataDTO getFinishPositionDistribution(@RequestParam String lang) {
        return advancedStatsService.getFinishPositionDistribution(lang);
    }

    @GetMapping("/finish-vs-dnf-ratio")
    public ChartDataDTO getFinishVsDNFRatio(@RequestParam String lang) {
        return advancedStatsService.getFinishVsDNFRatio(lang);
    }

    @GetMapping("/sprint-vs-race-points")
    public ChartDataDTO getSprintVsRacePointsEvolution(@RequestParam String driverId, @RequestParam String lang) {
        return advancedStatsService.getSprintVsRacePointsEvolution(driverId, lang);
    }

    @GetMapping("/points-streaks")
    public ChartDataDTO getPointsStreaksPerDriver(@RequestParam String lang) {
        return advancedStatsService.getPointsStreaksPerDriver(lang);
    }


    @GetMapping("/grid-vs-result-delta")
    public ChartDataDTO getGridVsResultDeltaByConstructor(@RequestParam String lang) {
        return advancedStatsService.getGridVsResultDeltaByConstructor(lang);
    }

    @GetMapping("/reliability-by-season")
    public ChartDataDTO getReliabilityBySeason(@RequestParam String lang) {
        return advancedStatsService.getReliabilityBySeason(lang);
    }

    @GetMapping("/avg-race-duration")
    public ChartDataDTO getAverageRaceDurationPerSeason(@RequestParam String lang) {
        return advancedStatsService.getAverageRaceDurationPerSeason(lang);
    }

    @GetMapping("/fastest-pitstop-per-race")
    public ChartDataDTO getAvgFastestPitStopPerRace(@RequestParam String lang, @RequestParam("season") String season) {
        return advancedStatsService.getAvgFastestPitStopPerRace(lang, season);
    }

    @GetMapping("/race-leaders-per-gp")
    public ChartDataDTO getRaceLeadersPerGrandPrix(@RequestParam String lang, @RequestParam("season") String season) {
        return advancedStatsService.getRaceLeadersPerGrandPrix(lang, season);
    }

    @GetMapping("/q1-q3-delta-per-season")
    public ChartDataDTO getAvgQ1Q3DeltaBySeason(@RequestParam String lang) {
        return advancedStatsService.getAvgQ1Q3DeltaBySeason(lang);
    }

    @GetMapping("/qualifying-improvement")
    public ChartDataDTO getAvgQualiImprovement(@RequestParam String lang) {
        return advancedStatsService.getAvgQualiImprovement(lang);
    }

    @GetMapping("/caotic-race-performance")
    public ChartDataDTO getPerformanceInCrazyRaces(@RequestParam String lang) {
        return advancedStatsService.getPerformanceInCrazyRaces(lang); // Alias lógico
    }

    @GetMapping("/avg-fastest-lap-speed")
    public ChartDataDTO getAvgFastestLapSpeedPerSeason(@RequestParam String lang) {
        return advancedStatsService.getAvgFastestLapSpeedPerSeason(lang);
    }

    @GetMapping("/top-overtaking-races")
    public ChartDataDTO getTopOvertakingRaces(@RequestParam String lang) {
        return advancedStatsService.getTopOvertakingRaces(lang);
    }

    // 📈 Posiciones medias
    @GetMapping("/average-start-position")
    public ChartDataDTO getAverageStartPosition(@RequestParam String decade, @RequestParam String lang) {
        return advancedStatsService.getAverageStartPositionByDriver(decade, lang);
    }

    @GetMapping("/average-finish-position")
    public ChartDataDTO getAverageFinishPosition(@RequestParam String decade, @RequestParam String lang) {
        return advancedStatsService.getAverageFinishPositionByDriver(decade, lang);
    }

    @GetMapping("/performance-trajectory")
    public ChartDataDTO getDriverPerformanceTrajectory(@RequestParam String driverId, @RequestParam String lang) {
        return advancedStatsService.getDriverPerformanceTrajectory(driverId, lang);
    }

    // 🥇 Clasificación vs Carrera
    @GetMapping("/quali-race-delta-histogram")
    public ChartDataDTO getQualiToRaceDeltaHistogram(@RequestParam String lang) {
        return advancedStatsService.getQualiToRacePositionDeltaHistogram(lang);
    }

    @GetMapping("/quali-consistency")
    public ChartDataDTO getQualiConsistency(@RequestParam String lang) {
        return advancedStatsService.getQualiConsistencyScorePerDriver(lang);
    }

    @GetMapping("/poles-without-win")
    public ChartDataDTO getPolesWithoutWin(@RequestParam String lang) {
        return advancedStatsService.getDriversWithMostPolesWithoutWin(lang);
    }

    // 🔧 Fiabilidad
    @GetMapping("/technical-failures")
    public ChartDataDTO getTechnicalFailures(@RequestParam String lang) {
        return advancedStatsService.getTechnicalFailuresPerConstructor(lang);
    }

    @GetMapping("/retirement-cause-by-season")
    public ChartDataDTO getRetirementCauseBySeason(@RequestParam String lang) {
        return advancedStatsService.getMostCommonRetirementCauseBySeason(lang);
    }

    // 🏁 Pole / remontadas
    @GetMapping("/pole-conversion-rate")
    public ChartDataDTO getPoleConversionRate(@RequestParam String lang) {
        return advancedStatsService.getPerformanceWhenStartingOnPole(lang);
    }

    @GetMapping("/podiums-from-outside-top10")
    public ChartDataDTO getPodiumsOutsideTop10(@RequestParam String lang) {
        return advancedStatsService.getPodiumsFromOutsideTop10Start(lang);
    }

    // 🏟️ Circuitos
    @GetMapping("/best-drivers-per-circuit")
    public ChartDataDTO getBestDriversPerCircuit(@RequestParam String circuitRef, @RequestParam String lang) {
        return advancedStatsService.getBestDriversPerCircuit(circuitRef, lang);
    }

    @GetMapping("/constructor-dominance-circuit")
    public ChartDataDTO getConstructorDominanceByCircuit(@RequestParam String circuitRef, @RequestParam String lang) {
        return advancedStatsService.getConstructorDominanceByCircuit(circuitRef, lang);
    }

    // 📊 Mejora y decisiones de campeonato
    @GetMapping("/most-improved-drivers")
    public ChartDataDTO getMostImprovedDrivers(@RequestParam String decade, @RequestParam String lang) {
        return advancedStatsService.getMostImprovedDriversByDecade(decade, lang);
    }

    @GetMapping("/championships-decided-early")
    public ChartDataDTO getChampionshipsDecidedEarly(@RequestParam String lang) {
        return advancedStatsService.getChampionshipsDecidedBeforeLastGP(lang);
    }

    // 🧑‍🤝‍🧑 Comparativas de equipo
    @GetMapping("/teammate-wins-delta")
    public ChartDataDTO getTeammateWinsDelta(@RequestParam String driverId, @RequestParam String lang) {
        return advancedStatsService.getTeammateWinsDelta(driverId, lang);
    }

    @GetMapping("/teammate-podium-delta")
    public ChartDataDTO getTeammatePodiumDelta(@RequestParam String lang) {
        return advancedStatsService.getTeammatePodiumDelta(lang);
    }

    // 🧮 Eficiencia
    @GetMapping("/efficiency-rating")
    public ChartDataDTO getDriverEfficiencyRating(@RequestParam String lang) {
        return advancedStatsService.getDriverEfficiencyRating(lang);
    }


    @GetMapping("/constructor-performance-trajectory")
    public ChartDataDTO getConstructorPerformanceTrajectory(
            @RequestParam String constructorId,
            @RequestParam(defaultValue = "en") String lang
    ) {
        return advancedStatsService.getConstructorPerformanceTrajectory(constructorId, lang);
    }

    @GetMapping("/by-category")
    public Map<String, List<String>> getChartEndpointsByCategory(@RequestParam(defaultValue = "en") String lang) {
        Map<String, List<String>> categories = new LinkedHashMap<>();

        String drivers = lang.equals("es") ? "Pilotos" : "Drivers";
        String teams = lang.equals("es") ? "Constructores" : "Constructors";
        String races = lang.equals("es") ? "Carreras" : "Races";
        String circuits = lang.equals("es") ? "Circuitos" : "Circuits";

        categories.put(drivers, List.of(
                "podium-percentage-vs-teammate",
                "avg-positions-gained-first-laps",
                "driver-vs-team-championship-finish",
                "total-podium-percentage-vs-all-teammates",
                "distinct-grid-positions-winning",
                "finish-position-distribution",
                "finish-vs-dnf-ratio",
                "points-streaks",
                "qualifying-improvement",
                "quali-consistency",
                "poles-without-win",
                "efficiency-rating"
        ));

        categories.put(teams, List.of(
                "team-comebacks-by-season",
                "avg-team-points-by-season",
                "most-team-points",
                "wins-no-front-row",
                "grid-vs-result-delta",
                "reliability-by-season",
                "technical-failures"
        ));

        categories.put(races, List.of(
                "wins-from-3rd-or-worse",
                "podiums-from-3rd-or-worse",
                "average-accidents-by-season",
                "average-retirements-by-season",
                "avg-pitstops-per-season",
                "avg-overtakes-per-season",
                "quali-gap-1st-to-2nd-average",
                "quali-gap-1st-to-10th-average",
                "race-gap-1st-to-2nd-average",
                "front-row-wins-rate",
                "avg-race-duration",
                "q1-q3-delta-per-season",
                "avg-fastest-lap-speed",
                "top-overtaking-races",
                "pole-conversion-rate",
                "podiums-from-outside-top10",
                "retirement-cause-by-season",
                "quali-race-delta-histogram",
                "championships-decided-early"
        ));

        categories.put(circuits, List.of(
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
