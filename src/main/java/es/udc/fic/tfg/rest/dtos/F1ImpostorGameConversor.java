package es.udc.fic.tfg.rest.dtos;


import es.udc.fic.tfg.model.entities.F1ImpostorGame;
import es.udc.fic.tfg.model.entities.F1ImpostorPilot;

import java.util.List;
import java.util.stream.Collectors;

public class F1ImpostorGameConversor {

    public static F1ImpostorGameDto toDto(F1ImpostorGame game) {
        List<F1ImpostorPilotDto> pilotDtos = game.getPilots().stream()
                .map(F1ImpostorPilotConversor::toDto)
                .collect(Collectors.toList());

        return new F1ImpostorGameDto(
                game.getId(),
                game.getCategory(),
                game.getThemeDescription(),
                game.isFinished(),
                game.getWon(),
                pilotDtos
        );
    }
}

