package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class WordSearchGame {
    private Long id;
    private String theme;
    private LocalDateTime createdAt = LocalDateTime.now();
    private boolean finished = false;
    private Boolean successful;
    private List<WordSearchWord> words = new ArrayList<>();

    private List<WordSearchCell> cells = new ArrayList<>();

    public WordSearchGame() {
    }

    public WordSearchGame(String theme, LocalDateTime createdAt, boolean finished, Boolean successful,
                          List<WordSearchWord> words, List<WordSearchCell> cells) {
        this.theme = theme;
        this.createdAt = createdAt;
        this.finished = finished;
        this.successful = successful;
        this.words = words;
        this.cells = cells;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isFinished() {
        return finished;
    }

    public void setFinished(boolean finished) {
        this.finished = finished;
    }

    public Boolean getSuccessful() {
        return successful;
    }

    public void setSuccessful(Boolean successful) {
        this.successful = successful;
    }


    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<WordSearchWord> getWords() {
        return words;
    }

    public void setWords(List<WordSearchWord> words) {
        this.words = words;
    }


    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<WordSearchCell> getCells() {
        return cells;
    }

    public void setCells(List<WordSearchCell> cells) {
        this.cells = cells;
    }
}

