package com.overcut.f1hub.rest.dtos;

import java.util.Map;

import java.util.LinkedHashMap;

public class ChampionshipTrackingDTO {
    private String driverName;
    private String driverNationality;
    private String flagUrl;
    private String driverCountryCode; // 🔧 NUEVO
    private int finalPosition;
    private Map<Integer, RoundPoints> roundPoints = new LinkedHashMap<>();

    public ChampionshipTrackingDTO() {}

    public ChampionshipTrackingDTO(String driverName, String driverNationality, String flagUrl, String driverCountryCode) {
        this.driverName = driverName;
        this.driverNationality = driverNationality;
        this.flagUrl = flagUrl;
        this.driverCountryCode = driverCountryCode;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getDriverNationality() {
        return driverNationality;
    }

    public void setDriverNationality(String driverNationality) {
        this.driverNationality = driverNationality;
    }

    public String getFlagUrl() {
        return flagUrl;
    }

    public void setFlagUrl(String flagUrl) {
        this.flagUrl = flagUrl;
    }

    public Map<Integer, RoundPoints> getRoundPoints() {
        return roundPoints;
    }

    public void setRoundPoints(Map<Integer, RoundPoints> roundPoints) {
        this.roundPoints = roundPoints;
    }

    public String getDriverCountryCode() {
        return driverCountryCode;
    }

    public void setDriverCountryCode(String driverCountryCode) {
        this.driverCountryCode = driverCountryCode;
    }

    public int getFinalPosition() {
        return finalPosition;
    }

    public void setFinalPosition(int finalPosition) {
        this.finalPosition = finalPosition;
    }
}
