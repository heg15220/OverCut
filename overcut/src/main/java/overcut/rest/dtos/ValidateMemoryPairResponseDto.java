package overcut.rest.dtos;

import java.util.List;

public class ValidateMemoryPairResponseDto {

    private boolean match;
    private int attemptsLeft;
    private boolean finished;
    private Boolean successful;
    private List<Long> matchedCardIds;

    public ValidateMemoryPairResponseDto() {}

    public boolean isMatch() { return match; }

    public void setMatch(boolean match) { this.match = match; }

    public int getAttemptsLeft() { return attemptsLeft; }

    public void setAttemptsLeft(int attemptsLeft) { this.attemptsLeft = attemptsLeft; }

    public boolean isFinished() { return finished; }

    public void setFinished(boolean finished) { this.finished = finished; }

    public Boolean getSuccessful() { return successful; }

    public void setSuccessful(Boolean successful) { this.successful = successful; }

    public List<Long> getMatchedCardIds() { return matchedCardIds; }

    public void setMatchedCardIds(List<Long> matchedCardIds) { this.matchedCardIds = matchedCardIds; }
}
