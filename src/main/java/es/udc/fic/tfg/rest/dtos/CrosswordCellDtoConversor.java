package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.CrosswordCell;
import es.udc.fic.tfg.model.entities.CrosswordWord;

import java.util.List;
import java.util.stream.Collectors;

public class CrosswordCellDtoConversor {

    private CrosswordCellDtoConversor(){

    }

    public static final CrosswordCellDto toCrosswordCellDto(CrosswordCell gameCell) {
        CrosswordCellDto crosswordCellDto= new CrosswordCellDto();
        crosswordCellDto.setId(gameCell.getId());
        crosswordCellDto.setWordId(gameCell.getWord().getId());
        crosswordCellDto.setLetter(gameCell.getLetter());
        crosswordCellDto.setPositionCell(gameCell.getPositionCell());
        crosswordCellDto.setFilled(gameCell.isFilled());
        crosswordCellDto.setUserInput(gameCell.getUserInput());


        return crosswordCellDto;
    }

    public static final List<CrosswordCellDto> toCrosswordCellDtos(List<CrosswordCell> crosswordCellList) {
        return crosswordCellList.stream().map(CrosswordCellDtoConversor::toCrosswordCellDto).collect(Collectors.toList());
    }
}
