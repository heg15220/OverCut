package overcut.rest.dtos;

public class F1AnagramsAttemptDto {

    private String guess;
    private int attemptOrder;
    private boolean correct;

    public F1AnagramsAttemptDto() {}

    public F1AnagramsAttemptDto(String guess, int attemptOrder, boolean correct) {
        this.guess = guess;
        this.attemptOrder = attemptOrder;
        this.correct = correct;
    }

    public String getGuess() { return guess; }
    public void setGuess(String guess) { this.guess = guess; }

    public int getAttemptOrder() { return attemptOrder; }
    public void setAttemptOrder(int attemptOrder) { this.attemptOrder = attemptOrder; }

    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }
}
