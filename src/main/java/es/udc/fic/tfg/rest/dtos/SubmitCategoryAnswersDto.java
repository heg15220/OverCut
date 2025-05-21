package es.udc.fic.tfg.rest.dtos;

import java.util.Map;

public class SubmitCategoryAnswersDto {
    private Long gameId;
    private Map<String, String> answers;
    private String lang;

    // Getters y setters
    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public Map<String, String> getAnswers() { return answers; }
    public void setAnswers(Map<String, String> answers) { this.answers = answers; }

    public String getLang() { return lang; }
    public void setLang(String lang) { this.lang = lang; }
}
