package es.udc.fic.tfg.rest.dtos;

public class GuessPilotRequestDto {
    private Long gameId;
    private String guess;

    public GuessPilotRequestDto(Long gameId, String guess) {
        this.gameId = gameId;
        this.guess = guess;
    }

    public Long getGameId() {
        return gameId;
    }

    public void setGameId(Long gameId) {
        this.gameId = gameId;
    }

    public String getGuess() {
        return guess;
    }

    public void setGuess(String guess) {
        this.guess = guess;
    }
}
