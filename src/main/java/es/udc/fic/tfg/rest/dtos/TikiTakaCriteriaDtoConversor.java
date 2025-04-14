package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.TikiTakaCriteria;
import es.udc.fic.tfg.model.entities.TikiTakaGame;

import java.util.List;
import java.util.stream.Collectors;

public class TikiTakaCriteriaDtoConversor {

    private TikiTakaCriteriaDtoConversor(){

    }

    public static TikiTakaGameBoardDto toTikiTakaGameBoardDto(TikiTakaGame game,
                                                              List<TikiTakaCriteria> rowCriteria,
                                                              List<TikiTakaCriteria> columnCriteria) {

        return new TikiTakaGameBoardDto(
                game.getId(),
                game.getPlayerX(),
                game.getPlayerO(),
                game.getCurrentTurn(),
                game.getStatus(),
                TikiTakaCellDtoConversor.toTikiTakaCellDtos(game.getCells()),
                TikiTakaCriteriaDtoConversor.toTikiTakaCriteriaDtos(rowCriteria),
                TikiTakaCriteriaDtoConversor.toTikiTakaCriteriaDtos(columnCriteria)
        );
    }
    public static List<TikiTakaCriteriaDto> toTikiTakaCriteriaDtos(List<TikiTakaCriteria> criteria) {
        return criteria.stream()
                .map(c -> new TikiTakaCriteriaDto(
                        c.getId(),
                        c.getGame().getId(),
                        c.getAxis(),
                        c.getPositionGame(),
                        c.getDescription(),
                        c.getCode(),
                        c.getImageUrl() // Campo añadido
                ))
                .collect(Collectors.toList());
    }
}
