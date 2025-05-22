package overcut.rest.dtos;

import overcut.model.entities.PilotVictoryStats;

import java.util.List;
import java.util.stream.Collectors;

public class PilotVictoryStatsConversor {

    private PilotVictoryStatsConversor() {
    }

    public static final PilotVIctoryStatsDto toPilotVictoryStatsDto(PilotVictoryStats victoryStats) {
        return new PilotVIctoryStatsDto(victoryStats.getCircuitId(), victoryStats.getPilotName(),victoryStats.getVictories());
    }

    public static final List<PilotVIctoryStatsDto> toDriversVictoryStatsDtos(List<PilotVictoryStats> victoryStats) {
        return victoryStats.stream().map(PilotVictoryStatsConversor::toPilotVictoryStatsDto).collect(Collectors.toList());
    }
}
