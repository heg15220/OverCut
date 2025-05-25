package com.overcut.f1hub.rest.dtos;

public class RoundPoints {
    private Double sprintPoints;
    private Double racePoints;
    private String status; // "OK", "DNF", "DNS"

    public RoundPoints() {}

    public RoundPoints(Double sprintPoints, Double racePoints, String status) {
        this.sprintPoints = sprintPoints;
        this.racePoints = racePoints;
        this.status = status;
    }

    public Double getSprintPoints() {
        return sprintPoints;
    }

    public Double getRacePoints() {
        return racePoints;
    }

    public String getStatus() {
        return status;
    }

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
