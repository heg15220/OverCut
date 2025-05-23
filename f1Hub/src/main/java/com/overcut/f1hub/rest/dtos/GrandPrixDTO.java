package com.overcut.f1hub.rest.dtos;

public class GrandPrixDTO {

    private Long raceId;
    private String name;
    private int round;
    private String circuitName;
    private String circuitCountry;

    public GrandPrixDTO(Long raceId, String name, int round, String circuitName, String circuitCountry) {
        this.raceId = raceId;
        this.name = name;
        this.round = round;
        this.circuitName = circuitName;
        this.circuitCountry = circuitCountry;
    }

    public Long getRaceId() {
        return raceId;
    }

    public void setRaceId(Long raceId) {
        this.raceId = raceId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getRound() {
        return round;
    }

    public void setRound(int round) {
        this.round = round;
    }

    public String getCircuitName() {
        return circuitName;
    }

    public void setCircuitName(String circuitName) {
        this.circuitName = circuitName;
    }

    public String getCircuitCountry() {
        return circuitCountry;
    }

    public void setCircuitCountry(String circuitCountry) {
        this.circuitCountry = circuitCountry;
    }
}
