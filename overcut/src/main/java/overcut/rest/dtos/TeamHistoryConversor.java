package overcut.rest.dtos;

import overcut.model.entities.TeamHistoryGame;
import overcut.model.entities.TeamHistorySeason;

import java.util.List;
import java.util.stream.Collectors;

public class TeamHistoryConversor {

    public static TeamHistorySeasonDto toSeasonDto(TeamHistorySeason s, boolean includeCorrect) {
        TeamHistorySeasonDto dto = new TeamHistorySeasonDto();
        dto.seasonYear = s.getSeasonYear();
        dto.userGuess = s.getUserGuess();
        dto.isCorrect = s.getIsCorrect();
        if (includeCorrect) dto.correctPosition = s.getFinishingPosition();
        return dto;
    }

    public static TeamHistoryGameDto toGameDto(
            TeamHistoryGame g,
            List<TeamHistorySeason> seasons,
            String constructorNameOrNull
    ) {
        TeamHistoryGameDto dto = new TeamHistoryGameDto();
        dto.gameId = g.getGameId();
        dto.maxPosition = g.getMaxPosition();
        dto.revealed = g.isRevealed();
        dto.completed = g.isCompleted();
        dto.constructorName = constructorNameOrNull;

        boolean includeCorrect = g.isRevealed();
        dto.seasons = seasons.stream()
                .map(s -> toSeasonDto(s, includeCorrect))
                .collect(Collectors.toList());

        return dto;
    }
}
