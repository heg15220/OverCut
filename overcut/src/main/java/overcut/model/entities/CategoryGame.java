package overcut.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class CategoryGame {

    private Long id;
    private char letter;
    private LocalDateTime createdAt = LocalDateTime.now();
    private boolean finished = false;
    private List<CategorySlot> slots = new ArrayList<>();

    public CategoryGame() {
    }

    public CategoryGame(char letter, LocalDateTime createdAt, boolean finished, List<CategorySlot> slots) {
        this.letter = letter;
        this.createdAt = createdAt;
        this.finished = finished;
        this.slots = slots;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }

    public void setId(Long id) {
        this.id = id;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public char getLetter() { return letter; }
    public void setLetter(char letter) { this.letter = letter; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isFinished() { return finished; }

    public void setFinished(boolean finished) { this.finished = finished; }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    public List<CategorySlot> getSlots() { return slots; }

    public void setSlots(List<CategorySlot> slots) { this.slots = slots; }
}
