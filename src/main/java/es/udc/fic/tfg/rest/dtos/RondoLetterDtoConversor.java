package es.udc.fic.tfg.rest.dtos;
import es.udc.fic.tfg.model.entities.RondoGame;
import es.udc.fic.tfg.model.entities.RondoLetter;

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
