package overcut.rest.dtos;

public class HigherLowerGuessRequestDto {
    private Long gameId;
    private String direction; // higher|lower

    public HigherLowerGuessRequestDto() {}

    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }
}
