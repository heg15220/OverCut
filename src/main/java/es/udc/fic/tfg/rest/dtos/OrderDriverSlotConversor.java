package es.udc.fic.tfg.rest.dtos;


import es.udc.fic.tfg.model.entities.OrderDriverSlot;

public class OrderDriverSlotConversor {

    private OrderDriverSlotConversor() {}

    public static OrderDriverSlotDto toDto(OrderDriverSlot slot) {
        return new OrderDriverSlotDto(slot.getId(), slot.getDriverId(), slot.getDriverName(), slot.getCorrectOrder());

    }

}
