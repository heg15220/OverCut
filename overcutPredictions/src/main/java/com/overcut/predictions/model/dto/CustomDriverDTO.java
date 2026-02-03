package com.overcut.predictions.model.dto;

public class CustomDriverDTO {
    private Long driverId;     // puede ser negativo
    private String name;

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
