package com.overcut.f1hub.model.entities;

public interface ConstructorSeasonPerformanceView {
    Integer getYear();
    Long getConstructorId();
    Double getAvgPosition();
    Double getStddevPosition();
    Double getTotalPoints();
    Integer getRaceCount();
    Integer getMaxPointsPerRace();
    Integer getConstructorChampPos();
}
