package es.udc.fic.tfg.rest.dtos;


public class GuessTeamRequestDto {
    private Long gameId;
    private String teamGuess;

    public GuessTeamRequestDto() {}

    public GuessTeamRequestDto(Long gameId, String teamGuess) {
        this.gameId = gameId;
        this.teamGuess = teamGuess;
    }

    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public String getTeamGuess() { return teamGuess; }
    public void setTeamGuess(String teamGuess) { this.teamGuess = teamGuess; }
}

