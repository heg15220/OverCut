package overcut.rest.dtos;

import overcut.model.entities.F1WordleGame;

import java.util.Comparator;
import java.util.stream.Collectors;

public class F1WordleGameConversor {
    public static F1WordleGameDto toDto(F1WordleGame game) {
        F1WordleGameDto dto = new F1WordleGameDto();
        dto.setId(game.getId());
        dto.setFinished(game.isFinished());
        dto.setSuccessful(game.getSuccessful());
        dto.setSurname(game.getSurname());
        dto.setAttempts(game.getAttempts().stream()
                .map(a -> new F1WordleAttemptDto(a.getGuess(), a.getFeedback(), a.getAttemptOrder()))
                .sorted(Comparator.comparingInt(F1WordleAttemptDto::getAttemptOrder))
                .collect(Collectors.toList()));
        return dto;
    }
}
