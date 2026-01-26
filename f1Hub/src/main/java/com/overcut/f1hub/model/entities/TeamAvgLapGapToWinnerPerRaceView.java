package com.overcut.f1hub.model.entities;

public interface TeamAvgLapGapToWinnerPerRaceView {
    Long getRaceId();
    Integer getRound();
    String getRaceName();

    Long getConstructorId();
    String getConstructorRef();
    String getConstructorName();

    Double getAvgGapMsPerLap(); // gap medio al ganador POR VUELTA en ms
}