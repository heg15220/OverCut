package overcut.rest.dtos;

public class DriverStatsSubmitRequestDto {
    private Long gameId;
    private DriverStatsAnswersDto answers;
    // getters/setters


    public Long getGameId() {
        return gameId;
    }

    public void setGameId(Long gameId) {
        this.gameId = gameId;
    }

    public DriverStatsAnswersDto getAnswers() {
        return answers;
    }

    public void setAnswers(DriverStatsAnswersDto answers) {
        this.answers = answers;
    }
}
