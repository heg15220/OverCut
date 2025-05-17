package es.udc.fic.tfg.rest.dtos;

public class F1WordleAttemptDto {
    private String guess;
    private String feedback;
    private int attemptOrder;

    public F1WordleAttemptDto() {
    }

    public F1WordleAttemptDto(String guess, String feedback, int attemptOrder) {
        this.guess = guess;
        this.feedback = feedback;
        this.attemptOrder = attemptOrder;
    }

    public String getGuess() {
        return guess;
    }

    public void setGuess(String guess) {
        this.guess = guess;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public int getAttemptOrder() {
        return attemptOrder;
    }

    public void setAttemptOrder(int attemptOrder) {
        this.attemptOrder = attemptOrder;
    }
}
