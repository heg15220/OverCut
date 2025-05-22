package overcut.rest.dtos;

import overcut.model.entities.CategoryGame;

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
