package com.overcut.f1hub.rest.controllers;


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

}
