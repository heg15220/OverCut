package com.overcut.f1hub.rest.dtos;

public class DriverPerformanceBreakdownDTO {
    public int year;

    public double teamStrength01;
    public double expectedPosScore;

    public int gridSize;
    public double avgPos;
    public double posScore;

    public double stddevPos;
    public double consScore;

    public int teammateBattles;
    public int teammateWins;
    public double tmScore;

    public int raceCount;
    public int podiums;
    public double podiumRate;

    public int finishes;
    public double finishRate;

    public double residual;         // posScore - expectedPosScore
    public double residualScore01;  // residual mapped to [0..1]

    public double index01;
    public double index100;

    public String notes; // opcional para flags/debug

    public double avgQualiGapToTeammateSec;  // negativo => más rápido
    public double paceVsTeammate01;          // score 0..1

    public double tmResidualScore01; // score 0..1 (value-added vs teammate-based expectation)

    public double posScorePenalized;
    public double residualPenalized;
    public double residualScore01Penalized;


}
