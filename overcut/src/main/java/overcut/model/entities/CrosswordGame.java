package overcut.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
public class CrosswordGame {

    private Long id;

    private LocalDateTime createdAt = LocalDateTime.now();

    private int rows;

    private int cols;

    private List<CrosswordWord> words;

    public CrosswordGame() {
    }

    public CrosswordGame(LocalDateTime createdAt, int rows, int cols) {
        this.createdAt = createdAt;
        this.rows = rows;
        this.cols = cols;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public int getRows() {
        return rows;
    }

    public void setRows(int rows) {
        this.rows = rows;
    }

    public int getCols() {
        return cols;
    }

    public void setCols(int cols) {
        this.cols = cols;
    }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    public List<CrosswordWord> getWords() {
        return words;
    }

    public void setWords(List<CrosswordWord> words) {
        this.words = words;
    }
}
