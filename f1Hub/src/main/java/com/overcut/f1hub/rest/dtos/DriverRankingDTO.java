package com.overcut.f1hub.rest.dtos;


public class DriverRankingDTO {
    private String driverName;
    private String nationality;
    private int value;
    private String flagUrl;
    private String extra; // ← nuevo campo opcional

    // Constructor actualizado
    public DriverRankingDTO(String driverName, String nationality, int value, String flagUrl, String extra) {
        this.driverName = driverName;
        this.nationality = nationality;
        this.value = value;
        this.flagUrl = flagUrl;
        this.extra = extra;
    }

    public DriverRankingDTO() {
    }

    public DriverRankingDTO(String driverName, String nationality, int value, String flagUrl) {
        this.driverName = driverName;
        this.nationality = nationality;
        this.value = value;
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

    public int getValue() {
        return value;
    }

    public void setValue(int value) {
        this.value = value;
    }

    public String getFlagUrl() {
        return flagUrl;
    }

    public void setFlagUrl(String flagUrl) {
        this.flagUrl = flagUrl;
    }

    public String getExtra() {
        return extra;
    }

    public void setExtra(String extra) {
        this.extra = extra;
    }
}
