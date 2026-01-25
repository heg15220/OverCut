package overcut.rest.dtos;

import overcut.model.entities.WhoIsWhoGame;
import overcut.model.entities.WhoIsWhoHint;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class WhoIsWhoGameConversor {

    public static WhoIsWhoGameDto toDto(WhoIsWhoGame game, boolean includeAnswer) {

        List<WhoIsWhoHint> sorted = game.getHints().stream()
                .sorted(Comparator.comparingInt(WhoIsWhoHint::getHintOrder))
                .collect(Collectors.toList());

        int shown = Math.max(0, Math.min(game.getHintsShown(), sorted.size()));

        List<WhoIsWhoHintDto> revealed = sorted.subList(0, shown).stream()
                .map(h -> new WhoIsWhoHintDto(h.getId(), h.getHintOrder(), h.getHintText()))
                .collect(Collectors.toList());

        String answer = null;
        
        if (includeAnswer && game.isFinished()) {
            answer = game.getSecretDriverName();
        }

        

        return new WhoIsWhoGameDto(
                game.getId(),
                game.getCreatedAt(),
                game.isFinished(),
                game.isWon(),
                game.getHintsShown(),
                game.getMaxHints(),
                game.getAttemptsUsed(),
                game.getMaxAttempts(),
                revealed,
                answer
        );
    }
}
