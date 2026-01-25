package overcut.rest.dtos;

import java.time.LocalDateTime;
import java.util.List;

public class WhoIsWhoGameDto {
    private Long id;
    private LocalDateTime createdAt;

    private boolean finished;
    private boolean won;

    private int hintsShown;
    private int maxHints;

    private int attemptsUsed;
    private int maxAttempts;

    private List<WhoIsWhoHintDto> revealedHints;
    private String answer;

    public WhoIsWhoGameDto() {}

    // ✅ ESTE constructor coincide con tu conversor (10 params, mismo orden)
    public WhoIsWhoGameDto(Long id, LocalDateTime createdAt, boolean finished, boolean won,
                           int hintsShown, int maxHints, int attemptsUsed, int maxAttempts,
                           List<WhoIsWhoHintDto> revealedHints, String answer) {
        this.id = id;
        this.createdAt = createdAt;
        this.finished = finished;
        this.won = won;
        this.hintsShown = hintsShown;
        this.maxHints = maxHints;
        this.attemptsUsed = attemptsUsed;
        this.maxAttempts = maxAttempts;
        this.revealedHints = revealedHints;
        this.answer = answer;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public boolean isWon() { return won; }
    public void setWon(boolean won) { this.won = won; }

    public int getHintsShown() { return hintsShown; }
    public void setHintsShown(int hintsShown) { this.hintsShown = hintsShown; }

    public int getMaxHints() { return maxHints; }
    public void setMaxHints(int maxHints) { this.maxHints = maxHints; }

    public int getAttemptsUsed() { return attemptsUsed; }
    public void setAttemptsUsed(int attemptsUsed) { this.attemptsUsed = attemptsUsed; }

    public int getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }

    public List<WhoIsWhoHintDto> getRevealedHints() { return revealedHints; }
    public void setRevealedHints(List<WhoIsWhoHintDto> revealedHints) { this.revealedHints = revealedHints; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
}
