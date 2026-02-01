package overcut.rest.dtos;

import overcut.model.entities.AbbreviationsAnswer;
import overcut.model.entities.AbbreviationsGame;

import java.util.Comparator;
import java.util.stream.Collectors;

public class AbbreviationsGameConversor {

    public static AbbreviationsGameDto toDto(AbbreviationsGame g) {
        AbbreviationsGameDto dto = new AbbreviationsGameDto();
        dto.setId(g.getId());
        dto.setCreatedAt(g.getCreatedAt());
        dto.setFinished(g.isFinished());
        dto.setCorrectAnswers(g.getCorrectAnswers());
        dto.setTotalSubmitted(g.getTotalSubmitted());

        dto.setAnswers(
                g.getAnswers().stream()
                        .sorted(Comparator.comparingInt(AbbreviationsAnswer::getAnswerOrder))
                        .map(a -> {
                            AbbreviationsAnswerDto ad = new AbbreviationsAnswerDto();
                            ad.setAbbr(a.getAbbr());
                            ad.setSolved(a.isSolved());
                            ad.setRevealedName(a.isSolved() ? a.getDriverName() : null);
                            ad.setAnswerOrder(a.getAnswerOrder());
                            return ad;
                        })
                        .collect(Collectors.toList())
        );

        return dto;
    }
}
