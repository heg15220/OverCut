package overcut.model.services;

import overcut.model.entities.DriversLinkGame;

import java.util.List;

public interface DriversLinkGameService {
    DriversLinkGame startGame(Long userId);
    DriversLinkGame guessDriver(Long gameId, String driverGuess);
    DriversLinkGame getGameStatus(Long gameId);
    List<String> autocompletePilotNames(String partial);
    DriversLinkGame skipClue(Long gameId);

}
