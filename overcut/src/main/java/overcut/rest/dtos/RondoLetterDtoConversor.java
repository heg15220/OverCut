package overcut.rest.dtos;
import overcut.model.entities.RondoGame;
import overcut.model.entities.RondoLetter;

import java.util.List;
import java.util.stream.Collectors;

public class RondoLetterDtoConversor {
    public static RondoLetterDto toDto(RondoLetter letter) {
        return new RondoLetterDto(letter.getLetter(), letter.getQuestion(), letter.getStatus());
    }

    public static RondoGameDto toDto(RondoGame game) {
        List<RondoLetterDto> letters = game.getPasaPalabraLetterList().stream()
                .map(RondoLetterDtoConversor::toDto).collect(Collectors.toList());

        return new RondoGameDto(game.getId(), game.getStartTime(), game.getEndTime(),
                game.getScore(), game.getStatus(), game.getLanguage(), letters);
    }
}
