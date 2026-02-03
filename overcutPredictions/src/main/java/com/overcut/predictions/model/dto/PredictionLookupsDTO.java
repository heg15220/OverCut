package com.overcut.predictions.model.dto;

import java.util.Map;

public class PredictionLookupsDTO {

    // driverId -> "Fernando Alonso"
    private Map<Long, String> driverNames;

    // constructorId -> "Ferrari"
    private Map<Long, String> constructorNames;

    // round -> "Monaco Grand Prix"
    private Map<Integer, String> raceNamesByRound;

    public PredictionLookupsDTO() {}

    public Map<Long, String> getDriverNames() {
        return driverNames;
    }

    public void setDriverNames(Map<Long, String> driverNames) {
        this.driverNames = driverNames;
    }

    public Map<Long, String> getConstructorNames() {
        return constructorNames;
    }

    public void setConstructorNames(Map<Long, String> constructorNames) {
        this.constructorNames = constructorNames;
    }

    public Map<Integer, String> getRaceNamesByRound() {
        return raceNamesByRound;
    }

    public void setRaceNamesByRound(Map<Integer, String> raceNamesByRound) {
        this.raceNamesByRound = raceNamesByRound;
    }
}
