package com.overcut.predictions.model.dto;

public class CustomConstructorDTO {
    private Long constructorId; // puede ser negativo
    private String name;

    public Long getConstructorId() { return constructorId; }
    public void setConstructorId(Long constructorId) { this.constructorId = constructorId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}

