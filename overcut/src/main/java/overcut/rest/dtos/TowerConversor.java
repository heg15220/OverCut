package overcut.rest.dtos;

import overcut.model.entities.TowerAttempt;
import overcut.model.entities.TowerGame;
import java.util.List;
import java.util.stream.Collectors;

public class TowerConversor {

    public static TowerAttemptDto toAttemptDto(TowerAttempt a) {
        TowerAttemptDto dto = new TowerAttemptDto();
        dto.id = a.getId();
        dto.driverId = a.getDriverId();
        dto.driverName = a.getDriverName();
        dto.valid = a.isValid();
        return dto;
    }

    public static TowerGameDto toGameDto(TowerGame g, List<TowerAttempt> history) {
        TowerGameDto dto = new TowerGameDto();
        dto.id = g.getId();
        dto.attempts = g.getAttempts();
        dto.finished = g.isFinished();
        dto.solved = g.isSolved();
        dto.hintAvailable = g.getAttempts() >= 15;
        dto.hintUsed = g.isHintUsed();
        dto.hintType = g.isHintUsed() ? g.getThemeType() : null;

        dto.history = history.stream().map(TowerConversor::toAttemptDto).collect(Collectors.toList());
        return dto;
    }
}
