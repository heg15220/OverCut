package overcut.rest.dtos;

import overcut.model.entities.CrosswordCellWordLink;

import java.util.List;
import java.util.stream.Collectors;

public class CrosswordCellWordLinkConversor {

    private CrosswordCellWordLinkConversor() {
    }

    // Convertir de entidad a DTO
    public static CrosswordCellWordLinkDto toCrosswordCellWordLinkDto(CrosswordCellWordLink link) {
        return new CrosswordCellWordLinkDto(
                link.getId(),
                link.getCell().getId(),
                link.getWord().getId(),
                link.getPositionCell()
        );
    }

    // Convertir lista de entidades a lista de DTOs
    public static List<CrosswordCellWordLinkDto> toCrosswordCellWordLinkDtos(List<CrosswordCellWordLink> links) {
        return links.stream()
                .map(CrosswordCellWordLinkConversor::toCrosswordCellWordLinkDto)
                .collect(Collectors.toList());
    }
}
