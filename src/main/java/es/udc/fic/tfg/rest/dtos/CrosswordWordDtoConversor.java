package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.CrosswordGame;
import es.udc.fic.tfg.model.entities.CrosswordWord;

import java.util.List;
import java.util.stream.Collectors;

public class CrosswordWordDtoConversor {

    private CrosswordWordDtoConversor() {
    }

    public static final CrosswordWordDto toCrosswordWordDto(CrosswordWord gameWord) {
        CrosswordWordDto crosswordWordDto = new CrosswordWordDto();
        crosswordWordDto.setId(gameWord.getId());

        crosswordWordDto.setGameId(gameWord.getGame().getId());
        crosswordWordDto.setWord(gameWord.getWord());
        crosswordWordDto.setClue(gameWord.getClue());
        crosswordWordDto.setRow(gameWord.getRowIndex());
        crosswordWordDto.setCol(gameWord.getCol());
        crosswordWordDto.setDirection(gameWord.getDirection());

        crosswordWordDto.setCellLinks(
                gameWord.getCellLinks() == null
                        ? null
                        : gameWord.getCellLinks()
                        .stream()
                        .map(CrosswordCellWordLinkConversor::toCrosswordCellWordLinkDto)
                        .collect(Collectors.toList())
        );



        return crosswordWordDto;
    }

    public static final List<CrosswordWordDto> toCrosswordWordDtos(List<CrosswordWord> crosswordWordList) {
        return crosswordWordList.stream().map(CrosswordWordDtoConversor::toCrosswordWordDto).collect(Collectors.toList());
    }
}
