package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.TwoTeamsOneDriverGame;
import es.udc.fic.tfg.model.entities.TwoTeamsOneDriverPair;

import java.util.Comparator;
import java.util.stream.Collectors;

public class TwoTeamsOneDriverGameConversor {

    public static TwoTeamsOneDriverGameDto toDto(TwoTeamsOneDriverGame game) {
        TwoTeamsOneDriverGameDto dto = new TwoTeamsOneDriverGameDto();
        dto.setId(game.getId());
        dto.setCreatedAt(game.getCreatedAt());
        dto.setCurrentPairIndex(game.getCurrentPairIndex());
        dto.setFinished(game.isFinished());
        dto.setCorrectAnswers(game.getCorrectAnswers());
        dto.setPairs(
                game.getPairs().stream()
                        .sorted(Comparator.comparingInt(TwoTeamsOneDriverPair::getPairOrder))
                        .map(TwoTeamsOneDriverPairConversor::toDto)
                        .collect(Collectors.toList())
        );
        return dto;
    }
}
