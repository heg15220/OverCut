package com.overcut.f1hub.rest.dtos;


public class ConstructorStandingDTO {
    private String constructorName;
    private double totalPoints;
    private String teamColor;

    public ConstructorStandingDTO() {
    }

    public ConstructorStandingDTO(String constructorName, double totalPoints, String teamColor) {
        this.constructorName = constructorName;
        this.totalPoints = totalPoints;
        this.teamColor = teamColor;
    }

    public String getConstructorName() {
        return constructorName;
    }

    public void setConstructorName(String constructorName) {
        this.constructorName = constructorName;
    }

    public double getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(double totalPoints) {
        this.totalPoints = totalPoints;
    }

    public String getTeamColor() {
        return teamColor;
    }

    public void setTeamColor(String teamColor) {
        this.teamColor = teamColor;
    }
}
