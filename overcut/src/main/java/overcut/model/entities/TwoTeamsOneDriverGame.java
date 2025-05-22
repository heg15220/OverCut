package overcut.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class TwoTeamsOneDriverGame {
    private Long id;
    private LocalDateTime createdAt = LocalDateTime.now();
    private int currentPairIndex = 0;
    private boolean finished = false;
    private int correctAnswers = 0;


    private List<TwoTeamsOneDriverPair> pairs = new ArrayList<>();

    public TwoTeamsOneDriverGame() {
    }

    public TwoTeamsOneDriverGame(LocalDateTime createdAt, int currentPairIndex, boolean finished,
                                 int correctAnswers, List<TwoTeamsOneDriverPair> pairs) {
        this.createdAt = createdAt;
        this.currentPairIndex = currentPairIndex;
        this.finished = finished;
        this.correctAnswers = correctAnswers;
        this.pairs = pairs;
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

    public int getCurrentPairIndex() {
        return currentPairIndex;
    }

    public void setCurrentPairIndex(int currentPairIndex) {
        this.currentPairIndex = currentPairIndex;
    }

    public boolean isFinished() {
        return finished;
    }

    public void setFinished(boolean finished) {
        this.finished = finished;
    }

    public int getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(int correctAnswers) {
        this.correctAnswers = correctAnswers;
    }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<TwoTeamsOneDriverPair> getPairs() {
        return pairs;
    }

    public void setPairs(List<TwoTeamsOneDriverPair> pairs) {
        this.pairs = pairs;
    }
}
