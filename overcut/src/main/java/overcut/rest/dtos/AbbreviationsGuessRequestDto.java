package overcut.rest.dtos;

public class AbbreviationsGuessRequestDto {
    private Long gameId;
    private String guessText;

    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public String getGuessText() { return guessText; }
    public void setGuessText(String guessText) { this.guessText = guessText; }
}
