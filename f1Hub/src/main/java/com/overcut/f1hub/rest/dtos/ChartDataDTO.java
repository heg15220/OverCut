package com.overcut.f1hub.rest.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChartDataDTO {
    private String title;
    private String chartType; // "bar", "line", "pie", "boxplot", etc.
    private List<String> labels; // Eje X o categorías
    private List<ChartSeriesDTO> datasets; // Serie(s) de datos con valores
}
