package overcut.model.services;

import overcut.rest.dtos.TeamHistoryGameDto;
import overcut.rest.dtos.ValidateTeamHistoryGuessRequest;
import overcut.rest.dtos.ValidateTeamHistoryGuessResponse;

public interface TeamHistoryGameService {
    TeamHistoryGameDto startGame(String lang, Long userId);
    TeamHistoryGameDto getGame(Long gameId);
    ValidateTeamHistoryGuessResponse validateGuess(ValidateTeamHistoryGuessRequest req);
    TeamHistoryGameDto reveal(Long gameId);
}
