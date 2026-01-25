package overcut.rest.dtos;

import overcut.model.entities.HigherLowerGame;
import java.util.stream.Collectors;

public class HigherLowerConversor {
    public static HigherLowerGameDto toDto(HigherLowerGame game) {
        var entries = game.getEntries().stream()
                .sorted((a,b) -> Integer.compare(a.getPositionIndex(), b.getPositionIndex()))
                .map(e -> new HigherLowerEntryDto(e.getPositionIndex(), e.getPilotName(), e.getStatValue()))
                .collect(Collectors.toList());

        return new HigherLowerGameDto(
                game.getId(),
                game.getStatCode(),
                game.getThemeDescription(),
                game.isFinished(),
                game.getWon(),
                game.getCurrentIndex(),
                game.getScore(),
                entries
        );
    }
}
