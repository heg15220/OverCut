package com.overcut.f1hub.model.entities;

public interface TeamAvgQualiGapToPolePerRaceView {
    Long getRaceId();
    Integer getRound();
    String getRaceName();

    Long getConstructorId();
    String getConstructorRef();
    String getConstructorName();

    Double getAvgQualiGapMs(); // gap medio vs pole (ms)
}
