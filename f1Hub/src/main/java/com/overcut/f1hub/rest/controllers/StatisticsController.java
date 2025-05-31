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


    @GetMapping("/constructor-options")
    public List<StatisticsService.ConstructorOption> getAllConstructors() {
        return statisticsService.getAllConstructors();
    }




}
