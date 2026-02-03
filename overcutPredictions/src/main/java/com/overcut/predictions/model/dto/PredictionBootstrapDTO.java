package com.overcut.predictions.model.dto;

import java.util.List;
import java.util.Map;

public class PredictionBootstrapDTO {

    private Integer season;
    private Integer simulatedFromRound;

    private Integer totalRounds; // útil para dropdowns en UI

    private List<PredictionRaceDTO> completedRaces;
    private List<StandingsEntryDTO> driverStandings;
    private List<StandingsEntryDTO> constructorStandings;

    // ✅ Lookups para mostrar nombres en UI (driver/constructor/races)
    private PredictionLookupsDTO lookups;

    // ✅ mapping driverId -> constructorId (para sumar puntos por equipo al simular)
    private Map<Long, Long> driverToConstructor;

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

    public Integer getTotalRounds() {
        return totalRounds;
    }

    public void setTotalRounds(Integer totalRounds) {
        this.totalRounds = totalRounds;
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

    public PredictionLookupsDTO getLookups() {
        return lookups;
    }

    public void setLookups(PredictionLookupsDTO lookups) {
        this.lookups = lookups;
    }

    public Map<Long, Long> getDriverToConstructor() {
        return driverToConstructor;
    }

    public void setDriverToConstructor(Map<Long, Long> driverToConstructor) {
        this.driverToConstructor = driverToConstructor;
    }
}
