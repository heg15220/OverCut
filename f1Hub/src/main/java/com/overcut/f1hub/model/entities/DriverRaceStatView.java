package com.overcut.f1hub.model.entities;

public interface DriverRaceStatView {
    Long getDriverId();
    Long getConstructorId();
    Long getRaceId();
    Integer getYear();
    Integer getPositionOrder();
    Double getPoints();
}
