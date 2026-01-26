package com.overcut.f1hub.model.entities;


public interface TeamAvgLapGapToWinnerPerRaceView2 {
    Long getConstructorId();
    String getConstructorName();
    String getConstructorRef();
    Integer getRaceId();          // opcional si lo tienes en la query
    Double getAvgGapMsPerLap();   // gap medio (ms/lap) vs ganador
}