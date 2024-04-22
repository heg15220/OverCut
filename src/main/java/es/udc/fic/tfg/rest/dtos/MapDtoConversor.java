package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Answer;
import es.udc.fic.tfg.model.entities.Question;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static es.udc.fic.tfg.rest.dtos.QuestionConversor.convertToQuestionDto;

public class MapDtoConversor {

    private MapDtoConversor() {
    }

    public static final MapDto<QuestionDto, List<AnswerDto>> convertToDtoMap(Map<Question, List<Answer>> questionAnswerMap) {
        Map<QuestionDto, List<AnswerDto>> dtoMap = new HashMap<>();
        for (Map.Entry<Question, List<Answer>> entry : questionAnswerMap.entrySet()) {
            Question question = entry.getKey();
            List<Answer> answers = entry.getValue();

            // Suponiendo que tienes métodos para convertir Question y Answer a sus DTOs
            QuestionDto questionDto = convertToQuestionDto(question);
            List<AnswerDto> answerDtos = AnswerConversor.toAnswerDtos(answers);
            dtoMap.put(questionDto, answerDtos);
        }
        return new MapDto<>(dtoMap, false); // Asumiendo que no hay más elementos, ajusta según sea necesario
    }
}
