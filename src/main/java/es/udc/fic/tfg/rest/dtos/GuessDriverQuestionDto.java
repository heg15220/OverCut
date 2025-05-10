package es.udc.fic.tfg.rest.dtos;

public class GuessDriverQuestionDto {
    private Long id;
    private String category;
    private String valueUser;
    private boolean isCorrect;
    private String createdAt;

    public GuessDriverQuestionDto() {
    }

    public GuessDriverQuestionDto(Long id, String category, String valueUser, boolean isCorrect, String createdAt) {
        this.id = id;
        this.category = category;
        this.valueUser = valueUser;
        this.isCorrect = isCorrect;
        this.createdAt = createdAt;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getValueUser() {
        return valueUser;
    }

    public void setValueUser(String valueUser) {
        this.valueUser = valueUser;
    }

    public boolean isCorrect() {
        return isCorrect;
    }

    public void setCorrect(boolean correct) {
        isCorrect = correct;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
