package com.overcut.predictions.model.dto;

import java.util.List;

public class PredictionBootstrapDTO {

    private Integer season;
    private Integer simulatedFromRound;

    private List<PredictionRaceDTO> completedRaces;
    private List<StandingsEntryDTO> driverStandings;
    private List<StandingsEntryDTO> constructorStandings;

    public Integer getSeason() {
        return season;
    }

    public void setSeason(Integer season) {
        this.season = season;
    }

    public Integer getSimulatedFromRound() {
        return simulatedFromRound;
    }

    public void setSimulatedFromRound(Integer simulatedFromRound) {
        this.simulatedFromRound = simulatedFromRound;
    }

    public List<PredictionRaceDTO> getCompletedRaces() {
        return completedRaces;
    }

    public void setCompletedRaces(List<PredictionRaceDTO> completedRaces) {
        this.completedRaces = completedRaces;
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
}
