package overcut.rest.dtos;

public class ValidateTeamHistoryGuessRequest {
    public Long gameId;
    public Integer seasonYear;
    public Integer guessPosition;

    public Long getGameId() {
        return gameId;
    }

    public void setGameId(Long gameId) {
        this.gameId = gameId;
    }

    public Integer getSeasonYear() {
        return seasonYear;
    }

    public void setSeasonYear(Integer seasonYear) {
        this.seasonYear = seasonYear;
    }

    public Integer getGuessPosition() {
        return guessPosition;
    }

    public void setGuessPosition(Integer guessPosition) {
        this.guessPosition = guessPosition;
    }
}
