package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Question;

public class AnswerDto {
    private Long id;
    private String name;
    private boolean correct;
    private Long questionId;

    public AnswerDto(Long id, String name, boolean correct, Long questionId) {
        this.id = id;
        this.name = name;
        this.correct = correct;
        this.questionId = questionId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }
}
