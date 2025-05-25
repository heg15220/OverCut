package com.overcut.f1hub.rest.dtos;


public class DriverStandingDTO {
    private String driverName;
    private String nationality;
    private String constructorName;
    private String teamColor;
    private double totalPoints;
    private String flagUrl;

    public DriverStandingDTO() {}

    public DriverStandingDTO(String driverName, String nationality, String constructorName,
                             String teamColor, double totalPoints, String flagUrl) {
        this.driverName = driverName;
        this.nationality = nationality;
        this.constructorName = constructorName;
        this.teamColor = teamColor;
        this.totalPoints = totalPoints;
        this.flagUrl = flagUrl;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public double getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(double totalPoints) {
        this.totalPoints = totalPoints;
    }

    public String getFlagUrl() {
        return flagUrl;
    }

    public void setFlagUrl(String flagUrl) {
        this.flagUrl = flagUrl;
    }

    public String getConstructorName() {
        return constructorName;
    }

    public void setConstructorName(String constructorName) {
        this.constructorName = constructorName;
    }

    public String getTeamColor() {
        return teamColor;
    }

    public void setTeamColor(String teamColor) {
        this.teamColor = teamColor;
    }
}
