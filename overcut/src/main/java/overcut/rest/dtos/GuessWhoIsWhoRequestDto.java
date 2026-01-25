package overcut.rest.dtos;

public class GuessWhoIsWhoRequestDto {
    private Long gameId;
    private String guess;

    public GuessWhoIsWhoRequestDto() {}

    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public String getGuess() { return guess; }
    public void setGuess(String guess) { this.guess = guess; }
}
