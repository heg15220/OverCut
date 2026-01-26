package com.overcut.f1hub.model.entities;

public interface TeamAvgQualiGapToPolePerRaceView2 {
    Long getConstructorId();
    String getConstructorName();
    String getConstructorRef();
    Integer getRaceId();        // opcional si lo tienes en la query
    Double getAvgQualiGapMs();  // gap medio (ms) vs pole
}
