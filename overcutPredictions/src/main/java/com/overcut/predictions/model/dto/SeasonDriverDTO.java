package com.overcut.predictions.model.dto;

public class SeasonDriverDTO {
    private Long driverId;
    private Long constructorId; // opcional pero útil para UI
    private String driverName;
    private String constructorName;

    public SeasonDriverDTO() {}

    public SeasonDriverDTO(Long driverId, Long constructorId, String driverName, String constructorName) {
        this.driverId = driverId;
        this.constructorId = constructorId;
        this.driverName = driverName;
        this.constructorName = constructorName;
    }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public Long getConstructorId() { return constructorId; }
    public void setConstructorId(Long constructorId) { this.constructorId = constructorId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public String getConstructorName() { return constructorName; }
    public void setConstructorName(String constructorName) { this.constructorName = constructorName; }
}
