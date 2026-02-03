package com.overcut.predictions.model.service;

import com.overcut.predictions.model.dto.*;
import com.overcut.predictions.model.rules.PointsSystem;
import com.overcut.predictions.model.simulation.*;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class PredictionSimulationService {

    /**
     * Applies a simulated race on top of an existing state.
     */
    public SimulationResultDTO applySimulation(
            SimulationState state,
            PointsSystem pointsSystem,
            SimulationRaceInputDTO input,
            Map<Long, Long> driverToConstructor
    ) {

        SimulationEngine engine =
                new SimulationEngine(
                        state,
                        pointsSystem,
                        driverToConstructor
                );

        engine.applyRace(input.getOrderedDriverIds());

        SimulationResultDTO result =
                new SimulationResultDTO();

        result.setDriverStandings(
                buildStandings(state.getDriverPoints())
        );
        result.setConstructorStandings(
                buildStandings(state.getConstructorPoints())
        );

        return result;
    }

    private List<StandingsEntryDTO> buildStandings(
            Map<Long, Integer> pointsMap
    ) {
        List<StandingsEntryDTO> list =
                new ArrayList<>();

        for (Map.Entry<Long, Integer> e : pointsMap.entrySet()) {
            list.add(new StandingsEntryDTO(
                    e.getKey(),
                    e.getValue()
            ));
        }

        list.sort(
                (a, b) -> b.getPoints().compareTo(a.getPoints())
        );

        return list;
    }

    public SimulationResultDTO applySimulationBatch(
            SimulationState state,
            PointsSystem pointsSystem,
            List<SimulationRaceInputDTO> races,
            Map<Long, Long> driverToConstructor
    ) {

        SimulationEngine engine =
                new SimulationEngine(
                        state,
                        pointsSystem,
                        driverToConstructor
                );

        for (SimulationRaceInputDTO race : races) {
            engine.applyRace(race.getOrderedDriverIds());
        }

        SimulationResultDTO result =
                new SimulationResultDTO();

        result.setDriverStandings(
                buildStandings(state.getDriverPoints())
        );
        result.setConstructorStandings(
                buildStandings(state.getConstructorPoints())
        );

        return result;
    }

}
