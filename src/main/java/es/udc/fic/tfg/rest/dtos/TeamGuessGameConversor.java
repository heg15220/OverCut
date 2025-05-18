package es.udc.fic.tfg.rest.dtos;


import es.udc.fic.tfg.model.entities.TeamGuessGame;
import es.udc.fic.tfg.model.entities.TeamGuessClue;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class TeamGuessGameConversor {

    private TeamGuessGameConversor() {}

    public static TeamGuessGameDto toDto(TeamGuessGame game) {
        List<TeamGuessClueDto> clueDtos = game.getClues().stream()
                .sorted(Comparator.comparingInt(TeamGuessClue::getClueOrder))
                .map(TeamGuessClueConversor::toDto)
                .collect(Collectors.toList());

        return new TeamGuessGameDto(
                game.getId(),
                game.getTeamId(),
                game.getTeamName(),
                game.getCreatedAt(),
                game.isFinished(),
                game.getSuccessful(),
                clueDtos
        );
    }
}

