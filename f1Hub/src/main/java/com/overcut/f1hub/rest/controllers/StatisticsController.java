package com.overcut.f1hub.rest.controllers;


import com.overcut.f1hub.model.service.AdvancedStatsService;
import com.overcut.f1hub.model.service.StatisticsService;
import com.overcut.f1hub.rest.dtos.ConstructorStandingDTO;
import com.overcut.f1hub.rest.dtos.DriverRankingDTO;
import com.overcut.f1hub.rest.dtos.DriverStandingDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:8080")
@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    @Autowired
    private StatisticsService statisticsService;

    @Autowired
    private AdvancedStatsService advancedStatsService;

    @GetMapping("/drivers/year/{year}")
    public List<DriverStandingDTO> getDriverStandings(@PathVariable int year) {
        return statisticsService.getDriverStandings(year);
    }

    @GetMapping("/constructors/year/{year}")
    public List<ConstructorStandingDTO> getConstructorStandings(@PathVariable int year) {
        return statisticsService.getConstructorStandings(year);
    }

    @GetMapping("/drivers/wins")
    public List<DriverRankingDTO> getDriverWinRanking() {
        return statisticsService.getDriverWinRanking();
    }

    @GetMapping("/drivers/podiums")
    public List<DriverRankingDTO> getDriverPodiumRanking() {
        return statisticsService.getDriverPodiumRanking();
    }

    @GetMapping("/drivers/poles")
    public List<DriverRankingDTO> getDriverPoleRanking() {
        return statisticsService.getDriverPoleRanking();
    }

    @GetMapping("/drivers/grand-chelems")
    public List<DriverRankingDTO> getDriverGrandChelemRanking() {
        return statisticsService.getDriverGrandChelemRanking();
    }

    @GetMapping("/drivers/wins/team/{constructorRef}")
    public List<DriverRankingDTO> getDriverWinsByTeam(@PathVariable String constructorRef) {
        return statisticsService.getDriverWinsByTeam(constructorRef);
    }

    @GetMapping("/drivers/podiums/team/{constructorRef}")
    public List<DriverRankingDTO> getDriverPodiumsByTeam(@PathVariable String constructorRef) {
        return statisticsService.getDriverPodiumsByTeam(constructorRef);
    }

    @GetMapping("/drivers/poles/team/{constructorRef}")
    public List<DriverRankingDTO> getDriverPolesByTeamSince2003(@PathVariable String constructorRef) {
        return statisticsService.getDriverPolesByTeamSince2003(constructorRef);
    }

    @GetMapping("/drivers/championships/by-count")
    public List<DriverRankingDTO> getWorldChampionsByTitleCount() {
        return statisticsService.getWorldChampionsByTitleCount();
    }

    @GetMapping("/drivers/championships/chronological")
    public List<DriverRankingDTO> getWorldChampionsChronologically() {
        return statisticsService.getWorldChampionsChronologically();
    }

    @GetMapping("/drivers/championships/by-age")
    public List<DriverRankingDTO> getChampionsByYoungestAge() {
        return statisticsService.getChampionsByYoungestAge();
    }

    @GetMapping("/drivers/championships/consecutive")
    public List<DriverRankingDTO> getConsecutiveTitles() {
        return statisticsService.getConsecutiveTitles();
    }

    @GetMapping("/drivers/championships/longest-gap")
    public List<DriverRankingDTO> getLongestIntervalBetweenTitles() {
        return statisticsService.getLongestIntervalBetweenTitles();
    }

    @GetMapping("/drivers/championships/gps-before-title")
    public List<DriverRankingDTO> getGpCountBeforeFirstTitle() {
        return statisticsService.getGpCountBeforeFirstTitle();
    }

    @GetMapping("/drivers/championships/by-constructors")
    public List<DriverRankingDTO> getChampionsByConstructorVariety() {
        return statisticsService.getTitleCountByDriverAndConstructorVariety();
    }

    // VICTORIES

    @GetMapping("/victories/by-driver/chronology")
    public List<DriverRankingDTO> getDriverWinsChronologically() {
        return statisticsService.getDriverWinsChronologically();
    }

    @GetMapping("/victories/by-team/chronology")
    public List<DriverRankingDTO> getTeamWinsChronologically() {
        return statisticsService.getTeamWinsChronologically();
    }

    @GetMapping("/victories/youngest")
    public List<DriverRankingDTO> getYoungestDriversAtFirstWin() {
        return statisticsService.getYoungestDriversAtFirstWin();
    }

    @GetMapping("/victories/oldest")
    public List<DriverRankingDTO> getOldestDriversToWin() {
        return statisticsService.getOldestDriversToWin();
    }

    @GetMapping("/victories/on-birthday")
    public List<DriverRankingDTO> getWinsOnBirthday() {
        return statisticsService.getWinsOnBirthday();
    }

    // RECORDS – VICTORIES: Rachas y temporadas

    @GetMapping("/victories/streaks/consecutive")
    public List<DriverRankingDTO> getLongestConsecutiveWinStreaks() {
        return statisticsService.getLongestConsecutiveWinStreaks();
    }

    @GetMapping("/victories/streaks/start-season")
    public List<DriverRankingDTO> getLongestSeasonStartWinStreaks() {
        return statisticsService.getLongestSeasonStartWinStreaks();
    }

    @GetMapping("/victories/last")
    public List<DriverRankingDTO> getLastCareerWinPerDriver() {
        return statisticsService.getLastCareerWinPerDriver();
    }

    @GetMapping("/victories/gap-between-wins")
    public List<DriverRankingDTO> getBiggestGapBetweenWins() {
        return statisticsService.getBiggestGapBetweenWins();
    }

    @GetMapping("/victories/gap-first-last")
    public List<DriverRankingDTO> getGapBetweenFirstAndLastWin() {
        return statisticsService.getGapBetweenFirstAndLastWin();
    }

    @GetMapping("/victories/most-in-single-year")
    public List<DriverRankingDTO> getMostWinsInSingleYear() {
        return statisticsService.getMostWinsInSingleYear();
    }

    @GetMapping("/victories/most-winning-years")
    public List<DriverRankingDTO> getMostYearsWithWins() {
        return statisticsService.getMostYearsWithWins();
    }

    @GetMapping("/victories/most-consecutive-winning-years")
    public List<DriverRankingDTO> getMostConsecutiveWinningYears() {
        return statisticsService.getMostConsecutiveWinningYears();
    }

    @GetMapping("/victories/gps-before-first-win")
    public List<DriverRankingDTO> getGpCountBeforeFirstWin() {
        return statisticsService.getGpCountBeforeFirstWin();
    }

    @GetMapping("/wins/most-by-same-constructor")
    public List<DriverRankingDTO> getDriversWithMostWinsSameConstructor() {
        return statisticsService.getDriversWithMostWinsSameConstructor();
    }

    @GetMapping("/wins/most-constructors-with-wins")
    public List<DriverRankingDTO> getDriversWithMostConstructorsWithWins() {
        return statisticsService.getDriversWithMostConstructorsWithWins();
    }

    @GetMapping("/wins/by-grand-prix")
    public List<DriverRankingDTO> getWinsByGrandPrix() {
        return statisticsService.getWinsByGrandPrix();
    }

    @GetMapping("/wins/consecutive-by-grand-prix")
    public List<DriverRankingDTO> getConsecutiveWinsByGrandPrix() {
        return statisticsService.getConsecutiveWinsByGrandPrix();
    }

    @GetMapping("/wins/most-different-gps")
    public List<DriverRankingDTO> getDriversWithMostDifferentGPsWon() {
        return statisticsService.getDriversWithMostDifferentGPsWon();
    }

    @GetMapping("/wins/most-circuit-wins")
    public List<DriverRankingDTO> getDriversWithMostCircuitWins() {
        return statisticsService.getDriversWithMostCircuitWins();
    }

    @GetMapping("/wins/most-different-circuit-wins")
    public List<DriverRankingDTO> getDriversWithMostDifferentCircuitWins() {
        return statisticsService.getDriversWithMostDifferentCircuitWins();
    }

    @GetMapping("/wins/by-grid-position")
    public List<DriverRankingDTO> getWinsByStartingGridPosition() {
        return statisticsService.getWinsByStartingGridPosition();
    }

    @GetMapping("/wins/by-grid-variation")
    public List<DriverRankingDTO> getDriversWithMostGridPositionsWithWins() {
        return statisticsService.getDriversWithMostGridPositionsWithWins();
    }

    @GetMapping("/wins/home-gp")
    public List<DriverRankingDTO> getDriversWithHomeGPWins() {
        return statisticsService.getDriversWithHomeGPWins();
    }

    @GetMapping("/wins/no-laps-led")
    public List<DriverRankingDTO> getWinsWithoutLeadingAnyLap() {
        return statisticsService.getWinsWithoutLeadingAnyLap();
    }

    @GetMapping("/wins/without-pole")
    public List<DriverRankingDTO> getWinsWithoutPolePosition() {
        return statisticsService.getWinsWithoutPolePosition();
    }

    @GetMapping("/wins/with-fastest-lap")
    public List<DriverRankingDTO> getWinsWithFastestLap() {
        return statisticsService.getWinsWithFastestLap();
    }

    @GetMapping("/second-place")
    public List<DriverRankingDTO> getSecondPlacePodiums() {
        return statisticsService.getSecondPlacePodiums();
    }

    @GetMapping("/third-place")
    public List<DriverRankingDTO> getThirdPlacePodiums() {
        return statisticsService.getThirdPlacePodiums();
    }

    @GetMapping("/second-and-third-place")
    public List<DriverRankingDTO> getSecondAndThirdPlacePodiums() {
        return statisticsService.getSecondAndThirdPlacePodiums();
    }

    @GetMapping("/chronology")
    public List<DriverRankingDTO> getPodiumChronology() {
        return statisticsService.getPodiumChronology();
    }

    @GetMapping("/team-chronology")
    public List<DriverRankingDTO> getTeamPodiumChronology() {
        return statisticsService.getTeamPodiumChronology();
    }

    @GetMapping("/youngest")
    public List<DriverRankingDTO> getYoungestPodiumDrivers() {
        return statisticsService.getYoungestPodiumDrivers();
    }

    @GetMapping("/on-birthday")
    public List<DriverRankingDTO> getPodiumsOnBirthday() {
        return statisticsService.getPodiumsOnBirthday();
    }

    @GetMapping("/oldest-by-nationality")
    public List<DriverRankingDTO> getOldestPodiumDriversByNationality() {
        return statisticsService.getOldestPodiumDriversByNationality();
    }


    // Pódiums – Secuencias y frecuencia
    @GetMapping("/streaks")
    public List<DriverRankingDTO> getLongestPodiumStreaks() {
        return statisticsService.getLongestPodiumStreaks();
    }

    @GetMapping("/streaks/season-start")
    public List<DriverRankingDTO> getSeasonStartPodiumStreaks() {
        return statisticsService.getSeasonStartPodiumStreaks();
    }

    @GetMapping("/last")
    public List<DriverRankingDTO> getLastPodiumPerDriver() {
        return statisticsService.getLastPodiumPerDriver();
    }

    @GetMapping("/gap-between")
    public List<DriverRankingDTO> getBiggestGapBetweenPodiums() {
        return statisticsService.getBiggestGapBetweenPodiums();
    }

    @GetMapping("/gap-first-last")
    public List<DriverRankingDTO> getGapBetweenFirstAndLastPodium() {
        return statisticsService.getGapBetweenFirstAndLastPodium();
    }

    @GetMapping("/most-in-single-year")
    public List<DriverRankingDTO> getMostPodiumsInSingleYear() {
        return statisticsService.getMostPodiumsInSingleYear();
    }

    @GetMapping("/years-count")
    public List<DriverRankingDTO> getPodiumYearsCount() {
        return statisticsService.getPodiumYearsCount();
    }

    @GetMapping("/consecutive-years")
    public List<DriverRankingDTO> getConsecutivePodiumYears() {
        return statisticsService.getConsecutivePodiumYears();
    }

    @GetMapping("/gps-before-first")
    public List<DriverRankingDTO> getGpCountBeforeFirstPodium() {
        return statisticsService.getGpCountBeforeFirstPodium();
    }

    @GetMapping("/before-win")
    public List<DriverRankingDTO> getPodiumsBeforeFirstWin() {
        return statisticsService.getPodiumsBeforeFirstWin();
    }

    // Pódiums – Constructores
    @GetMapping("/single-constructor")
    public List<DriverRankingDTO> getPodiumsWithSingleConstructor() {
        return statisticsService.getPodiumsWithSingleConstructor();
    }

    @GetMapping("/no-wins")
    public List<DriverRankingDTO> getPodiumsWithNoWins() {
        return statisticsService.getPodiumsWithNoWins();
    }

    @GetMapping("/most-constructors")
    public List<DriverRankingDTO> getPodiumsWithMostConstructors() {
        return statisticsService.getPodiumsWithMostConstructors();
    }

    // Pódiums – GPs y Circuitos
    @GetMapping("/by-grand-prix")
    public List<DriverRankingDTO> getPodiumsByGrandPrix() {
        return statisticsService.getPodiumsByGrandPrix();
    }

    @GetMapping("/different-grand-prix")
    public List<DriverRankingDTO> getDriversWithMostDifferentGPsWithPodium() {
        return statisticsService.getDriversWithMostDifferentGPsWithPodium();
    }

    @GetMapping("/different-circuits")
    public List<DriverRankingDTO> getDriversWithMostDifferentCircuitsWithPodium() {
        return statisticsService.getDriversWithMostDifferentCircuitsWithPodium();
    }

    @GetMapping("/home-gp")
    public List<DriverRankingDTO> getPodiumsAtHomeGP() {
        return statisticsService.getPodiumsAtHomeGP();
    }







    @GetMapping("/constructor-options")
    public List<StatisticsService.ConstructorOption> getAllConstructors() {
        return statisticsService.getAllConstructors();
    }




}
