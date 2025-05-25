package com.overcut.f1hub.rest.dtos;

import com.overcut.f1hub.model.entities.Circuit;

public class CircuitConverter {
    public static CircuitDTO toDTO(Circuit circuit) {
        CircuitDTO dto = new CircuitDTO();
        dto.setCircuitId(circuit.getCircuitId());
        dto.setName(circuit.getName());
        dto.setCountry(circuit.getCountry());
        dto.setLocation(circuit.getLocation());
        return dto;
    }
}
