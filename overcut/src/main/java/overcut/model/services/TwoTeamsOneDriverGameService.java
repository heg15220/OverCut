package overcut.model.services;

import overcut.model.entities.TwoTeamsOneDriverGame;

import java.util.List;

public interface TwoTeamsOneDriverGameService {
    TwoTeamsOneDriverGame startGame(Long userId);
    TwoTeamsOneDriverGame guessDriver(Long gameId, String driverGuess);
    TwoTeamsOneDriverGame skipPair(Long gameId);
    TwoTeamsOneDriverGame getGameStatus(Long gameId);
    List<String> autocompletePilotNames(String partial);
}

