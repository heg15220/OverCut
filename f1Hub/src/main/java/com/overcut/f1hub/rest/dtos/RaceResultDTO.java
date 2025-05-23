package com.overcut.f1hub.rest.dtos;

public class RaceResultDTO {
    private int position;
    private String driverName;
    private String driverNationality;
    private String constructorName;
    private int number;
    private int grid;
    private int laps;
    private String time;
    private double points;
    private String status;
    private String teamColor;
    private String driverFlagUrl;

    public RaceResultDTO(int position, String driverName, String driverNationality, String constructorName, int number,
                         int grid, int laps, String time, double points, String status, String teamColor, String driverFlagUrl) {
        this.position = position;
        this.driverName = driverName;
        this.driverNationality = driverNationality;
        this.constructorName = constructorName;
        this.number = number;
        this.grid = grid;
        this.laps = laps;
        this.time = time;
        this.points = points;
        this.status = status;
        this.teamColor = teamColor;
        this.driverFlagUrl = driverFlagUrl;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
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

    public String getConstructorName() {
        return constructorName;
    }

    public void setConstructorName(String constructorName) {
        this.constructorName = constructorName;
    }

    public int getNumber() {
        return number;
    }

    public void setNumber(int number) {
        this.number = number;
    }

    public int getGrid() {
        return grid;
    }

    public void setGrid(int grid) {
        this.grid = grid;
    }

    public int getLaps() {
        return laps;
    }

    public void setLaps(int laps) {
        this.laps = laps;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public double getPoints() {
        return points;
    }

    public void setPoints(double points) {
        this.points = points;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTeamColor() {
        return teamColor;
    }

    public void setTeamColor(String teamColor) {
        this.teamColor = teamColor;
    }

    public String getDriverFlagUrl() {
        return driverFlagUrl;
    }

    public void setDriverFlagUrl(String driverFlagUrl) {
        this.driverFlagUrl = driverFlagUrl;
    }
}
