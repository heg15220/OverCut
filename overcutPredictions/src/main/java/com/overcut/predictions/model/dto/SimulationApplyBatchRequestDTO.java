package com.overcut.predictions.model.dto;

import java.util.List;
import java.util.Map;

public class SimulationApplyBatchRequestDTO {

    private Integer season;
    private Integer pointsEra;

    private List<StandingsEntryDTO> driverStandings;
    private List<StandingsEntryDTO> constructorStandings;

    /**
     * Ordered list of simulated races
     */
    private List<SimulationRaceInputDTO> races;

    /**
     * driverId -> constructorId mapping
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

    public List<SimulationRaceInputDTO> getRaces() {
        return races;
    }

    public void setRaces(List<SimulationRaceInputDTO> races) {
        this.races = races;
    }

    public Map<Long, Long> getDriverToConstructor() {
        return driverToConstructor;
    }

    public void setDriverToConstructor(Map<Long, Long> driverToConstructor) {
        this.driverToConstructor = driverToConstructor;
    }

    public Integer getPointsEra() {
        return pointsEra;
    }

    public void setPointsEra(Integer pointsEra) {
        this.pointsEra = pointsEra;
    }
}
