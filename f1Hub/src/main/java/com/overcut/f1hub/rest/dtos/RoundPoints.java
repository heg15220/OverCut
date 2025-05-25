package com.overcut.f1hub.rest.dtos;

public class RoundPoints {
    private Double sprintPoints;
    private Double racePoints;
    private String status; // OK / DNF / DNS
    private Integer positionOrder; // NUEVO

    public RoundPoints() {}

    public RoundPoints(Double sprintPoints, Double racePoints, String status, Integer positionOrder) {
        this.sprintPoints = sprintPoints;
        this.racePoints = racePoints;
        this.status = status;
        this.positionOrder = positionOrder;
    }

    public Double getSprintPoints() { return sprintPoints; }
    public Double getRacePoints() { return racePoints; }
    public String getStatus() { return status; }
    public Integer getPositionOrder() { return positionOrder; }

    public String format() {
        return switch (status) {
            case "DNF", "DNS" -> status;
            case "OK" -> (sprintPoints > 0 || racePoints > 0)
                    ? String.format("%.0f + %.0f", sprintPoints, racePoints)
                    : "0";
            default -> "—";
        };
    }
}
