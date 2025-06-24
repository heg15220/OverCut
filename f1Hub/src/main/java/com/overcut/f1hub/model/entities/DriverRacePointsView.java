package com.overcut.f1hub.model.entities;

import java.sql.Date;

public interface DriverRacePointsView {
    Long getDriverId();
    Date getRaceDate();
    Double getPoints();
}
