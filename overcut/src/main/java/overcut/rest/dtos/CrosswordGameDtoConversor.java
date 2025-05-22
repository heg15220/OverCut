package overcut.rest.dtos;

import overcut.model.entities.CrosswordGame;

import java.util.List;
import java.util.stream.Collectors;

public class CrosswordGameDtoConversor {

    private CrosswordGameDtoConversor(){

    }

    public static final CrosswordGameDto toCrossWordGameDto(CrosswordGame game) {
        CrosswordGameDto crosswordGameDto = new CrosswordGameDto();
        crosswordGameDto.setId(game.getId());
        crosswordGameDto.setRows(game.getRows());
        crosswordGameDto.setCols(game.getCols());
        crosswordGameDto.setWords(
                game.getWords().stream()
                        .map(CrosswordWordDtoConversor::toCrosswordWordDto)
                        .collect(Collectors.toList())
        );
        return crosswordGameDto;
    }


    public static final List<CrosswordGameDto> toCrosswordGameDtos(List<CrosswordGame> crosswordGames) {
        return crosswordGames.stream().map(CrosswordGameDtoConversor::toCrossWordGameDto).collect(Collectors.toList());
    }
}
