package overcut.rest.dtos;

import overcut.model.entities.Top10QualiGame;
import overcut.model.entities.Top10QualiSlot;

import java.util.List;
import java.util.stream.Collectors;

public class Top10QualiGameDtoConversor {

    public static Top10QualiGameBoardDto toBoard(Top10QualiGame game, List<Top10QualiSlot> slots) {
        List<QualiSlotDto> grid = slots.stream()
                .map(s -> new QualiSlotDto(
                        s.getPositionGame(),
                        s.getNationalityCode(),
                        s.getFilledByPilotName(),
                        s.getQualiTime()
                ))
                .collect(Collectors.toList());

        return new Top10QualiGameBoardDto(
                game.getId(),
                game.getSeasonYear(),
                game.getRaceName(),
                game.getSessionUsed(),
                grid
        );
    }
}
