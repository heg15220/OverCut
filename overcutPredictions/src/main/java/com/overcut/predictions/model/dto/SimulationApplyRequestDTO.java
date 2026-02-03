package com.overcut.predictions.model.dto;

import java.util.List;
import java.util.Map;

public class SimulationApplyRequestDTO {

    private Integer season;

    /**
     * Current accumulated standings BEFORE applying this race
     */
    private List<StandingsEntryDTO> driverStandings;
    private List<StandingsEntryDTO> constructorStandings;

    /**
     * Race simulation input
     */
    private SimulationRaceInputDTO race;

    /**
     * driverId -> constructorId mapping for THIS race
     * (frontend can reuse bootstrap info)
     */
    private Map<Long, Long> driverToConstructor;

    public Integer getSeason() {
        return season;
    }

    public void setSeason(Integer season) {
        this.season = season;
    }

    public List<StandingsEntryDTO> getDriverStandings() {
        return driverStandings;
    }

    public void setDriverStandings(List<StandingsEntryDTO> driverStandings) {
        this.driverStandings = driverStandings;
    }

    public List<StandingsEntryDTO> getConstructorStandings() {
        return constructorStandings;
    }

    public void setConstructorStandings(List<StandingsEntryDTO> constructorStandings) {
        this.constructorStandings = constructorStandings;
    }

    public SimulationRaceInputDTO getRace() {
        return race;
    }

    public void setRace(SimulationRaceInputDTO race) {
        this.race = race;
    }

    public Map<Long, Long> getDriverToConstructor() {
        return driverToConstructor;
    }

    public void setDriverToConstructor(Map<Long, Long> driverToConstructor) {
        this.driverToConstructor = driverToConstructor;
    }
}
