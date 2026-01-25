package overcut.rest.dtos;

public class WhoIsWhoGuessResponseDto {
    private boolean correct;
    private boolean finished;
    private boolean won;
    private int attemptsUsed;
    private int attemptsLeft;

    // ✅ nuevo
    private String answerFullName;

    public WhoIsWhoGuessResponseDto() {}

    public WhoIsWhoGuessResponseDto(boolean correct, boolean finished, boolean won,
                                    int attemptsUsed, int attemptsLeft, String answerFullName) {
        this.correct = correct;
        this.finished = finished;
        this.won = won;
        this.attemptsUsed = attemptsUsed;
        this.attemptsLeft = attemptsLeft;
        this.answerFullName = answerFullName;
    }

    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public boolean isWon() { return won; }
    public void setWon(boolean won) { this.won = won; }

    public int getAttemptsUsed() { return attemptsUsed; }
    public void setAttemptsUsed(int attemptsUsed) { this.attemptsUsed = attemptsUsed; }

    public int getAttemptsLeft() { return attemptsLeft; }
    public void setAttemptsLeft(int attemptsLeft) { this.attemptsLeft = attemptsLeft; }

    public String getAnswerFullName() { return answerFullName; }
    public void setAnswerFullName(String answerFullName) { this.answerFullName = answerFullName; }

}
