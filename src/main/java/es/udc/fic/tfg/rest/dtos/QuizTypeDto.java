package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.QuizTypeCode;

public class QuizTypeDto {
    private Long id;

    private QuizTypeCode code;

    private String imagePath;

    public QuizTypeDto(Long id, QuizTypeCode code, String imagePath) {
        this.id = id;
        this.code = code;
        this.imagePath = imagePath;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public QuizTypeCode getCode() {
        return code;
    }

    public void setCode(QuizTypeCode code) {
        this.code = code;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }
}

