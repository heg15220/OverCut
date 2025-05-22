package overcut.rest.dtos;

public class GuessDriverRequestDto {
    private Long gameId;
    private String driverGuess;

    public GuessDriverRequestDto() {}

    public Long getGameId() {
        return gameId;
    }

    public void setGameId(Long gameId) {
        this.gameId = gameId;
    }

    public String getDriverGuess() {
        return driverGuess;
    }

    public void setDriverGuess(String driverGuess) {
        this.driverGuess = driverGuess;
    }
}
