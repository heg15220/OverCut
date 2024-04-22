package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Answer;
import es.udc.fic.tfg.model.entities.Quiz;

import java.util.List;
import java.util.stream.Collectors;

public class AnswerConversor {
    private AnswerConversor() {
        // Constructor privado para evitar instanciación
    }

    /**
     * Convierte un objeto Answer en un objeto AnswerDto.
     *
     * @param answer el objeto Answer a convertir
     * @return el objeto AnswerDto resultante
     */
    public static AnswerDto convertToAnswerDto(Answer answer) {

        return new AnswerDto(answer.getId(), answer.getName(), answer.isCorrect(),answer.getQuestion().getId());
    }

    public static final List<AnswerDto> toAnswerDtos(List<Answer> answers) {
        return answers.stream().map(AnswerConversor::convertToAnswerDto).collect(Collectors.toList());

    }
}
