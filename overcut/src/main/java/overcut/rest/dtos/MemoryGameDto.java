package overcut.rest.dtos;

import java.util.List;

public class MemoryGameDto {

    private Long id;
    private int rows;
    private int cols;
    private String mode;
    private int attemptsLeft;
    private boolean finished;
    private Boolean successful;

    private List<MemoryCardDto> cards;

    public MemoryGameDto() {}

    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public int getRows() { return rows; }

    public void setRows(int rows) { this.rows = rows; }

    public int getCols() { return cols; }

    public void setCols(int cols) { this.cols = cols; }

    public String getMode() { return mode; }

    public void setMode(String mode) { this.mode = mode; }

    public int getAttemptsLeft() { return attemptsLeft; }

    public void setAttemptsLeft(int attemptsLeft) { this.attemptsLeft = attemptsLeft; }

    public boolean isFinished() { return finished; }

    public void setFinished(boolean finished) { this.finished = finished; }

    public Boolean getSuccessful() { return successful; }

    public void setSuccessful(Boolean successful) { this.successful = successful; }

    public List<MemoryCardDto> getCards() { return cards; }

    public void setCards(List<MemoryCardDto> cards) { this.cards = cards; }
}
