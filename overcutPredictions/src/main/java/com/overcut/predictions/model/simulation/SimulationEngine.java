package com.overcut.predictions.model.simulation;

import com.overcut.predictions.model.rules.PointsSystem;

import java.util.List;
import java.util.Map;

public class SimulationEngine {

    private final SimulationState state;
    private final PointsSystem pointsSystem;
    private final Map<Long, Long> driverToConstructor;

    /**
     * @param state initial standings
     * @param pointsSystem season points rules
     * @param driverToConstructor mapping for the simulated race
     */
    public SimulationEngine(
            SimulationState state,
            PointsSystem pointsSystem,
            Map<Long, Long> driverToConstructor
    ) {
        this.state = state;
        this.pointsSystem = pointsSystem;
        this.driverToConstructor = driverToConstructor;
    }

    /**
     * Apply a simulated race given an ordered driver list.
     */
    public void applyRace(List<Long> orderedDriverIds) {

        for (int i = 0; i < orderedDriverIds.size(); i++) {

            Long driverId = orderedDriverIds.get(i);
            int position = i + 1;

            int pts = pointsSystem.pointsForPosition(position);

            state.addDriverPoints(driverId, pts);

            Long constructorId = driverToConstructor.get(driverId);
            if (constructorId != null) {
                state.addConstructorPoints(constructorId, pts);
            }
        }
    }
}
