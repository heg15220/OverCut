package es.udc.fic.tfg.rest.dtos;

public class WordSearchValidateRequestDto {
    private Long gameId;
    private String attemptedSurname;

    public WordSearchValidateRequestDto() {}

    public WordSearchValidateRequestDto(Long gameId, String attemptedSurname) {
        this.gameId = gameId;
        this.attemptedSurname = attemptedSurname;
    }

    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public String getAttemptedSurname() { return attemptedSurname; }
    public void setAttemptedSurname(String attemptedSurname) { this.attemptedSurname = attemptedSurname; }
}
