package overcut.rest.dtos;


import overcut.model.entities.DriversConnectionsCategory;
import overcut.model.entities.DriversConnectionsGame;

import java.util.stream.Collectors;

public class DriversConnectionsGameConversor {

    public static DriversConnectionsGameDto toDto(DriversConnectionsGame game) {
        return new DriversConnectionsGameDto(
                game.getId(),
                game.getCreatedAt(),
                game.isFinished(),
                game.getCategories().stream()
                        .map(DriversConnectionsGameConversor::toCategoryDto)
                        .collect(Collectors.toList())
        );
    }

    private static DriversConnectionsCategoryDto toCategoryDto(DriversConnectionsCategory category) {
        return new DriversConnectionsCategoryDto(
                category.getId(),
                category.getCategoryCode(),
                category.getCategoryDescription(),
                category.getPilots().stream()
                        .map(p -> new DriversConnectionsPilotDto(p.getId(), p.getDriverId(), p.getDriverName()))
                        .collect(Collectors.toList())
        );
    }
}

