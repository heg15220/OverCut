package com.overcut.f1hub.model.entities;

public interface DriverSeasonPerformanceView {
    Long getDriverId();
    String getForename();
    String getSurname();
    Integer getYear();
    Double getAvgPosition();
    Double getStddevPosition();
    Double getTotalPoints();
    Long getConstructorId();
    Long getTeamPoints();
    Integer getTeammateBattles();
    Integer getTeammateWins();
    Integer getDriverChampPos();
    Integer getConstructorChampPos();
    Integer getRaceCount();
    Integer getMaxPointsPerRace();
}
