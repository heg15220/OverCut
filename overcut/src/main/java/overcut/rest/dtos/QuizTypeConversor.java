package overcut.rest.dtos;

import overcut.model.entities.QuizType;
import overcut.model.entities.QuizTypeCode;

import java.util.List;
import java.util.stream.Collectors;

public class QuizTypeConversor {
    private QuizTypeConversor() {
        // Constructor privado para evitar instanciación
    }

    /**
     * Convierte un objeto Question en un objeto QuestionDto.
     *
     * @param quizType el objeto Question a convertir
     * @return el objeto QuestionDto resultante
     */
    public static QuizTypeDto convertToQuizTypeDto(QuizType quizType) {
        // Extraer los datos necesarios del objeto Question
        Long id = quizType.getId();
        QuizTypeCode code = quizType.getCode();
        String imagePath = quizType.getImagePath();
        // Crear y devolver el objeto QuestionDto
        return new QuizTypeDto(id, code, imagePath);
    }

    public static final List<QuizTypeDto> toQuizTypeDtos(List<QuizType> quizTypes) {
        return quizTypes.stream().map(QuizTypeConversor::convertToQuizTypeDto).collect(Collectors.toList());
    }

}
