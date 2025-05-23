package com.overcut.f1hub.rest.dtos;

public class GrandPrixDTO {

    private Long raceId;
    private String name;
    private int round;
    private String circuitName;
    private String circuitCountry;
    private int year; // ✅ Añadido
    private String circuitCountryCode;


    public GrandPrixDTO(Long raceId, String name, int round, String circuitName, String circuitCountry) {
        this.raceId = raceId;
        this.name = name;
        this.round = round;
        this.circuitName = circuitName;
        this.circuitCountry = circuitCountry;
    }

    public GrandPrixDTO(Long raceId, String name, int round, String circuitName, String circuitCountry, int year) {
        this.raceId = raceId;
        this.name = name;
        this.round = round;
        this.circuitName = circuitName;
        this.circuitCountry = circuitCountry;
        this.year = year;
    }

    public GrandPrixDTO(Long raceId, String name, int round, String circuitName,
                        String circuitCountry, int year, String circuitCountryCode) {
        this.raceId = raceId;
        this.name = name;
        this.round = round;
        this.circuitName = circuitName;
        this.circuitCountry = circuitCountry;
        this.year = year;
        this.circuitCountryCode = circuitCountryCode;
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

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public String getCircuitCountryCode() {
        return circuitCountryCode;
    }

    public void setCircuitCountryCode(String circuitCountryCode) {
        this.circuitCountryCode = circuitCountryCode;
    }
}
