package overcut.rest.dtos;

import java.util.List;

public class ThirtySecondsSubmitRequestDto {
    private Long gameId;
    private List<String> answers;

    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public List<String> getAnswers() { return answers; }
    public void setAnswers(List<String> answers) { this.answers = answers; }
}
