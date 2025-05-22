package overcut.rest.dtos;

import overcut.model.entities.DriversLinkClue;
import overcut.model.entities.DriversLinkGame;

import java.util.Comparator;
import java.util.stream.Collectors;

public class DriversLinkGameConversor {

    private DriversLinkGameConversor() {}

    public static DriversLinkGameDto toDto(DriversLinkGame game) {
        DriversLinkGameDto dto = new DriversLinkGameDto();
        dto.setId(game.getId());
        dto.setDriverId(game.getDriverId());
        dto.setDriverName(game.getDriverName());
        dto.setCreatedAt(game.getCreatedAt());
        dto.setCurrentClueIndex(game.getCurrentClueIndex());
        dto.setFinished(game.isFinished());
        dto.setSuccessful(game.getSuccessful());
        dto.setClues(
                game.getClues().stream()
                        .sorted(Comparator.comparingInt(DriversLinkClue::getClueOrder))
                        .map(DriversLinkClueConversor::toDto)
                        .collect(Collectors.toList())
        );
        return dto;
    }
}

