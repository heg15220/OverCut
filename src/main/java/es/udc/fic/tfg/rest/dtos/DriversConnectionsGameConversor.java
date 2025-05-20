package es.udc.fic.tfg.rest.dtos;


import es.udc.fic.tfg.model.entities.DriversConnectionsCategory;
import es.udc.fic.tfg.model.entities.DriversConnectionsGame;

import java.util.List;
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

