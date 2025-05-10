package es.udc.fic.tfg.rest.dtos;

public class AskQuestionRequestDto {
    private Long gameId;
    private String category;
    private String value;
    private String lang;

    public AskQuestionRequestDto(Long gameId, String category, String value, String lang) {
        this.gameId = gameId;
        this.category = category;
        this.value = value;
        this.lang = lang;
    }

    public Long getGameId() {
        return gameId;
    }

    public void setGameId(Long gameId) {
        this.gameId = gameId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getLang() {
        return lang;
    }

    public void setLang(String lang) {
        this.lang = lang;
    }
}
