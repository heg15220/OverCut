package overcut.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class MemoryGame {

    private Long id;
    private LocalDateTime createdAt = LocalDateTime.now();

    private int rows;
    private int cols;

    private String mode;

    private int attemptsLeft;

    private boolean finished;

    private Boolean successful;

    private List<MemoryCard> cards = new ArrayList<>();

    public MemoryGame() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

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

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<MemoryCard> getCards() { return cards; }

    public void setCards(List<MemoryCard> cards) { this.cards = cards; }
}
