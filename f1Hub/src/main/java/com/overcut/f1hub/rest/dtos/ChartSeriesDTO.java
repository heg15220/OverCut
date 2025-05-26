package com.overcut.f1hub.rest.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class ChartSeriesDTO {
    private String label; // Nombre del piloto/equipo/país
    private String color; // Color único para la serie (si se usa un único color)
    private List<String> colors; // Lista de colores para segmentos (si se usan colores diferentes)
    private List<Double> data; // Valores por punto en el eje X

    public ChartSeriesDTO(String label, String color, List<Double> data) {
        this.label = label;
        this.color = color;
        this.data = data;
    }

    public ChartSeriesDTO(String label, List<String> colors, List<Double> data) {
        this.label = label;
        this.colors = colors;
        this.data = data;
    }
}
