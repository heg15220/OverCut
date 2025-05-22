package overcut.rest.dtos;

import overcut.model.entities.TikiTakaCell;

import java.util.List;
import java.util.stream.Collectors;

public class TikiTakaCellDtoConversor {

    public static List<TikiTakaCellDto> toTikiTakaCellDtos(List<TikiTakaCell> cells) {
        return cells.stream()
                .map(c -> new TikiTakaCellDto(
                        c.getId(),
                        c.getRowGame(),
                        c.getColumnGame(),
                        c.getFilledBy(),
                        c.getPiloto(),
                        c.isValid()
                ))
                .collect(Collectors.toList());
    }
}
