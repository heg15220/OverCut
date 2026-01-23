package overcut.rest.dtos;

import java.util.List;
public class F1AnagramsGameDto {
    private Long id;
    private boolean finished;
    private Boolean successful;

    private int currentRound;      // 0..5
    private int totalRounds;       // 6

    private List<F1AnagramsRoundDto> rounds;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public int getCurrentRound() {
        return currentRound;
    }

    public void setCurrentRound(int currentRound) {
        this.currentRound = currentRound;
    }

    public int getTotalRounds() {
        return totalRounds;
    }

    public void setTotalRounds(int totalRounds) {
        this.totalRounds = totalRounds;
    }

    public List<F1AnagramsRoundDto> getRounds() {
        return rounds;
    }

    public void setRounds(List<F1AnagramsRoundDto> rounds) {
        this.rounds = rounds;
    }
}
