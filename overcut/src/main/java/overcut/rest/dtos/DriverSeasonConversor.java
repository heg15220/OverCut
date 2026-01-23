package overcut.rest.dtos;


import overcut.model.entities.DriverSeasonGame;
import overcut.model.entities.DriverSeasonRound;

import java.util.List;
import java.util.stream.Collectors;

public class DriverSeasonConversor {

    public static DriverSeasonRoundDto toRoundDto(DriverSeasonRound r, boolean includeCorrect) {
        DriverSeasonRoundDto dto = new DriverSeasonRoundDto();
        dto.raceId = r.getRaceId();
        dto.roundNumber = r.getRoundNumber();
        dto.country = r.getCountry();
        dto.raceNameEn = r.getRaceNameEn();
        dto.raceNameEs = r.getRaceNameEs();
        dto.userGuess = r.getUserGuess();
        dto.isCorrect = r.getIsCorrect();
        if (includeCorrect) dto.correctPosition = r.getFinishingPosition();
        return dto;
    }

    public static DriverSeasonGameDto toGameDto(
            DriverSeasonGame g,
            List<DriverSeasonRound> rounds,
            String driverNameOrNull
    ) {
        DriverSeasonGameDto dto = new DriverSeasonGameDto();
        dto.gameId = g.getGameId();
        dto.seasonYear = g.getSeasonYear();
        dto.maxPosition = g.getMaxPosition();
        dto.revealed = g.isRevealed();
        dto.completed = g.isCompleted();
        dto.driverName = driverNameOrNull;

        boolean includeCorrect = g.isRevealed();
        dto.rounds = rounds.stream()
                .map(r -> toRoundDto(r, includeCorrect))
                .collect(Collectors.toList());

        return dto;
    }
}
