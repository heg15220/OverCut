package overcut.rest.dtos;

import java.util.List;

public class TowerGameDto {
    public Long id;
    public int attempts;
    public boolean finished;
    public boolean solved;
    public boolean hintAvailable; // attempts >= 15
    public boolean hintUsed;
    public String hintType;       // null si no hintUsed

    public List<TowerAttemptDto> history;

    public int getAttempts() {
        return attempts;
    }

    public void setAttempts(int attempts) {
        this.attempts = attempts;
    }

    public boolean isFinished() {
        return finished;
    }

    public void setFinished(boolean finished) {
        this.finished = finished;
    }

    public boolean isSolved() {
        return solved;
    }

    public void setSolved(boolean solved) {
        this.solved = solved;
    }

    public boolean isHintAvailable() {
        return hintAvailable;
    }

    public void setHintAvailable(boolean hintAvailable) {
        this.hintAvailable = hintAvailable;
    }

    public boolean isHintUsed() {
        return hintUsed;
    }

    public void setHintUsed(boolean hintUsed) {
        this.hintUsed = hintUsed;
    }

    public String getHintType() {
        return hintType;
    }

    public void setHintType(String hintType) {
        this.hintType = hintType;
    }

    public List<TowerAttemptDto> getHistory() {
        return history;
    }

    public void setHistory(List<TowerAttemptDto> history) {
        this.history = history;
    }
}
