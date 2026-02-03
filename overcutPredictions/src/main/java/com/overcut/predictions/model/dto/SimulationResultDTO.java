package com.overcut.predictions.model.dto;

import java.util.List;

public class SimulationResultDTO {

    private List<StandingsEntryDTO> driverStandings;
    private List<StandingsEntryDTO> constructorStandings;

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
