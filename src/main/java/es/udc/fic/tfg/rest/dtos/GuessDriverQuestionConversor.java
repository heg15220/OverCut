package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.GuessDriverQuestion;

public class GuessDriverQuestionConversor {

    private GuessDriverQuestionConversor(){
    }


    public static GuessDriverQuestionDto toDto(GuessDriverQuestion q) {
        GuessDriverQuestionDto dto = new GuessDriverQuestionDto();
        dto.setId(q.getId());
        dto.setCategory(q.getCategory());
        dto.setValueUser(q.getValueUser());
        dto.setCorrect(q.isCorrect());
        dto.setCreatedAt(q.getCreatedAt().toString());
        return dto;
    }

}
