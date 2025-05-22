package overcut.rest.dtos;

import java.util.List;

public class WordSearchSubmitRequestDto {
    private Long gameId;
    private List<String> foundSurnames;

    public WordSearchSubmitRequestDto() {}

    public WordSearchSubmitRequestDto(Long gameId, List<String> foundSurnames) {
        this.gameId = gameId;
        this.foundSurnames = foundSurnames;
    }

    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public List<String> getFoundSurnames() { return foundSurnames; }
    public void setFoundSurnames(List<String> foundSurnames) { this.foundSurnames = foundSurnames; }
}
