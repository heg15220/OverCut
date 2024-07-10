package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Quiz;
import jakarta.persistence.Column;
import jakarta.persistence.Lob;

public class QuestionDto {
    private Long id;
    private String name;

    private String imagePath;

    private int knowledgequestionlevel;

    public QuestionDto(Long id, String name, String imagePath, int knowledgequestionlevel) {
        this.id = id;
        this.name = name;
        this.imagePath = imagePath;
        this.knowledgequestionlevel = knowledgequestionlevel;
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

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public int getKnowledgequestionlevel() {
        return knowledgequestionlevel;
    }

    public void setKnowledgequestionlevel(int knowledgequestionlevel) {
        this.knowledgequestionlevel = knowledgequestionlevel;
    }
}
