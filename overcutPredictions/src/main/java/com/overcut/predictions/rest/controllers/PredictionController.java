package com.overcut.predictions.rest.controllers;

import com.overcut.predictions.model.dto.PredictionBootstrapDTO;
import com.overcut.predictions.model.service.PredictionBootstrapService;

import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:8086")
@RestController
@RequestMapping("/api/predictions")
public class PredictionController {

    private final PredictionBootstrapService bootstrapService;

    public PredictionController(PredictionBootstrapService bootstrapService) {
        this.bootstrapService = bootstrapService;
    }

    /**
     * Bootstrap real championship state until (fromRound - 1)
     *
     * Example:
     * /api/predictions/bootstrap?season=2012&fromRound=6
     */
    @GetMapping("/bootstrap")
    public PredictionBootstrapDTO bootstrap(
            @RequestParam Integer season,
            @RequestParam Integer fromRound
    ) {
        return bootstrapService.bootstrapSeason(season, fromRound);
    }
}
