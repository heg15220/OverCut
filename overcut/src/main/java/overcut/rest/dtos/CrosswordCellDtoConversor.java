package overcut.rest.dtos;

import overcut.model.entities.CrosswordCell;

import java.util.List;
import java.util.stream.Collectors;

public class CrosswordCellDtoConversor {

    private CrosswordCellDtoConversor(){

    }

    public static CrosswordCellDto toCrosswordCellDto(CrosswordCell cell) {
        CrosswordCellDto dto = new CrosswordCellDto();
        dto.setId(cell.getId());
        dto.setLetter(cell.getLetter());
        dto.setPositionCell(cell.getPositionCell());
        dto.setUserInput(cell.getUserInput());
        dto.setFilled(cell.isFilled());
        dto.setModifiedByUser(cell.isModifiedByUser());
        // ✅ Convertimos los links asociados a la celda
        List<CrosswordCellWordLinkDto> linkDtos = cell.getWordLinks() != null
                ? CrosswordCellWordLinkConversor.toCrosswordCellWordLinkDtos(cell.getWordLinks())
                : List.of();
        dto.setCrosswordCellWordLinkDtoList(linkDtos);
        return dto;
    }


    public static final List<CrosswordCellDto> toCrosswordCellDtos(List<CrosswordCell> crosswordCellList) {
        return crosswordCellList.stream().map(CrosswordCellDtoConversor::toCrosswordCellDto).collect(Collectors.toList());
    }
}
