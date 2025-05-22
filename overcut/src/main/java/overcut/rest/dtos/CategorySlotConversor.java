package overcut.rest.dtos;

import overcut.model.entities.CategorySlot;

public class CategorySlotConversor {

    private CategorySlotConversor() {}

    public static CategorySlotDto toDto(CategorySlot slot) {
        return new CategorySlotDto(
                slot.getCategory(),
                slot.getAnswer(),
                slot.getValid()
        );
    }
}
