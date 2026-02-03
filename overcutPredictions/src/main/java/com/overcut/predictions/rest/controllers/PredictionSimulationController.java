package com.overcut.predictions.rest.controllers;

import com.overcut.predictions.model.dto.*;
import com.overcut.predictions.model.rules.PointsSystem;
import com.overcut.predictions.model.rules.PointsSystemFactory;
import com.overcut.predictions.model.service.PredictionSimulationService;
import com.overcut.predictions.model.simulation.SimulationState;

import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:8086")
@RestController
@RequestMapping("/api/predictions/simulate")
public class PredictionSimulationController {

    private final PredictionSimulationService simulationService;

    public PredictionSimulationController(
            PredictionSimulationService simulationService
    ) {
        this.simulationService = simulationService;
    }

    /**
     * Apply a simulated race on top of current standings
     */
    @PostMapping("/apply")
    public SimulationResultDTO applySimulation(
            @RequestBody SimulationApplyRequestDTO request
    ) {

        // 1️⃣ Rebuild state from frontend standings
        SimulationState state = new SimulationState();

        if (request.getDriverStandings() != null) {
            for (StandingsEntryDTO e : request.getDriverStandings()) {
                state.getDriverPoints()
                        .put(e.getEntityId(), e.getPoints());
            }
        }

        if (request.getConstructorStandings() != null) {
            for (StandingsEntryDTO e : request.getConstructorStandings()) {
                state.getConstructorPoints()
                        .put(e.getEntityId(), e.getPoints());
            }
        }

        // 2️⃣ Points system for the season
        PointsSystem pointsSystem =
                PointsSystemFactory.forSeason(
                        request.getSeason()
                );

        // 3️⃣ Apply simulation
        return simulationService.applySimulation(
                state,
                pointsSystem,
                request.getRace(),
                request.getDriverToConstructor()
        );
    }


    @PostMapping("/apply-batch")
    public SimulationResultDTO applySimulationBatch(
            @RequestBody SimulationApplyBatchRequestDTO request
    ) {

        // 1️⃣ Rebuild state
        SimulationState state = new SimulationState();

        if (request.getDriverStandings() != null) {
            for (StandingsEntryDTO e : request.getDriverStandings()) {
                state.getDriverPoints()
                        .put(e.getEntityId(), e.getPoints());
            }
        }

        if (request.getConstructorStandings() != null) {
            for (StandingsEntryDTO e : request.getConstructorStandings()) {
                state.getConstructorPoints()
                        .put(e.getEntityId(), e.getPoints());
            }
        }

        // 2️⃣ Points system
        PointsSystem pointsSystem =
                PointsSystemFactory.forSeason(
                        request.getSeason()
                );

        // 3️⃣ Apply batch
        return simulationService.applySimulationBatch(
                state,
                pointsSystem,
                request.getRaces(),
                request.getDriverToConstructor()
        );
    }

}
