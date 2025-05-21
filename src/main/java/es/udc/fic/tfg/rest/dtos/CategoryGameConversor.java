package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.CategoryGame;
import es.udc.fic.tfg.model.entities.CategorySlot;

import java.util.List;
import java.util.stream.Collectors;

public class CategoryGameConversor {

    private CategoryGameConversor() {}

    public static CategoryGameDto toDto(CategoryGame game) {
        List<CategorySlotDto> slotDtos = game.getSlots().stream()
                .map(CategorySlotConversor::toDto)
                .collect(Collectors.toList());

        return new CategoryGameDto(
                game.getId(),
                game.getLetter(),
                game.isFinished(),
                slotDtos
        );
    }
}
