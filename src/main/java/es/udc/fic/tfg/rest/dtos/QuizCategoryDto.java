package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.QuizCategoryCode;
import es.udc.fic.tfg.model.entities.QuizType;

public class QuizCategoryDto {
    private Long id;


    private QuizCategoryCode code;


    private QuizTypeDto quizType;


    public QuizCategoryDto(Long id, QuizCategoryCode code, QuizTypeDto quizType) {
        this.id = id;
        this.code = code;
        this.quizType = quizType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public QuizCategoryCode getCode() {
        return code;
    }

    public void setCode(QuizCategoryCode code) {
        this.code = code;
    }

    public QuizTypeDto getQuizType() {
        return quizType;
    }

    public void setQuizType(QuizTypeDto quizType) {
        this.quizType = quizType;
    }

}
