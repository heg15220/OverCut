package com.overcut.f1hub.rest.dtos;

public class QualifyingResultDTO {
    private int position;
    private String driverName;
    private String driverNationality;
    private String constructorName;
    private String q1;
    private String q2;
    private String q3;
    private String teamColor;
    private String driverFlagUrl;

    public QualifyingResultDTO(int position, String driverName, String driverNationality,
                               String constructorName, String q1, String q2, String q3,
                               String teamColor, String driverFlagUrl) {
        this.position = position;
        this.driverName = driverName;
        this.driverNationality = driverNationality;
        this.constructorName = constructorName;
        this.q1 = q1;
        this.q2 = q2;
        this.q3 = q3;
        this.teamColor = teamColor;
        this.driverFlagUrl = driverFlagUrl;
    }

    public QualifyingResultDTO() {
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

    public String getQ1() {
        return q1;
    }

    public void setQ1(String q1) {
        this.q1 = q1;
    }

    public String getQ2() {
        return q2;
    }

    public void setQ2(String q2) {
        this.q2 = q2;
    }

    public String getQ3() {
        return q3;
    }

    public void setQ3(String q3) {
        this.q3 = q3;
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
