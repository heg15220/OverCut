package overcut.rest.dtos;

import overcut.model.entities.TikiTakaCriteria;
import overcut.model.entities.TikiTakaGame;

import java.util.List;
import java.util.stream.Collectors;

public class TikiTakaGameBoardDtoConversor {

    private TikiTakaGameBoardDtoConversor() {}

    public static TikiTakaGameBoardDto toTikiTakaGameBoardDto(TikiTakaGame game,
                                                              List<TikiTakaCriteria> rowCriteria,
                                                              List<TikiTakaCriteria> columnCriteria) {

        List<TikiTakaCellDto> cellsDtos = game.getCells().stream()
                .map(c -> new TikiTakaCellDto(
                        c.getId(),
                        c.getRowGame(),
                        c.getColumnGame(),
                        c.getFilledBy(),
                        c.getPiloto(),
                        c.isValid()
                ))
                .collect(Collectors.toList());

        List<TikiTakaCriteriaDto> rowCriteriaDtos = TikiTakaCriteriaDtoConversor.toTikiTakaCriteriaDtos(rowCriteria);

        List<TikiTakaCriteriaDto> columnCriteriaDtos = TikiTakaCriteriaDtoConversor.toTikiTakaCriteriaDtos(columnCriteria);


        return new TikiTakaGameBoardDto(
                game.getId(),
                game.getPlayerX(),
                game.getPlayerO(),
                game.getCurrentTurn(),
                game.getStatus(),
                cellsDtos,
                rowCriteriaDtos,
                columnCriteriaDtos,
                game.isGridMode()
        );

    }
}
