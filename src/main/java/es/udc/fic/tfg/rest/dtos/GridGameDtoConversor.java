package es.udc.fic.tfg.rest.dtos;


import es.udc.fic.tfg.model.entities.GridGame;
import es.udc.fic.tfg.model.entities.GridSlot;
import es.udc.fic.tfg.rest.dtos.GridGameBoardDto;
import es.udc.fic.tfg.rest.dtos.GridGameDto;
import es.udc.fic.tfg.rest.dtos.GridSlotDto;

import java.util.List;
import java.util.stream.Collectors;

public class GridGameDtoConversor {

    public static GridGameDto toGridGameDto(GridGame game) {
        return new GridGameDto(game.getId(), game.getSeasonYear());
    }

    public static GridGameBoardDto toGridGameBoardDto(GridGame game, List<GridSlot> slots) {
        List<GridSlotDto> grid = slots.stream()
                .map(s -> new GridSlotDto(s.getPositionGame(), s.getNationalityCode(), s.getFilledByPilotId()))
                .collect(Collectors.toList());
        return new GridGameBoardDto(game.getId(), game.getSeasonYear(), grid);
    }
}

