package overcut.rest.dtos;


import overcut.model.entities.OrderDriverSlot;

public class OrderDriverSlotConversor {

    private OrderDriverSlotConversor() {}

    public static OrderDriverSlotDto toDto(OrderDriverSlot slot) {
        return new OrderDriverSlotDto(slot.getId(), slot.getDriverId(), slot.getDriverName(), slot.getCorrectOrder());

    }

}
