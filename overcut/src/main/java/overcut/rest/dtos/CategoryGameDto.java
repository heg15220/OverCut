package overcut.rest.dtos;

import java.util.List;

public class CategoryGameDto {
    private Long id;
    private char letter;
    private boolean finished;
    private List<CategorySlotDto> slots;

    public CategoryGameDto() {}

    public CategoryGameDto(Long id, char letter, boolean finished, List<CategorySlotDto> slots) {
        this.id = id;
        this.letter = letter;
        this.finished = finished;
        this.slots = slots;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public char getLetter() { return letter; }
    public void setLetter(char letter) { this.letter = letter; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public List<CategorySlotDto> getSlots() { return slots; }
    public void setSlots(List<CategorySlotDto> slots) { this.slots = slots; }
}
