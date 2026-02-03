package com.overcut.predictions.model.simulation;

import java.util.HashMap;
import java.util.Map;

public class SimulationState {

    private final Map<Long, Integer> driverPoints = new HashMap<>();
    private final Map<Long, Integer> constructorPoints = new HashMap<>();

    public Map<Long, Integer> getDriverPoints() {
        return driverPoints;
    }

    public Map<Long, Integer> getConstructorPoints() {
        return constructorPoints;
    }

    public void addDriverPoints(Long driverId, int points) {
        driverPoints.merge(driverId, points, Integer::sum);
    }

    public void addConstructorPoints(Long constructorId, int points) {
        constructorPoints.merge(constructorId, points, Integer::sum);
    }
}
