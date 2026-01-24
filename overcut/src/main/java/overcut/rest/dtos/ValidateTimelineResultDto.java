package overcut.rest.dtos;

import java.util.List;

public class ValidateTimelineResultDto {
    private boolean allCorrect;
    private List<Boolean> correctPositions; // true/false por índice
    private int attempts;
    private boolean finished;
    private TimelineGameRevealDto game;

    public ValidateTimelineResultDto() {}

    public ValidateTimelineResultDto(boolean allCorrect, List<Boolean> correctPositions, int attempts, boolean finished) {
        this.allCorrect = allCorrect;
        this.correctPositions = correctPositions;
        this.attempts = attempts;
        this.finished = finished;
    }

    public boolean isAllCorrect() { return allCorrect; }
    public void setAllCorrect(boolean allCorrect) { this.allCorrect = allCorrect; }

    public List<Boolean> getCorrectPositions() { return correctPositions; }
    public void setCorrectPositions(List<Boolean> correctPositions) { this.correctPositions = correctPositions; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public TimelineGameRevealDto getGame() {
        return game;
    }

    public void setGame(TimelineGameRevealDto game) {
        this.game = game;
    }
}
