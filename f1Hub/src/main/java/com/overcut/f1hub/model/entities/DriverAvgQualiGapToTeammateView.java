package com.overcut.f1hub.model.entities;

public interface DriverAvgQualiGapToTeammateView {
    Long getDriverId();
    Long getConstructorId();
    Integer getYear();
    Double getAvgGapMs(); // (driver - teammate) en ms; negativo => mejor
}
