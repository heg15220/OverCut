package overcut.rest.dtos;


import overcut.model.entities.GridGame;
import overcut.model.entities.GridSlot;

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

