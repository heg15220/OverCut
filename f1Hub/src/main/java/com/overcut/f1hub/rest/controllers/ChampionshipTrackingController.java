package com.overcut.f1hub.rest.controllers;


import com.overcut.f1hub.model.service.ChampionshipTrackingService;
import com.overcut.f1hub.rest.dtos.ChampionshipTrackingDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:8083")
@RestController
@RequestMapping("/api/championship")
public class ChampionshipTrackingController {

    @Autowired
    private ChampionshipTrackingService championshipTrackingService;

    @GetMapping("/{year}")
    public List<ChampionshipTrackingDTO> getTrackingByYear(@PathVariable int year) {
        return championshipTrackingService.getChampionshipTracking(year);
    }
}
