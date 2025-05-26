package com.overcut.f1hub.rest.dtos;

import com.overcut.f1hub.model.service.AdvancedStatsService;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class ChartFilterOptionsDTO {
    private List<AdvancedStatsService.DriverOption> drivers;
    private List<AdvancedStatsService.ConstructorOption> constructors;
    private List<Integer> seasons;
}
