package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.QuizCategory;
import es.udc.fic.tfg.model.entities.QuizCategoryCode;
import es.udc.fic.tfg.model.entities.QuizType;

import java.util.List;
import java.util.stream.Collectors;

public class QuizCategoryConversor {
    private QuizCategoryConversor() {
        // Constructor privado para evitar instanciación
    }

    /**
     * Convierte un objeto Question en un objeto QuestionDto.
     *
     * @param quizCategory el objeto Question a convertir
     * @return el objeto QuestionDto resultante
     */
    public static QuizCategoryDto convertToQuizCategoryDto(QuizCategory quizCategory) {
        Long id = quizCategory.getId();
        QuizCategoryCode code = quizCategory.getCode();
        QuizType quizType = quizCategory.getQuizType();

        QuizTypeDto quizTypeDto = new QuizTypeDto(
                quizType.getId(),
                quizType.getCode(),
                quizType.getImagePath()
        );

        return new QuizCategoryDto(id, code, quizTypeDto);
    }


    public static final List<QuizCategoryDto> toQuizCategoryDtos(List<QuizCategory> quizCategories) {
        return quizCategories.stream().map(QuizCategoryConversor::convertToQuizCategoryDto).collect(Collectors.toList());
    }

}
