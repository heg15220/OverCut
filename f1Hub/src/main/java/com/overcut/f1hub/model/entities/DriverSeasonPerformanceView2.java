package com.overcut.f1hub.model.entities;

public interface DriverSeasonPerformanceView2 {
    Long getDriverId();
    String getForename();
    String getSurname();

    Integer getYear();

    // actuales (si los quieres conservar)
    Double getAvgPosition();
    Double getStddevPosition();

    // ✅ NUEVO: solo carreras terminadas/clasificadas (positionOrder válido)
    Double getAvgFinishPosition();
    Double getStddevFinishPosition();

    Integer getRaceCount();
    Long getConstructorId();

    Integer getTeammateBattles();
    Integer getTeammateWins();

    Integer getPodiums();
    Integer getFinishes();
    Integer getGridSize();

    Double getTotalPoints();
    Double getTeamPoints();
    Integer getDriverChampPos();
    Integer getConstructorChampPos();
}
