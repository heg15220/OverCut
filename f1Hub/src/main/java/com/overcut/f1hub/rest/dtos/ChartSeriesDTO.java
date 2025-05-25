package com.overcut.f1hub.rest.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChartSeriesDTO {
    private String label; // Nombre del piloto/equipo/país
    private String color; // Color en hexadecimal (por equipo/nacionalidad)
    private List<Double> data; // Valores por punto en el eje X
}
