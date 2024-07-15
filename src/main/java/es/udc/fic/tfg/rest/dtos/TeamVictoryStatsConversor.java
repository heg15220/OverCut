package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.TeamVictoryStats;
import es.udc.fic.tfg.model.entities.VictoryStats;

import java.util.List;
import java.util.stream.Collectors;

public class TeamVictoryStatsConversor {
    public TeamVictoryStatsConversor() {
    }

    public static final TeamVictoryStatsDto toTeamVictoryStatsDto(TeamVictoryStats teamVictoryStats) {
        return new TeamVictoryStatsDto(teamVictoryStats.getTeamName(),teamVictoryStats.getVictories());
    }


    public static final List<TeamVictoryStatsDto> toTeamsVictoryStatsDtos(List<TeamVictoryStats> victoryStats) {
        return victoryStats.stream().map(TeamVictoryStatsConversor::toTeamVictoryStatsDto).collect(Collectors.toList());
    }
}

