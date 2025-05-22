package overcut.rest.dtos;

import overcut.model.entities.CareerPathClue;
import overcut.model.entities.CareerPathGame;

import java.util.Comparator;
import java.util.stream.Collectors;

public class CareerPathGameConversor {

    private CareerPathGameConversor() {}

    public static CareerPathGameDto toDto(CareerPathGame game) {
        CareerPathGameDto dto = new CareerPathGameDto();
        dto.setId(game.getId());
        dto.setDriverId(game.getDriverId());
        dto.setDriverName(game.getDriverName());
        dto.setCreatedAt(game.getCreatedAt());
        dto.setCurrentClueIndex(game.getCurrentClueIndex());
        dto.setFinished(game.isFinished());
        dto.setSuccessful(game.getSuccessful());
        dto.setClues(
                game.getClues().stream()
                        .sorted(Comparator.comparingInt(CareerPathClue::getClueOrder))
                        .map(CareerPathClueConversor::toDto)
                        .collect(Collectors.toList())
        );
        return dto;
    }
}
