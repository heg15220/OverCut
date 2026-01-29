package overcut.rest.dtos;

import overcut.model.entities.ThirtySecondsGame;
import overcut.model.entities.ThirtySecondsAnswer;

import java.util.Comparator;
import java.util.stream.Collectors;

public class ThirtySecondsGameConversor {
    public static ThirtySecondsGameDto toDto(ThirtySecondsGame g) {
        ThirtySecondsGameDto dto = new ThirtySecondsGameDto();
        dto.setId(g.getId());
        dto.setCreatedAt(g.getCreatedAt());
        dto.setThemeType(g.getThemeType());
        dto.setThemeValue(g.getThemeValue());
        dto.setFinished(g.isFinished());
        dto.setCorrectAnswers(g.getCorrectAnswers());
        dto.setTotalSubmitted(g.getTotalSubmitted());

        dto.setAnswers(
                g.getAnswers().stream()
                        .sorted(Comparator.comparingInt(ThirtySecondsAnswer::getAnswerOrder))
                        .map(ThirtySecondsAnswerConversor::toDto)
                        .collect(Collectors.toList())
        );
        return dto;
    }
}
