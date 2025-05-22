package overcut.rest.dtos;


import overcut.model.entities.OrderDriverGame;
import overcut.model.entities.OrderDriverSlot;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class OrderDriverGameConversor {

    private OrderDriverGameConversor() {}

    public static OrderDriverGameDto toDto(OrderDriverGame game) {
        List<OrderDriverSlotDto> slots = game.getSlots().stream()
                .sorted(Comparator.comparingInt(OrderDriverSlot::getCorrectOrder))
                .map(OrderDriverSlotConversor::toDto)
                .collect(Collectors.toList());

        return new OrderDriverGameDto(
                game.getId(),
                game.getTopic(),
                game.getCreatedAt(),
                game.isFinished(),
                game.getSuccessful(),
                slots
        );
    }
}
