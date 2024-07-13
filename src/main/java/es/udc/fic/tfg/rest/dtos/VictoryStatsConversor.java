package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Category;
import es.udc.fic.tfg.model.entities.VictoryStats;

import java.util.List;
import java.util.stream.Collectors;

public class VictoryStatsConversor {

    private VictoryStatsConversor(){

    }


    public static final VictoryStatsDto toVictoryStatsDto(VictoryStats victoryStats) {
        return new VictoryStatsDto(victoryStats.getCircuitId(), victoryStats.getCircuitName(),victoryStats.getTeamWinner(), victoryStats.getVictories());
    }

    public static final List<VictoryStatsDto> toVictoryStatsDtos(List<VictoryStats> victoryStats) {
        return victoryStats.stream().map(VictoryStatsConversor::toVictoryStatsDto).collect(Collectors.toList());
    }
}

