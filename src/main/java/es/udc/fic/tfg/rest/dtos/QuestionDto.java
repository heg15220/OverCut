package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Quiz;
import jakarta.persistence.Column;
import jakarta.persistence.Lob;

public class QuestionDto {
    private Long id;
    private String name;

    private byte[] imagePath;

    private int knowledgequestionlevel;
    private Long quizId;

    public QuestionDto(Long id, String name, byte[] imagePath, int knowledgequestionlevel, Long quizId) {
        this.id = id;
        this.name = name;
        this.imagePath = imagePath;
        this.knowledgequestionlevel = knowledgequestionlevel;
        this.quizId = quizId;
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

    public byte[] getImagePath() {
        return imagePath;
    }

    public void setImagePath(byte[] imagePath) {
        this.imagePath = imagePath;
    }

    public int getKnowledgequestionlevel() {
        return knowledgequestionlevel;
    }

    public void setKnowledgequestionlevel(int knowledgequestionlevel) {
        this.knowledgequestionlevel = knowledgequestionlevel;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }
}
