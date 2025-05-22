package overcut.rest.dtos;

import overcut.model.entities.GuessDriverQuestion;

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
        dto.setQuestion(q.getQuestion()); // ← Añade esta línea
        return dto;
    }


}
