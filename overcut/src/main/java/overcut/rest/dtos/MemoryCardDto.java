package overcut.rest.dtos;

public class MemoryCardDto {

    private Long id;
    private int positionIndex;
    private String cardType;
    private String label;
    private boolean matched;

    public MemoryCardDto() {}

    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public int getPositionIndex() { return positionIndex; }

    public void setPositionIndex(int positionIndex) { this.positionIndex = positionIndex; }

    public String getCardType() { return cardType; }

    public void setCardType(String cardType) { this.cardType = cardType; }

    public String getLabel() { return label; }

    public void setLabel(String label) { this.label = label; }

    public boolean isMatched() { return matched; }

    public void setMatched(boolean matched) { this.matched = matched; }
}
