package overcut.rest.dtos;

import overcut.model.entities.BingoCell;
import overcut.model.entities.BingoGame;
import overcut.model.entities.BingoGameDriver;
import overcut.model.entities.BingoSelection;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class BingoGameConversor {

    private BingoGameConversor() {}

    public static BingoGameDto toDto(BingoGame game) {
        if (game == null) return null;

        BingoGameDto dto = new BingoGameDto();
        dto.setId(game.getId());
        dto.setFinished(game.isFinished());
        dto.setDurationSeconds(game.getDurationSeconds());

        // cells
        List<BingoCellDto> cells = game.getCells().stream()
                .sorted(Comparator.comparingInt(BingoCell::getCellIndex))
                .map(BingoGameConversor::toCellDto)
                .collect(Collectors.toList());
        dto.setCells(cells);

        // drivers queue
        List<BingoDriverDto> queue = game.getDriversQueue().stream()
                .sorted(Comparator.comparingInt(BingoGameDriver::getQueueIndex))
                .map(BingoGameConversor::toDriverDto)
                .collect(Collectors.toList());
        dto.setDriversQueue(queue);

        // selections
        List<BingoSelectionDto> selections = game.getSelections().stream()
                .map(BingoGameConversor::toSelectionDto)
                .collect(Collectors.toList());
        dto.setSelections(selections);

        return dto;
    }

    private static BingoCellDto toCellDto(BingoCell cell) {
        return new BingoCellDto(
                cell.getId(),
                cell.getCellIndex(),
                cell.getThemeCode(),
                cell.getThemeDescription(),
                cell.getThemeImage()
        );
    }

    private static BingoDriverDto toDriverDto(BingoGameDriver d) {
        return new BingoDriverDto(
                d.getQueueIndex(),
                d.getDriverId(),
                d.getDriverName()
        );
    }

    private static BingoSelectionDto toSelectionDto(BingoSelection s) {
        Long cellId = (s.getCell() != null) ? s.getCell().getId() : null;
        return new BingoSelectionDto(
                cellId,
                s.getDriverId(),
                s.getDriverName()
        );
    }
}
