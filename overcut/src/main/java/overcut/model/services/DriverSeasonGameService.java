package overcut.model.services;


import overcut.rest.dtos.DriverSeasonGameDto;
import overcut.rest.dtos.ValidateDriverSeasonGuessRequest;
import overcut.rest.dtos.ValidateDriverSeasonGuessResponse;

public interface DriverSeasonGameService {
    DriverSeasonGameDto startGame(String lang, Long userId);
    DriverSeasonGameDto getGame(Long gameId);
    ValidateDriverSeasonGuessResponse validateGuess(ValidateDriverSeasonGuessRequest req);
    DriverSeasonGameDto reveal(Long gameId);
}
