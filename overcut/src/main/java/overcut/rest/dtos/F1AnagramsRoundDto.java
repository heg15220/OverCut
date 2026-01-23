package overcut.rest.dtos;

import java.util.List;

public class F1AnagramsRoundDto {
    private int roundOrder;
    private boolean finished;
    private Boolean successful;
    private String scrambled;
    private int length;
    private String surname; // solo si ronda terminada
    private List<F1AnagramsAttemptDto> attempts;


    public int getRoundOrder() {
        return roundOrder;
    }

    public void setRoundOrder(int roundOrder) {
        this.roundOrder = roundOrder;
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

    public String getScrambled() {
        return scrambled;
    }

    public void setScrambled(String scrambled) {
        this.scrambled = scrambled;
    }

    public int getLength() {
        return length;
    }

    public void setLength(int length) {
        this.length = length;
    }

    public String getSurname() {
        return surname;
    }

    public void setSurname(String surname) {
        this.surname = surname;
    }

    public List<F1AnagramsAttemptDto> getAttempts() {
        return attempts;
    }

    public void setAttempts(List<F1AnagramsAttemptDto> attempts) {
        this.attempts = attempts;
    }
}