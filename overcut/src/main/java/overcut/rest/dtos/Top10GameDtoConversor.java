package overcut.rest.dtos;

import overcut.model.entities.Top10Game;
import overcut.model.entities.Top10Slot;

import java.util.List;
import java.util.stream.Collectors;

public class Top10GameDtoConversor {

    public static Top10GameBoardDto toTop10GameBoardDto(Top10Game game, List<Top10Slot> slots) {
        List<GridSlotDto> grid = slots.stream()
                .map(s -> new GridSlotDto(
                        s.getPositionGame(),
                        s.getNationalityCode(),
                        s.getFilledByPilotName()))
                .collect(Collectors.toList());

        return new Top10GameBoardDto(
                game.getId(),
                game.getSeasonYear(),
                game.getRaceName(),
                grid
        );
    }
}

