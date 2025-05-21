package es.udc.fic.tfg.rest.dtos;

import java.util.Map;

public class SubmitCategoryAnswersDto {
    private Long gameId;
    private Map<String, String> answers;

    public SubmitCategoryAnswersDto() {}

    public SubmitCategoryAnswersDto(Long gameId, Map<String, String> answers) {
        this.gameId = gameId;
        this.answers = answers;
    }

    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public Map<String, String> getAnswers() { return answers; }
    public void setAnswers(Map<String, String> answers) { this.answers = answers; }
}
