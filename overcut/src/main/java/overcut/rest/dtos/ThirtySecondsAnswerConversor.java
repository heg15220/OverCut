package overcut.rest.dtos;

import overcut.model.entities.ThirtySecondsAnswer;

public class ThirtySecondsAnswerConversor {
    public static ThirtySecondsAnswerDto toDto(ThirtySecondsAnswer a) {
        ThirtySecondsAnswerDto dto = new ThirtySecondsAnswerDto();
        dto.setAnswerText(a.getAnswerText());
        dto.setCorrect(a.isCorrect());
        dto.setAnswerOrder(a.getAnswerOrder());
        return dto;
    }
}
