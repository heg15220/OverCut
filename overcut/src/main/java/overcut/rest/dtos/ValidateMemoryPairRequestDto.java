package overcut.rest.dtos;

public class ValidateMemoryPairRequestDto {

    private Long gameId;
    private Long firstCardId;
    private Long secondCardId;

    public ValidateMemoryPairRequestDto() {}

    public Long getGameId() { return gameId; }

    public void setGameId(Long gameId) { this.gameId = gameId; }

    public Long getFirstCardId() { return firstCardId; }

    public void setFirstCardId(Long firstCardId) { this.firstCardId = firstCardId; }

    public Long getSecondCardId() { return secondCardId; }

    public void setSecondCardId(Long secondCardId) { this.secondCardId = secondCardId; }
}
