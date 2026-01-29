// src/main/java/overcut/rest/dtos/ValidateSevenCluesGuessResponse.java
package overcut.rest.dtos;

public class ValidateSevenCluesGuessResponse {

    private boolean valid;
    private boolean roundSolved;
    private boolean gameFinished;

    private Integer nextRound; // null si terminó
    private String answer;     // solo si roundSolved o gameFinished (o si luego usas reveal)

    public ValidateSevenCluesGuessResponse() {}

    public ValidateSevenCluesGuessResponse(boolean valid,
                                           boolean roundSolved,
                                           boolean gameFinished,
                                           Integer nextRound,
                                           String answer) {
        this.valid = valid;
        this.roundSolved = roundSolved;
        this.gameFinished = gameFinished;
        this.nextRound = nextRound;
        this.answer = answer;
    }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public boolean isRoundSolved() { return roundSolved; }
    public void setRoundSolved(boolean roundSolved) { this.roundSolved = roundSolved; }

    public boolean isGameFinished() { return gameFinished; }
    public void setGameFinished(boolean gameFinished) { this.gameFinished = gameFinished; }

    public Integer getNextRound() { return nextRound; }
    public void setNextRound(Integer nextRound) { this.nextRound = nextRound; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
}
