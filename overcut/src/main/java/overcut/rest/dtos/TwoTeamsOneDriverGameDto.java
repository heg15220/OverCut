package overcut.rest.dtos;

import java.time.LocalDateTime;
import java.util.List;

public class TwoTeamsOneDriverGameDto {
    private Long id;
    private LocalDateTime createdAt;
    private int currentPairIndex;
    private boolean finished;
    private int correctAnswers;
    private List<TwoTeamsOneDriverPairDto> pairs;

    public TwoTeamsOneDriverGameDto() {
    }

    public TwoTeamsOneDriverGameDto(Long id, LocalDateTime createdAt, int currentPairIndex, boolean finished,
                                    int correctAnswers, List<TwoTeamsOneDriverPairDto> pairs) {
        this.id = id;
        this.createdAt = createdAt;
        this.currentPairIndex = currentPairIndex;
        this.finished = finished;
        this.correctAnswers = correctAnswers;
        this.pairs = pairs;
    }

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

    public List<TwoTeamsOneDriverPairDto> getPairs() {
        return pairs;
    }

    public void setPairs(List<TwoTeamsOneDriverPairDto> pairs) {
        this.pairs = pairs;
    }
}
